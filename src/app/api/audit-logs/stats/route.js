import {
  protectedRoute,
  successResponse,
  errorResponse,
  permissions,
} from "@/lib/middleware";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/audit-logs/stats
 * Get statistics about audit logs
 */
async function handleGetAuditStats(request) {
  try {
    // Only ADMIN can view audit logs
    if (!permissions.isAdmin(request.auth.user)) {
      return errorResponse("Hanya admin yang dapat melihat audit log", 403);
    }

    const { searchParams } = new URL(request.url);
    const fromStr = searchParams.get("from");
    const toStr = searchParams.get("to");

    const where = {};

    if (fromStr || toStr) {
      where.createdAt = {};

      if (fromStr) {
        const fromDate = new Date(fromStr);
        where.createdAt.gte = fromDate;
      }

      if (toStr) {
        const toDate = new Date(toStr);
        toDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = toDate;
      }
    }

    // Get action counts
    const actionCounts = await prisma.auditLog.groupBy({
      by: ["action"],
      where,
      _count: {
        action: true,
      },
    });

    // Get resource counts
    const resourceCounts = await prisma.auditLog.groupBy({
      by: ["resource"],
      where,
      _count: {
        resource: true,
      },
    });

    // Get total logs
    const totalLogs = await prisma.auditLog.count({ where });

    // Get unique users
    const uniqueUsers = await prisma.auditLog.findMany({
      where,
      select: {
        userId: true,
      },
      distinct: ["userId"],
    });

    return successResponse({
      totalLogs,
      uniqueUsers: uniqueUsers.length,
      byAction: actionCounts.reduce((acc, item) => {
        acc[item.action] = item._count.action;
        return acc;
      }, {}),
      byResource: resourceCounts.reduce((acc, item) => {
        acc[item.resource] = item._count.resource;
        return acc;
      }, {}),
    });
  } catch (error) {
    console.error("Error fetching audit stats:", error);
    return errorResponse("Gagal mengambil statistik audit log", 500);
  }
}

export const GET = protectedRoute(handleGetAuditStats, {
  roles: ["ADMIN"],
});
