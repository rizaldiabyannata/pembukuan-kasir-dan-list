import {
  protectedRoute,
  successResponse,
  errorResponse,
  getClientIp,
  getUserAgent,
} from "@/lib/middleware";
import { prisma } from "@/lib/prisma";
import { logReportAccess } from "@/lib/audit";

/**
 * GET /api/reports/performance
 * Laporan Kinerja Sopir dan Paket Jasa
 *
 * Query params:
 * - from: YYYY-MM-DD (required)
 * - to: YYYY-MM-DD (required)
 */
async function handleGetPerformanceReport(request) {
  try {
    const { searchParams } = new URL(request.url);
    const fromStr = searchParams.get("from");
    const toStr = searchParams.get("to");

    if (!fromStr || !toStr) {
      return errorResponse("from dan to parameter wajib diisi", 400);
    }

    const fromDate = new Date(fromStr);
    const toDate = new Date(toStr);
    toDate.setHours(23, 59, 59, 999); // End of day

    // Fetch transactions within date range with all necessary fields for revenue calculation
    const transactions = await prisma.transaction.findMany({
      where: {
        booking_date: {
          gte: fromDate,
          lte: toDate,
        },
        approval_status: "APPROVED",
        OR: [
          // Include completed transactions (have actual_checkin_datetime)
          { actual_checkin_datetime: { not: null } },
          // Include transactions with down payment
          {
            AND: [{ payment_status: "DOWN_PAYMENT" }, { dp_amount: { gt: 0 } }],
          },
        ],
      },
      include: {
        driver: {
          select: {
            id: true,
            driver_name: true,
            phone_number: true,
          },
        },
        package: {
          select: {
            id: true,
            name: true,
            type: true,
            durationHours: true,
            hotelTiers: true,
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
      },
      orderBy: {
        booking_date: "asc",
      },
    });

    // Import accounting utilities for revenue calculation
    const { calculateTransactionFinancials } = await import("@/lib/accounting");

    // Calculate Driver Performance with revenue data
    const driverPerformanceMap = new Map();

    transactions.forEach((t) => {
      if (!t.driver) return;

      const driverId = t.driver.id;
      const driverName = t.driver.driver_name;

      if (!driverPerformanceMap.has(driverId)) {
        driverPerformanceMap.set(driverId, {
          driverId,
          driverName,
          phoneNumber: t.driver.phone_number,
          totalTrips: 0,
          completedTrips: 0,
          totalWorkingHours: 0,
          totalRevenue: 0,
        });
      }

      const driver = driverPerformanceMap.get(driverId);
      driver.totalTrips += 1;

      // Calculate working hours
      const checkout = new Date(t.checkout_datetime);
      const checkin = t.actual_checkin_datetime
        ? new Date(t.actual_checkin_datetime)
        : new Date(t.checkin_datetime);

      const hours = Math.max(
        0,
        (checkin.getTime() - checkout.getTime()) / (1000 * 60 * 60)
      );

      driver.totalWorkingHours += hours;

      if (t.actual_checkin_datetime) {
        driver.completedTrips += 1;
      }

      // Calculate revenue using accounting.js
      const financials = calculateTransactionFinancials(t);
      driver.totalRevenue += financials.totalPendapatan || 0;
    });

    const driverPerformance = Array.from(driverPerformanceMap.values())
      .map((driver) => {
        const averageHoursPerTrip =
          driver.totalTrips > 0
            ? parseFloat(
                (driver.totalWorkingHours / driver.totalTrips).toFixed(2)
              )
            : 0;
        const completionRate =
          driver.totalTrips > 0
            ? parseFloat(
                ((driver.completedTrips / driver.totalTrips) * 100).toFixed(1)
              )
            : 0;
        const averageRevenuePerTrip =
          driver.totalTrips > 0
            ? Math.round(driver.totalRevenue / driver.totalTrips)
            : 0;

        return {
          ...driver,
          averageHoursPerTrip,
          completionRate,
          averageRevenuePerTrip,
        };
      })
      .sort((a, b) => b.totalTrips - a.totalTrips);

    // Calculate Package Performance with revenue data
    const packagePerformanceMap = new Map();

    transactions.forEach((t) => {
      if (!t.package) return;

      const packageId = t.package.id;
      const packageName = t.package.name;
      const packageType = t.package.type;

      if (!packagePerformanceMap.has(packageId)) {
        packagePerformanceMap.set(packageId, {
          packageId,
          packageName,
          packageType,
          frequency: 0,
          totalTrips: 0,
          totalRevenue: 0,
        });
      }

      const pkg = packagePerformanceMap.get(packageId);
      pkg.frequency += 1;
      pkg.totalTrips += 1;

      // Calculate revenue using accounting.js
      const financials = calculateTransactionFinancials(t);
      pkg.totalRevenue += financials.totalPendapatan || 0;
    });

    // Calculate total revenue for percentage calculation
    const totalRevenue = Array.from(packagePerformanceMap.values()).reduce(
      (sum, pkg) => sum + pkg.totalRevenue,
      0
    );

    const packagePerformance = Array.from(packagePerformanceMap.values())
      .map((pkg) => {
        const averageRevenuePerBooking =
          pkg.totalTrips > 0
            ? Math.round(pkg.totalRevenue / pkg.totalTrips)
            : 0;
        const revenueShare =
          totalRevenue > 0
            ? parseFloat(((pkg.totalRevenue / totalRevenue) * 100).toFixed(1))
            : 0;

        return {
          ...pkg,
          frequency: pkg.frequency,
          totalBookings: pkg.totalTrips,
          averageRevenuePerBooking,
          revenueShare,
        };
      })
      .sort((a, b) => b.frequency - a.frequency);

    // Log report access
    await logReportAccess(
      request.auth.user.id,
      "Performance Report",
      { from: fromStr, to: toStr },
      getClientIp(request),
      getUserAgent(request)
    );

    return successResponse({
      driverPerformance,
      packagePerformance,
      summary: {
        totalDrivers: driverPerformance.length,
        totalPackages: packagePerformance.length,
        totalTrips: transactions.length,
        totalRevenue,
        period: {
          from: fromStr,
          to: toStr,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching performance report:", error);
    return errorResponse("Gagal mengambil data laporan kinerja", 500);
  }
}

export const GET = protectedRoute(handleGetPerformanceReport, {
  roles: ["ADMIN"],
});
