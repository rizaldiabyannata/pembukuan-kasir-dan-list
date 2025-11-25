/**
 * Property-Based Tests for Session Independence
 * Feature: session-token-collision-fix
 * @jest-environment node
 */

// Set environment variable BEFORE importing auth module
process.env.JWT_SECRET =
  "test-jwt-secret-key-for-testing-purposes-minimum-32-characters";

import fc from "fast-check";
import { prisma } from "../prisma";
import { createSession, deleteSession } from "../auth";

// Mock console methods to avoid cluttering test output
beforeAll(() => {
  jest.spyOn(console, "info").mockImplementation(() => {});
  jest.spyOn(console, "warn").mockImplementation(() => {});
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterAll(() => {
  jest.restoreAllMocks();
});

describe("Session Independence - Property-Based Tests", () => {
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

  // Cleanup after all tests
  afterAll(async () => {
    await prisma.session.deleteMany({});
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: "test-",
        },
      },
    });
  });

  /**
   * Feature: session-token-collision-fix, Property 4: Session Independence
   * Validates: Requirements 4.1, 4.2, 4.3
   *
   * For any user with multiple active sessions, logging out from one session
   * should not affect the validity of other active sessions.
   */
  describe("Property 4: Session Independence", () => {
    it("should allow multiple sessions for same user to coexist", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 2, max: 5 }),
          async (sessionCount) => {
            // Create a test user
            const user = await createTestUser(
              `test-${Date.now()}-${Math.random()}@example.com`,
              `testuser-${Date.now()}-${Math.random()}`
            );

            // Create multiple sessions for the same user
            const sessions = [];
            for (let i = 0; i < sessionCount; i++) {
              const session = await createSession(
                user.id,
                `192.168.1.${i}`,
                `UserAgent-${i}`
              );
              sessions.push(session);
            }

            // Verify: all sessions exist in database
            const totalSessions = await prisma.session.count({
              where: { userId: user.id },
            });
            expect(totalSessions).toBe(sessionCount);

            // Verify: all sessions have unique tokens
            const tokens = sessions.map((s) => s.token);
            const uniqueTokens = new Set(tokens);
            expect(uniqueTokens.size).toBe(sessionCount);

            // Verify: all sessions have unique IDs
            const ids = sessions.map((s) => s.id);
            const uniqueIds = new Set(ids);
            expect(uniqueIds.size).toBe(sessionCount);

            // Verify: each session can be retrieved independently
            for (const session of sessions) {
              const found = await prisma.session.findUnique({
                where: { id: session.id },
              });
              expect(found).not.toBeNull();
              expect(found.userId).toBe(user.id);
              expect(found.token).toBe(session.token);
            }

            // Cleanup: delete user and sessions
            await prisma.session.deleteMany({ where: { userId: user.id } });
            await prisma.user.delete({ where: { id: user.id } });
          }
        ),
        { numRuns: 50 }
      );
    });

    it("should delete only the specified session without affecting others", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            totalSessions: fc.integer({ min: 3, max: 5 }),
            deleteIndex: fc.integer({ min: 0, max: 4 }),
          }),
          async ({ totalSessions, deleteIndex }) => {
            // Ensure deleteIndex is within bounds
            const safeDeleteIndex = deleteIndex % totalSessions;

            // Create a test user
            const user = await createTestUser(
              `test-${Date.now()}-${Math.random()}@example.com`,
              `testuser-${Date.now()}-${Math.random()}`
            );

            // Create multiple sessions
            const sessions = [];
            for (let i = 0; i < totalSessions; i++) {
              const session = await createSession(
                user.id,
                `192.168.1.${i}`,
                `UserAgent-${i}`
              );
              sessions.push(session);
            }

            // Delete one specific session
            const sessionToDelete = sessions[safeDeleteIndex];
            await deleteSession(sessionToDelete.token);

            // Verify: the deleted session no longer exists
            const deletedSession = await prisma.session.findUnique({
              where: { id: sessionToDelete.id },
            });
            expect(deletedSession).toBeNull();

            // Verify: all other sessions still exist
            for (let i = 0; i < sessions.length; i++) {
              if (i !== safeDeleteIndex) {
                const session = sessions[i];
                const found = await prisma.session.findUnique({
                  where: { id: session.id },
                });
                expect(found).not.toBeNull();
                expect(found.id).toBe(session.id);
                expect(found.userId).toBe(user.id);
                expect(found.token).toBe(session.token);
              }
            }

            // Verify: total session count decreased by exactly 1
            const remainingSessions = await prisma.session.count({
              where: { userId: user.id },
            });
            expect(remainingSessions).toBe(totalSessions - 1);
          }
        ),
        { numRuns: 50 }
      );
    });

    it("should maintain independent expiry times for each session", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 2, max: 4 }),
          async (sessionCount) => {
            // Create a test user
            const user = await createTestUser(
              `test-${Date.now()}-${Math.random()}@example.com`,
              `testuser-${Date.now()}-${Math.random()}`
            );

            // Create multiple sessions with slight time delays
            const sessions = [];
            for (let i = 0; i < sessionCount; i++) {
              // Small delay to ensure different creation times
              await new Promise((resolve) => setTimeout(resolve, 10));

              const session = await createSession(
                user.id,
                `192.168.1.${i}`,
                `UserAgent-${i}`
              );
              sessions.push(session);
            }

            // Verify: each session has its own expiry time
            const expiryTimes = sessions.map((s) => s.expiresAt.getTime());

            // Verify: all sessions exist
            expect(sessions.length).toBe(sessionCount);

            // Verify: each session has a valid expiry date
            for (const session of sessions) {
              expect(session.expiresAt).toBeTruthy();
              expect(session.expiresAt instanceof Date).toBe(true);
              expect(session.expiresAt.getTime()).toBeGreaterThan(Date.now());
            }

            // Verify: sessions are independently tracked
            for (const session of sessions) {
              const found = await prisma.session.findUnique({
                where: { id: session.id },
              });
              expect(found).not.toBeNull();
              expect(found.expiresAt.getTime()).toBe(
                session.expiresAt.getTime()
              );
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it("should allow creating new session without invalidating existing ones", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            initialSessions: fc.integer({ min: 1, max: 3 }),
            newSessions: fc.integer({ min: 1, max: 3 }),
          }),
          async ({ initialSessions, newSessions }) => {
            // Create a test user
            const user = await createTestUser(
              `test-${Date.now()}-${Math.random()}@example.com`,
              `testuser-${Date.now()}-${Math.random()}`
            );

            // Create initial sessions
            const existingSessions = [];
            for (let i = 0; i < initialSessions; i++) {
              const session = await createSession(
                user.id,
                `192.168.1.${i}`,
                `UserAgent-${i}`
              );
              existingSessions.push(session);
            }

            // Verify initial sessions exist
            const initialCount = await prisma.session.count({
              where: { userId: user.id },
            });
            expect(initialCount).toBe(initialSessions);

            // Create new sessions (simulating login from new devices)
            const newSessionsList = [];
            for (let i = 0; i < newSessions; i++) {
              const session = await createSession(
                user.id,
                `10.0.0.${i}`,
                `NewUserAgent-${i}`
              );
              newSessionsList.push(session);
            }

            // Verify: all existing sessions still exist and are valid
            for (const existingSession of existingSessions) {
              const found = await prisma.session.findUnique({
                where: { id: existingSession.id },
              });
              expect(found).not.toBeNull();
              expect(found.id).toBe(existingSession.id);
              expect(found.token).toBe(existingSession.token);
              expect(found.userId).toBe(user.id);
              expect(found.expiresAt.getTime()).toBe(
                existingSession.expiresAt.getTime()
              );
            }

            // Verify: all new sessions were created
            for (const newSession of newSessionsList) {
              const found = await prisma.session.findUnique({
                where: { id: newSession.id },
              });
              expect(found).not.toBeNull();
              expect(found.userId).toBe(user.id);
            }

            // Verify: total session count is correct
            const totalCount = await prisma.session.count({
              where: { userId: user.id },
            });
            expect(totalCount).toBe(initialSessions + newSessions);
          }
        ),
        { numRuns: 50 }
      );
    });

    it("should handle deletion of non-existent session gracefully", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 3 }),
          async (sessionCount) => {
            // Create a test user
            const user = await createTestUser(
              `test-${Date.now()}-${Math.random()}@example.com`,
              `testuser-${Date.now()}-${Math.random()}`
            );

            // Create sessions
            const sessions = [];
            for (let i = 0; i < sessionCount; i++) {
              const session = await createSession(
                user.id,
                `192.168.1.${i}`,
                `UserAgent-${i}`
              );
              sessions.push(session);
            }

            // Try to delete a non-existent session token
            const fakeToken = `fake-token-${Date.now()}-${Math.random()}`;
            await expect(deleteSession(fakeToken)).resolves.not.toThrow();

            // Verify: all existing sessions are still intact
            const remainingSessions = await prisma.session.count({
              where: { userId: user.id },
            });
            expect(remainingSessions).toBe(sessionCount);

            // Verify: each session still exists
            for (const session of sessions) {
              const found = await prisma.session.findUnique({
                where: { id: session.id },
              });
              expect(found).not.toBeNull();
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it("should allow deleting multiple sessions sequentially", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            totalSessions: fc.integer({ min: 3, max: 6 }),
            deleteCount: fc.integer({ min: 1, max: 3 }),
          }),
          async ({ totalSessions, deleteCount }) => {
            // Ensure we don't try to delete more than we have
            const safeDeleteCount = Math.min(deleteCount, totalSessions - 1);

            // Create a test user
            const user = await createTestUser(
              `test-${Date.now()}-${Math.random()}@example.com`,
              `testuser-${Date.now()}-${Math.random()}`
            );

            // Create sessions
            const sessions = [];
            for (let i = 0; i < totalSessions; i++) {
              const session = await createSession(
                user.id,
                `192.168.1.${i}`,
                `UserAgent-${i}`
              );
              sessions.push(session);
            }

            // Delete multiple sessions sequentially
            for (let i = 0; i < safeDeleteCount; i++) {
              await deleteSession(sessions[i].token);

              // Verify: deleted session no longer exists
              const deleted = await prisma.session.findUnique({
                where: { id: sessions[i].id },
              });
              expect(deleted).toBeNull();

              // Verify: remaining sessions still exist
              const remainingCount = await prisma.session.count({
                where: { userId: user.id },
              });
              expect(remainingCount).toBe(totalSessions - (i + 1));
            }

            // Verify: undeleted sessions still exist
            for (let i = safeDeleteCount; i < totalSessions; i++) {
              const found = await prisma.session.findUnique({
                where: { id: sessions[i].id },
              });
              expect(found).not.toBeNull();
              expect(found.userId).toBe(user.id);
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
