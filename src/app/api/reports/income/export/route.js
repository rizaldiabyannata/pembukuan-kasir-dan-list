import {
  protectedRoute,
  successResponse,
  errorResponse,
  permissions,
  rateLimitPresets,
} from "@/lib/middleware";
import { prisma } from "@/lib/prisma";
import { calculateTransactionFinancials } from "@/lib/accounting";
import { logReportAccess } from "@/lib/audit";

/**
 * GET /api/reports/income/export?from=YYYY-MM-DD&to=YYYY-MM-DD&packageType=CAR_RENTAL|TOUR_PACKAGE|FULL_DAY_TRIP&format=csv|excel
 * Exports income report data in CSV or Excel format
 */
async function handleExportIncomeReport(request) {
  try {
    // Check permissions - only ADMIN can view reports (financial data)
    if (!permissions.canViewReports(request.auth.user)) {
      return errorResponse("Insufficient permissions", 403);
    }

    const url = new URL(request.url);
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const packageType = url.searchParams.get("packageType"); // Optional filter
    const format = url.searchParams.get("format") || "csv"; // csv or excel

    if (!from || !to) {
      return errorResponse("Rentang tanggal wajib diisi", 400);
    }

    if (!["csv", "excel"].includes(format)) {
      return errorResponse("Format harus csv atau excel", 400);
    }

    // Parse date dan set waktu dengan benar
    const fromDate = new Date(from);
    fromDate.setHours(0, 0, 0, 0);

    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);

    // Build where clause for transactions
    const whereClause = {
      booking_date: { gte: fromDate, lte: toDate },
      // Only include transactions that have a package (paid services)
      packageId: { not: null },
      approval_status: "APPROVED",
      OR: [
        // Include completed transactions (have actual_checkin_datetime)
        { actual_checkin_datetime: { not: null } },
        // Include transactions with down payment
        {
          AND: [{ payment_status: "DOWN_PAYMENT" }, { dp_amount: { gt: 0 } }],
        },
      ],
    };

    // Add package type filter if specified
    if (packageType) {
      whereClause.package = {
        type: packageType,
      };
    }

    // Fetch transactions with package details - ensure all relations are included
    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      include: {
        package: {
          select: {
            id: true,
            name: true,
            type: true,
            price: true,
            durationHours: true,
          },
        },
        armada: {
          select: {
            id: true,
            license_plate: true,
            brand: true,
            model: true,
          },
        },
        driver: {
          select: {
            id: true,
            driver_name: true,
          },
        },
      },
      orderBy: {
        booking_date: "desc",
      },
    });

    // Validate data before processing
    if (transactions.length === 0) {
      console.warn("No transactions found for the specified date range");
    }

    // Group transactions by package and calculate metrics
    const packageGroups = new Map();
    let validationWarnings = [];

    for (const tx of transactions) {
      // Validate transaction data
      if (!tx.package) {
        validationWarnings.push(
          `Transaction ${tx.invoice_code} missing package data`
        );
        continue;
      }

      const packageId = tx.package.id;
      const packageName = tx.package.name;
      const packageType = tx.package.type;

      if (!packageGroups.has(packageId)) {
        packageGroups.set(packageId, {
          packageId,
          packageName,
          packageType,
          transactionCount: 0,
          totalRevenue: 0,
          totalOvertimeRevenue: 0,
          totalBaseRevenue: 0,
          averageRevenue: 0,
          transactions: [],
        });
      }

      const group = packageGroups.get(packageId);
      const financials = calculateTransactionFinancials(tx);

      // Validate financial calculations
      if (
        !financials ||
        financials.totalPendapatan === undefined ||
        financials.totalPendapatan === null
      ) {
        validationWarnings.push(
          `Transaction ${tx.invoice_code} has invalid financial calculations`
        );
        continue;
      }

      group.transactionCount += 1;
      group.totalRevenue += financials.totalPendapatan;
      group.totalOvertimeRevenue += financials.biayaOvertime || 0;
      group.totalBaseRevenue += financials.tarifSewa || 0;
      group.transactions.push({
        id: tx.id,
        invoice_code: tx.invoice_code,
        customer_name: tx.customer_name,
        booking_date: tx.booking_date.toISOString().split("T")[0],
        totalRevenue: financials.totalPendapatan,
        overtimeRevenue: financials.biayaOvertime || 0,
        baseRevenue: financials.tarifSewa || 0,
        // Use correct field accessors for nested objects
        armada: tx.armada
          ? `${tx.armada.brand} ${tx.armada.model} (${tx.armada.license_plate})`
          : "-",
        driver: tx.driver?.driver_name || "-",
        package: tx.package,
      });
    }

    // Log validation warnings if any
    if (validationWarnings.length > 0) {
      console.warn("Income export validation warnings:", validationWarnings);
    }

    // Convert to array and calculate averages
    const incomeByPackage = Array.from(packageGroups.values()).map((group) => ({
      ...group,
      averageRevenue:
        group.transactionCount > 0
          ? Math.round(group.totalRevenue / group.transactionCount)
          : 0,
    }));

    // Sort by total revenue descending
    incomeByPackage.sort((a, b) => b.totalRevenue - a.totalRevenue);

    // Generate CSV content
    let csvContent = "";

    if (format === "csv") {
      // CSV Header
      csvContent =
        "Jenis Paket,Nama Paket,Jumlah Transaksi,Total Pemasukan,Rata-rata per Transaksi,Tarif Dasar,Overtime\n";

      // Package summary rows
      for (const pkg of incomeByPackage) {
        csvContent += `"${pkg.packageType}","${pkg.packageName}",${pkg.transactionCount},${pkg.totalRevenue},${pkg.averageRevenue},${pkg.totalBaseRevenue},${pkg.totalOvertimeRevenue}\n`;
      }

      // Add separator
      csvContent += "\nDetail Transaksi per Paket\n\n";

      // Transaction details for each package
      for (const pkg of incomeByPackage) {
        csvContent += `"Detail untuk: ${pkg.packageName}"\n`;
        csvContent +=
          "Invoice,Pelanggan,Tanggal,Armada,Sopir,Tarif Dasar,Overtime,Total\n";

        for (const tx of pkg.transactions) {
          csvContent += `"${tx.invoice_code}","${tx.customer_name}","${tx.booking_date}","${tx.armada}","${tx.driver}",${tx.baseRevenue},${tx.overtimeRevenue},${tx.totalRevenue}\n`;
        }
        csvContent += "\n";
      }
    }

    // Log report access for audit trail
    await logReportAccess(
      request.auth.user.id,
      "pemasukan_export",
      { from, to, packageType, format },
      request.auth.ipAddress,
      request.auth.userAgent
    );

    // Return CSV file
    const fileName = `laporan-pemasukan-${from}-to-${to}${packageType ? `-${packageType}` : ""}.${format === "csv" ? "csv" : "xlsx"}`;

    return new Response(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error("Error exporting income report:", error);
    console.error("Error stack:", error.stack);

    // Provide more specific error messages
    if (error.message?.includes("Prisma")) {
      return errorResponse(
        "Gagal mengambil data dari database. Silakan coba lagi.",
        500
      );
    }

    if (error.message?.includes("date")) {
      return errorResponse("Format tanggal tidak valid", 400);
    }

    return errorResponse(
      "Gagal mengekspor laporan pemasukan. Silakan coba lagi.",
      500
    );
  }
}

// Only ADMIN can export income reports (financial data)
export const GET = protectedRoute(handleExportIncomeReport, {
  roles: ["ADMIN"],
  rateLimit: rateLimitPresets.exports, // Lower rate limit for exports
});
