/**
 * Property-Based Tests for Session Cleanup
 * Feature: session-token-collision-fix
 */

import fc from "fast-check";
import { prisma } from "../prisma";
import { cleanupUserExpiredSessions, cleanupExpiredSessions } from "../auth";

// Mock console methods to avoid cluttering test output
beforeAll(() => {
  jest.spyOn(console, "info").mockImplementation(() => {});
  jest.spyOn(console, "warn").mockImplementation(() => {});
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterAll(() => {
  jest.restoreAllMocks();
});

describe("Session Cleanup - Property-Based Tests", () => {
  // Helper to create a test user
  const createTestUser = async (email, username) => {
    return await prisma.user.create({
      data: {
        email,
        username,
        password: "hashed_password",
        name: "Test User",
        role: "OPERATOR",
        isActive: true,
      },
    });
  };

  // Helper to create sessions with specific expiry dates
  const createSession = async (userId, token, expiresAt) => {
    return await prisma.session.create({
      data: {
        userId,
        token,
        expiresAt,
        ipAddress: "127.0.0.1",
        userAgent: "test-agent",
      },
    });
  };

  // Cleanup after each test
  afterEach(async () => {
    await prisma.session.deleteMany({});
    await prisma.user.deleteMany({});
  });

  /**
   * Feature: session-token-collision-fix, Property 3: Expired Session Cleanup
   * Validates: Requirements 2.1, 2.3
   *
   * For any user with expired sessions, when a new login occurs,
   * all expired sessions for that user should be removed before the new session is created.
   */
  describe("Property 3: Expired Session Cleanup", () => {
    it("should remove only expired sessions for a specific user", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            expiredCount: fc.integer({ min: 1, max: 5 }),
            validCount: fc.integer({ min: 1, max: 5 }),
          }),
          async ({ expiredCount, validCount }) => {
            // Create a test user
            const user = await createTestUser(
              `test-${Date.now()}-${Math.random()}@example.com`,
              `testuser-${Date.now()}-${Math.random()}`
            );

            const now = new Date();

            // Create expired sessions (in the past)
            const expiredSessions = [];
            for (let i = 0; i < expiredCount; i++) {
              const expiredDate = new Date(now);
              expiredDate.setDate(expiredDate.getDate() - (i + 1)); // 1-5 days ago
              const session = await createSession(
                user.id,
                `expired-token-${i}-${Date.now()}-${Math.random()}`,
                expiredDate
              );
              expiredSessions.push(session);
            }

            // Create valid sessions (in the future)
            const validSessions = [];
            for (let i = 0; i < validCount; i++) {
              const futureDate = new Date(now);
              futureDate.setDate(futureDate.getDate() + (i + 1)); // 1-5 days from now
              const session = await createSession(
                user.id,
                `valid-token-${i}-${Date.now()}-${Math.random()}`,
                futureDate
              );
              validSessions.push(session);
            }

            // Run cleanup
            const deletedCount = await cleanupUserExpiredSessions(user.id);

            // Verify: deleted count should equal expired count
            expect(deletedCount).toBe(expiredCount);

            // Verify: all expired sessions should be gone
            for (const expiredSession of expiredSessions) {
              const found = await prisma.session.findUnique({
                where: { id: expiredSession.id },
              });
              expect(found).toBeNull();
            }

            // Verify: all valid sessions should still exist
            for (const validSession of validSessions) {
              const found = await prisma.session.findUnique({
                where: { id: validSession.id },
              });
              expect(found).not.toBeNull();
              expect(found.id).toBe(validSession.id);
            }

            // Verify: total remaining sessions should equal valid count
            const remainingSessions = await prisma.session.count({
              where: { userId: user.id },
            });
            expect(remainingSessions).toBe(validCount);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should not affect sessions of other users", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            user1ExpiredCount: fc.integer({ min: 1, max: 3 }),
            user1ValidCount: fc.integer({ min: 1, max: 3 }),
            user2ExpiredCount: fc.integer({ min: 1, max: 3 }),
            user2ValidCount: fc.integer({ min: 1, max: 3 }),
          }),
          async ({
            user1ExpiredCount,
            user1ValidCount,
            user2ExpiredCount,
            user2ValidCount,
          }) => {
            // Create two test users
            const user1 = await createTestUser(
              `user1-${Date.now()}-${Math.random()}@example.com`,
              `user1-${Date.now()}-${Math.random()}`
            );
            const user2 = await createTestUser(
              `user2-${Date.now()}-${Math.random()}@example.com`,
              `user2-${Date.now()}-${Math.random()}`
            );

            const now = new Date();

            // Create sessions for user1
            for (let i = 0; i < user1ExpiredCount; i++) {
              const expiredDate = new Date(now);
              expiredDate.setDate(expiredDate.getDate() - (i + 1));
              await createSession(
                user1.id,
                `user1-expired-${i}-${Date.now()}-${Math.random()}`,
                expiredDate
              );
            }
            for (let i = 0; i < user1ValidCount; i++) {
              const futureDate = new Date(now);
              futureDate.setDate(futureDate.getDate() + (i + 1));
              await createSession(
                user1.id,
                `user1-valid-${i}-${Date.now()}-${Math.random()}`,
                futureDate
              );
            }

            // Create sessions for user2
            for (let i = 0; i < user2ExpiredCount; i++) {
              const expiredDate = new Date(now);
              expiredDate.setDate(expiredDate.getDate() - (i + 1));
              await createSession(
                user2.id,
                `user2-expired-${i}-${Date.now()}-${Math.random()}`,
                expiredDate
              );
            }
            for (let i = 0; i < user2ValidCount; i++) {
              const futureDate = new Date(now);
              futureDate.setDate(futureDate.getDate() + (i + 1));
              await createSession(
                user2.id,
                `user2-valid-${i}-${Date.now()}-${Math.random()}`,
                futureDate
              );
            }

            // Run cleanup for user1 only
            const deletedCount = await cleanupUserExpiredSessions(user1.id);

            // Verify: deleted count should equal user1's expired count
            expect(deletedCount).toBe(user1ExpiredCount);

            // Verify: user1 should have only valid sessions remaining
            const user1Sessions = await prisma.session.count({
              where: { userId: user1.id },
            });
            expect(user1Sessions).toBe(user1ValidCount);

            // Verify: user2 should have all sessions (expired + valid) still present
            const user2Sessions = await prisma.session.count({
              where: { userId: user2.id },
            });
            expect(user2Sessions).toBe(user2ExpiredCount + user2ValidCount);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should handle cleanup when user has no expired sessions", async () => {
      await fc.assert(
        fc.asyncProperty(fc.integer({ min: 1, max: 5 }), async (validCount) => {
          // Create a test user
          const user = await createTestUser(
            `test-${Date.now()}-${Math.random()}@example.com`,
            `testuser-${Date.now()}-${Math.random()}`
          );

          const now = new Date();

          // Create only valid sessions (no expired ones)
          for (let i = 0; i < validCount; i++) {
            const futureDate = new Date(now);
            futureDate.setDate(futureDate.getDate() + (i + 1));
            await createSession(
              user.id,
              `valid-token-${i}-${Date.now()}-${Math.random()}`,
              futureDate
            );
          }

          // Run cleanup
          const deletedCount = await cleanupUserExpiredSessions(user.id);

          // Verify: no sessions should be deleted
          expect(deletedCount).toBe(0);

          // Verify: all sessions should still exist
          const remainingSessions = await prisma.session.count({
            where: { userId: user.id },
          });
          expect(remainingSessions).toBe(validCount);
        }),
        { numRuns: 100 }
      );
    });

    it("should handle cleanup when user has no sessions at all", async () => {
      await fc.assert(
        fc.asyncProperty(fc.constant(null), async () => {
          // Create a test user with no sessions
          const user = await createTestUser(
            `test-${Date.now()}-${Math.random()}@example.com`,
            `testuser-${Date.now()}-${Math.random()}`
          );

          // Run cleanup
          const deletedCount = await cleanupUserExpiredSessions(user.id);

          // Verify: no sessions should be deleted
          expect(deletedCount).toBe(0);

          // Verify: user still has no sessions
          const remainingSessions = await prisma.session.count({
            where: { userId: user.id },
          });
          expect(remainingSessions).toBe(0);
        }),
        { numRuns: 100 }
      );
    });

    it("should handle global cleanup across all users", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userCount: fc.integer({ min: 2, max: 4 }),
            expiredPerUser: fc.integer({ min: 1, max: 3 }),
            validPerUser: fc.integer({ min: 1, max: 3 }),
          }),
          async ({ userCount, expiredPerUser, validPerUser }) => {
            // Clean up before this iteration to ensure clean state
            await prisma.session.deleteMany({});
            await prisma.user.deleteMany({});

            const users = [];
            const now = new Date();

            // Create multiple users with sessions
            for (let u = 0; u < userCount; u++) {
              const user = await createTestUser(
                `user${u}-${Date.now()}-${Math.random()}@example.com`,
                `user${u}-${Date.now()}-${Math.random()}`
              );
              users.push(user);

              // Create expired sessions
              for (let i = 0; i < expiredPerUser; i++) {
                const expiredDate = new Date(now);
                expiredDate.setDate(expiredDate.getDate() - (i + 1));
                await createSession(
                  user.id,
                  `user${u}-expired-${i}-${Date.now()}-${Math.random()}`,
                  expiredDate
                );
              }

              // Create valid sessions
              for (let i = 0; i < validPerUser; i++) {
                const futureDate = new Date(now);
                futureDate.setDate(futureDate.getDate() + (i + 1));
                await createSession(
                  user.id,
                  `user${u}-valid-${i}-${Date.now()}-${Math.random()}`,
                  futureDate
                );
              }
            }

            // Run global cleanup
            const deletedCount = await cleanupExpiredSessions();

            // Verify: deleted count should equal total expired sessions
            const expectedDeleted = userCount * expiredPerUser;
            expect(deletedCount).toBe(expectedDeleted);

            // Verify: each user should have only valid sessions remaining
            for (const user of users) {
              const userSessions = await prisma.session.count({
                where: { userId: user.id },
              });
              expect(userSessions).toBe(validPerUser);
            }

            // Verify: total remaining sessions across all users
            const totalRemaining = await prisma.session.count({});
            expect(totalRemaining).toBe(userCount * validPerUser);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
