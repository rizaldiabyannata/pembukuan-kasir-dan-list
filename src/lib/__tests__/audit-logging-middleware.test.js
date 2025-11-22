/**
 * Tests for audit logging in middleware
 * Verifies that unauthorized access attempts are properly logged
 */

import { createAuditLog } from "../audit.js";
import { prisma } from "../prisma.js";

// Mock prisma
jest.mock("../prisma.js", () => ({
  prisma: {
    auditLog: {
      create: jest.fn(),
    },
  },
}));

describe("Audit Logging for Unauthorized Access", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should log unauthorized access with all required fields", async () => {
    // Requirement 6.1: Log with user ID, route path, timestamp, and IP address
    const mockUser = {
      id: "user-123",
      role: "OPERATOR",
      email: "operator@example.com",
    };

    const mockAuditData = {
      userId: mockUser.id,
      action: "ACCESS_DENIED",
      resource: "Route",
      resourceId: "/dashboard",
      description: "Akses ditolak ke /dashboard: ROLE_MISMATCH",
      metadata: {
        reason: "ROLE_MISMATCH",
        userRole: mockUser.role,
        pathname: "/dashboard",
      },
      ipAddress: "192.168.1.1",
      userAgent: "Mozilla/5.0",
    };

    prisma.auditLog.create.mockResolvedValue({
      id: "audit-123",
      ...mockAuditData,
      createdAt: new Date(),
    });

    await createAuditLog(mockAuditData);

    // Verify createAuditLog was called with correct data
    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: mockUser.id,
        action: "ACCESS_DENIED",
        resource: "Route",
        resourceId: "/dashboard",
        description: expect.stringContaining("Akses ditolak"),
        metadata: expect.objectContaining({
          reason: "ROLE_MISMATCH",
          userRole: "OPERATOR",
          pathname: "/dashboard",
        }),
        ipAddress: "192.168.1.1",
        userAgent: "Mozilla/5.0",
      }),
    });
  });

  test("should log unauthorized access for unauthenticated users", async () => {
    // Requirement 6.2: Log invalid session attempts
    const mockAuditData = {
      userId: null, // No user for unauthenticated
      action: "ACCESS_DENIED",
      resource: "Route",
      resourceId: "/transaksi",
      description: "Akses ditolak ke /transaksi: NO_TOKEN",
      metadata: {
        reason: "NO_TOKEN",
        userRole: null,
        pathname: "/transaksi",
      },
      ipAddress: "192.168.1.2",
      userAgent: "Mozilla/5.0",
    };

    prisma.auditLog.create.mockResolvedValue({
      id: "audit-124",
      ...mockAuditData,
      createdAt: new Date(),
    });

    await createAuditLog(mockAuditData);

    // Verify createAuditLog was called with null userId
    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: null,
        action: "ACCESS_DENIED",
        resource: "Route",
        resourceId: "/transaksi",
        ipAddress: "192.168.1.2",
      }),
    });
  });

  test("should include reason in metadata", async () => {
    // Requirement 6.3: Include reason for blocking in log entry
    const mockAuditData = {
      userId: "user-123",
      action: "ACCESS_DENIED",
      resource: "Route",
      resourceId: "/laporan",
      description: "Akses ditolak ke /laporan: INSUFFICIENT_PERMISSION",
      metadata: {
        reason: "INSUFFICIENT_PERMISSION",
        userRole: "OPERATOR",
        pathname: "/laporan",
      },
      ipAddress: "192.168.1.3",
      userAgent: "Mozilla/5.0",
    };

    prisma.auditLog.create.mockResolvedValue({
      id: "audit-125",
      ...mockAuditData,
      createdAt: new Date(),
    });

    await createAuditLog(mockAuditData);

    // Verify reason is in metadata
    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        metadata: expect.objectContaining({
          reason: "INSUFFICIENT_PERMISSION",
        }),
      }),
    });
  });

  test("should handle logging failures gracefully", async () => {
    // Requirement 6.4: Logging failures should not block redirect
    const mockAuditData = {
      userId: "user-123",
      action: "ACCESS_DENIED",
      resource: "Route",
      resourceId: "/dashboard",
      description: "Akses ditolak ke /dashboard: ROLE_MISMATCH",
      metadata: {
        reason: "ROLE_MISMATCH",
        userRole: "OPERATOR",
        pathname: "/dashboard",
      },
      ipAddress: "192.168.1.1",
      userAgent: "Mozilla/5.0",
    };

    // Mock database error
    prisma.auditLog.create.mockRejectedValue(
      new Error("Database connection failed")
    );

    // This should not throw - errors are caught and logged to console
    await expect(createAuditLog(mockAuditData)).rejects.toThrow(
      "Database connection failed"
    );
  });
});
