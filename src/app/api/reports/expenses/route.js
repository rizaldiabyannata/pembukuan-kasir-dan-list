import {
  protectedRoute,
  successResponse,
  errorResponse,
  permissions,
  rateLimitPresets,
  getClientIp,
  getUserAgent,
} from "@/lib/middleware";
import { prisma } from "@/lib/prisma";
import { logReportAccess } from "@/lib/audit";

/**
 * GET /api/reports/expenses
 * Get expense reports with pivot/grouping functionality
 * Query parameters:
 * - from: Start date filter (YYYY-MM-DD)
 * - to: End date filter (YYYY-MM-DD)
 * - paymentMonth: Filter by payment month (YYYY-MM-DD)
 * - category: Filter by specific category
 * - groupBy: 'category' (default) or 'month' for different grouping
 */
async function handleGetExpenseReport(request) {
  try {
    // Check permissions - only ADMIN can view reports (financial data)
    if (!permissions.canViewReports(request.auth.user)) {
      return errorResponse("Insufficient permissions", 403);
    }

    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const paymentMonth = searchParams.get("paymentMonth");
    const category = searchParams.get("category");
    const groupBy = searchParams.get("groupBy") || "category"; // 'category' or 'month'

    // Build where clause
    const where = {
      approval_status: "APPROVED",
    };

    if (from && to) {
      // Parse date dan set waktu dengan benar
      // from: start of day (00:00:00)
      // to: end of day (23:59:59)
      const fromDate = new Date(from);
      fromDate.setHours(0, 0, 0, 0);

      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);

      where.date = {
        gte: fromDate,
        lte: toDate,
      };
    } else if (from) {
      const fromDate = new Date(from);
      fromDate.setHours(0, 0, 0, 0);
      where.date = {
        gte: fromDate,
      };
    } else if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      where.date = {
        lte: toDate,
      };
    }

    if (paymentMonth) {
      where.paymentMonth = new Date(paymentMonth);
    }

    if (category) {
      where.category = category;
    }

    // Get all expenses with filters - ensure all relations are included
    const expenses = await prisma.expense.findMany({
      where,
      include: {
        armada: {
          select: { id: true, license_plate: true, brand: true, model: true },
        },
        driver: {
          select: { id: true, driver_name: true, nik: true },
        },
        staff: {
          select: { id: true, staff_name: true, position: true },
        },
        attachments: {
          select: {
            id: true,
            fileName: true,
            fileSize: true,
            mimeType: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    });

    // Validate data before processing
    const { validateExpenseForExport } = await import("@/lib/excel-export");
    const validationWarnings = [];

    expenses.forEach((expense, index) => {
      const validation = validateExpenseForExport(expense);
      if (!validation.isValid) {
        validationWarnings.push({
          expenseId: expense.id,
          index,
          warnings: validation.warnings,
        });
      }
    });

    // Log validation warnings if any
    if (validationWarnings.length > 0) {
      console.warn("Expense data validation warnings:", validationWarnings);
    }

    // Group expenses based on groupBy parameter
    let groupedData = {};

    if (groupBy === "month") {
      // Group by month (YYYY-MM format)
      groupedData = expenses.reduce((acc, expense) => {
        const monthKey = expense.date.toISOString().substring(0, 7); // YYYY-MM

        if (!acc[monthKey]) {
          acc[monthKey] = {
            period: monthKey,
            totalAmount: 0,
            categories: {},
            expenses: [],
          };
        }

        acc[monthKey].totalAmount += expense.amount;
        acc[monthKey].expenses.push(expense);

        // Also group by category within each month
        if (!acc[monthKey].categories[expense.category]) {
          acc[monthKey].categories[expense.category] = {
            category: expense.category,
            totalAmount: 0,
            count: 0,
            expenses: [],
          };
        }

        acc[monthKey].categories[expense.category].totalAmount +=
          expense.amount;
        acc[monthKey].categories[expense.category].count += 1;
        acc[monthKey].categories[expense.category].expenses.push(expense);

        return acc;
      }, {});
    } else {
      // Default: Group by category
      groupedData = expenses.reduce((acc, expense) => {
        const categoryKey = expense.category;

        if (!acc[categoryKey]) {
          acc[categoryKey] = {
            category: categoryKey,
            totalAmount: 0,
            count: 0,
            expenses: [],
          };
        }

        acc[categoryKey].totalAmount += expense.amount;
        acc[categoryKey].count += 1;
        acc[categoryKey].expenses.push(expense);

        return acc;
      }, {});
    }

    // Convert to array and calculate summary
    const groupedArray = Object.values(groupedData);
    const summary = {
      totalExpenses: expenses.length,
      totalAmount: expenses.reduce((sum, exp) => sum + exp.amount, 0),
      categoriesCount:
        groupBy === "category"
          ? groupedArray.length
          : Object.keys(groupedArray[0]?.categories || {}).length,
      dateRange: {
        from: from || null,
        to: to || null,
      },
      filters: {
        paymentMonth: paymentMonth || null,
        category: category || null,
        groupBy,
      },
    };

    // Log report access
    await logReportAccess(
      request.auth.user.id,
      "Expenses Report",
      { from, to, category, groupBy },
      getClientIp(request),
      getUserAgent(request)
    );

    return successResponse({
      summary,
      data: groupedArray,
      rawExpenses: expenses, // Include raw data for detailed view
    });
  } catch (error) {
    console.error("Error generating expense report:", error);

    // Provide more specific error messages
    if (error.code === "P2025") {
      return errorResponse("Data tidak ditemukan", 404);
    }

    if (error.name === "PrismaClientKnownRequestError") {
      return errorResponse(
        "Kesalahan database saat mengambil data pengeluaran",
        500
      );
    }

    return errorResponse(
      "Gagal membuat laporan pengeluaran. Silakan coba lagi atau hubungi administrator.",
      500
    );
  }
}

// Only ADMIN can view reports (financial data)
// Use reports rate limit for flexible data viewing
export const GET = protectedRoute(handleGetExpenseReport, {
  roles: ["ADMIN"],
  rateLimit: rateLimitPresets.reports, // 600 requests per minute
});
