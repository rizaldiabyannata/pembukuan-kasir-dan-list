import {
  protectedRoute,
  successResponse,
  errorResponse,
} from "@/lib/middleware";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/dashboard/incentive-recipients?period=today|month|year
 * Returns incentive recipients data with aggregated amounts and counts
 * Admin only endpoint
 */
async function handleGetIncentiveRecipients(request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "month";

    // Validate period parameter
    const validPeriods = ["today", "month", "year"];
    if (!validPeriods.includes(period)) {
      return errorResponse(
        "Invalid period parameter. Must be one of: today, month, year",
        400,
        { validPeriods }
      );
    }

    // Calculate date range based on period parameter
    const now = new Date();
    let startDate = new Date();

    if (period === "today") {
      startDate.setHours(0, 0, 0, 0);
    } else if (period === "month") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (period === "year") {
      startDate = new Date(now.getFullYear(), 0, 1);
    }

    // Query expenses with category INSENTIF_BONUS and approval_status APPROVED
    // Include related entities (driver, staff, armada)
    const expenses = await prisma.expense.findMany({
      where: {
        category: "INSENTIF_BONUS",
        approval_status: "APPROVED",
        date: {
          gte: startDate,
          lte: now,
        },
      },
      include: {
        driver: {
          select: {
            id: true,
            driver_name: true,
          },
        },
        staff: {
          select: {
            id: true,
            staff_name: true,
          },
        },
        armada: {
          select: {
            id: true,
            license_plate: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    });

    // Aggregate expenses by recipient name (namaPenerima)
    const recipientMap = new Map();

    expenses.forEach((expense) => {
      const recipientName = expense.namaPenerima || "Unknown";

      if (!recipientMap.has(recipientName)) {
        recipientMap.set(recipientName, {
          recipientName,
          totalAmount: 0,
          incentiveCount: 0,
          relatedEntities: [],
        });
      }

      const recipient = recipientMap.get(recipientName);
      recipient.totalAmount += expense.amount;
      recipient.incentiveCount += 1;

      // Extract related entity information
      if (expense.driver) {
        const existingDriver = recipient.relatedEntities.find(
          (e) => e.type === "driver" && e.id === expense.driver.id
        );
        if (!existingDriver) {
          recipient.relatedEntities.push({
            type: "driver",
            name: expense.driver.driver_name,
            id: expense.driver.id,
          });
        }
      }

      if (expense.staff) {
        const existingStaff = recipient.relatedEntities.find(
          (e) => e.type === "staff" && e.id === expense.staff.id
        );
        if (!existingStaff) {
          recipient.relatedEntities.push({
            type: "staff",
            name: expense.staff.staff_name,
            id: expense.staff.id,
          });
        }
      }

      if (expense.armada) {
        const existingArmada = recipient.relatedEntities.find(
          (e) => e.type === "armada" && e.id === expense.armada.id
        );
        if (!existingArmada) {
          recipient.relatedEntities.push({
            type: "armada",
            name: expense.armada.license_plate,
            id: expense.armada.id,
          });
        }
      }
    });

    // Convert map to array and sort by total amount (descending)
    const recipients = Array.from(recipientMap.values()).sort(
      (a, b) => b.totalAmount - a.totalAmount
    );

    // Build summary statistics
    const summary = {
      totalRecipients: recipients.length,
      totalAmount: recipients.reduce((sum, r) => sum + r.totalAmount, 0),
      totalIncentives: expenses.length,
    };

    // Return response using successResponse format
    return successResponse(
      {
        recipients,
        summary,
        period,
      },
      "Incentive recipients data retrieved successfully"
    );
  } catch (error) {
    console.error("Incentive recipients API error:", error);
    return errorResponse(
      "Failed to fetch incentive recipients data",
      500,
      process.env.NODE_ENV === "development" ? { message: error.message } : null
    );
  }
}

export const GET = protectedRoute(handleGetIncentiveRecipients, {
  roles: ["ADMIN"],
});
