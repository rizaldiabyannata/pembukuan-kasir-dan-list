/**
 * Property-Based Tests for Session Creation Idempotency
 * Feature: session-token-collision-fix
 * @jest-environment node
 */

// Set environment variable BEFORE importing auth module
process.env.JWT_SECRET =
  "test-jwt-secret-key-for-testing-purposes-minimum-32-characters";

import fc from "fast-check";
import { prisma } from "../prisma";
import { createSession } from "../auth";

// Mock console methods to avoid cluttering test output
beforeAll(() => {
  jest.spyOn(console, "info").mockImplementation(() => {});
  jest.spyOn(console, "warn").mockImplementation(() => {});
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterAll(() => {
  jest.restoreAllMocks();
});

describe("Session Creation Idempotency - Property-Based Tests", () => {
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
   * Feature: session-token-collision-fix, Property 2: Session Creation Idempotency
   * Validates: Requirements 1.4
   *
   * For any user login attempt, if session creation succeeds,
   * exactly one new session record should exist in the database for that login attempt.
   */
  describe("Property 2: Session Creation Idempotency", () => {
    it("should create exactly one session record per successful login", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            ipAddress: fc.oneof(
              fc.constant("127.0.0.1"),
              fc.constant("192.168.1.1"),
              fc.constant("10.0.0.1"),
              fc.ipV4(),
              fc.ipV6()
            ),
            userAgent: fc.oneof(
              fc.constant("Mozilla/5.0"),
              fc.constant("Chrome/91.0"),
              fc.constant("Safari/14.0"),
              fc.string({ minLength: 10, maxLength: 100 })
            ),
          }),
          async ({ ipAddress, userAgent }) => {
            // Create a test user
            const user = await createTestUser(
              `test-${Date.now()}-${Math.random()}@example.com`,
              `testuser-${Date.now()}-${Math.random()}`
            );

            // Count sessions before creation
            const sessionsBefore = await prisma.session.count({
              where: { userId: user.id },
            });

            // Create session
            const session = await createSession(user.id, ipAddress, userAgent);

            // Count sessions after creation
            const sessionsAfter = await prisma.session.count({
              where: { userId: user.id },
            });

            // Verify: exactly one new session was created
            expect(sessionsAfter).toBe(sessionsBefore + 1);

            // Verify: the returned session exists in database
            const foundSession = await prisma.session.findUnique({
              where: { id: session.id },
            });
            expect(foundSession).not.toBeNull();
            expect(foundSession.id).toBe(session.id);
            expect(foundSession.userId).toBe(user.id);
            expect(foundSession.ipAddress).toBe(ipAddress);
            expect(foundSession.userAgent).toBe(userAgent);

            // Verify: token is unique and not null
            expect(session.token).toBeTruthy();
            expect(typeof session.token).toBe("string");

            // Cleanup: delete user and sessions
            await prisma.session.deleteMany({ where: { userId: user.id } });
            await prisma.user.delete({ where: { id: user.id } });
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should create unique sessions for multiple login attempts by same user", async () => {
      await fc.assert(
        fc.asyncProperty(fc.integer({ min: 2, max: 5 }), async (loginCount) => {
          // Create a test user
          const user = await createTestUser(
            `test-${Date.now()}-${Math.random()}@example.com`,
            `testuser-${Date.now()}-${Math.random()}`
          );

          const createdSessions = [];

          // Perform multiple logins
          for (let i = 0; i < loginCount; i++) {
            const session = await createSession(
              user.id,
              `192.168.1.${i}`,
              `UserAgent-${i}`
            );
            createdSessions.push(session);
          }

          // Verify: correct number of sessions created
          const totalSessions = await prisma.session.count({
            where: { userId: user.id },
          });
          expect(totalSessions).toBe(loginCount);

          // Verify: all sessions have unique tokens
          const tokens = createdSessions.map((s) => s.token);
          const uniqueTokens = new Set(tokens);
          expect(uniqueTokens.size).toBe(loginCount);

          // Verify: all sessions have unique IDs
          const ids = createdSessions.map((s) => s.id);
          const uniqueIds = new Set(ids);
          expect(uniqueIds.size).toBe(loginCount);

          // Verify: all sessions exist in database
          for (const session of createdSessions) {
            const found = await prisma.session.findUnique({
              where: { id: session.id },
            });
            expect(found).not.toBeNull();
            expect(found.userId).toBe(user.id);
          }

          // Cleanup: delete user and sessions
          await prisma.session.deleteMany({ where: { userId: user.id } });
          await prisma.user.delete({ where: { id: user.id } });
        }),
        { numRuns: 100 }
      );
    });

    it("should create sessions with valid expiry dates", async () => {
      await fc.assert(
        fc.asyncProperty(fc.constant(null), async () => {
          // Create a test user
          const user = await createTestUser(
            `test-${Date.now()}-${Math.random()}@example.com`,
            `testuser-${Date.now()}-${Math.random()}`
          );

          const beforeCreation = new Date();

          // Create session
          const session = await createSession(
            user.id,
            "127.0.0.1",
            "test-agent"
          );

          const afterCreation = new Date();

          // Verify: session has expiry date
          expect(session.expiresAt).toBeTruthy();
          expect(session.expiresAt instanceof Date).toBe(true);

          // Verify: expiry is in the future (7 days from now)
          const expectedExpiry = new Date(beforeCreation);
          expectedExpiry.setDate(expectedExpiry.getDate() + 7);

          // Allow some tolerance for test execution time (1 minute)
          const minExpiry = new Date(expectedExpiry);
          minExpiry.setMinutes(minExpiry.getMinutes() - 1);
          const maxExpiry = new Date(expectedExpiry);
          maxExpiry.setMinutes(maxExpiry.getMinutes() + 1);

          expect(session.expiresAt.getTime()).toBeGreaterThanOrEqual(
            minExpiry.getTime()
          );
          expect(session.expiresAt.getTime()).toBeLessThanOrEqual(
            maxExpiry.getTime()
          );

          // Verify: expiry is after creation time
          expect(session.expiresAt.getTime()).toBeGreaterThan(
            afterCreation.getTime()
          );

          // Cleanup: delete user and sessions
          await prisma.session.deleteMany({ where: { userId: user.id } });
          await prisma.user.delete({ where: { id: user.id } });
        }),
        { numRuns: 100 }
      );
    });

    it("should include user data in returned session", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            email: fc.emailAddress(),
            username: fc.string({ minLength: 3, maxLength: 20 }),
            name: fc.string({ minLength: 3, maxLength: 50 }),
            role: fc.oneof(fc.constant("ADMIN"), fc.constant("OPERATOR")),
          }),
          async ({ email, username, name, role }) => {
            // Create a test user with specific data
            const user = await prisma.user.create({
              data: {
                email: `${Date.now()}-${Math.random()}-${email}`,
                username: `${Date.now()}-${Math.random()}-${username}`,
                password: "hashed_password",
                name,
                role,
                isActive: true,
              },
            });

            // Create session
            const session = await createSession(
              user.id,
              "127.0.0.1",
              "test-agent"
            );

            // Verify: session includes user data
            expect(session.user).toBeTruthy();
            expect(session.user.id).toBe(user.id);
            expect(session.user.email).toBe(user.email);
            expect(session.user.username).toBe(user.username);
            expect(session.user.name).toBe(name);
            expect(session.user.role).toBe(role);
            expect(session.user.isActive).toBe(true);

            // Cleanup: delete user and sessions
            await prisma.session.deleteMany({ where: { userId: user.id } });
            await prisma.user.delete({ where: { id: user.id } });
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should clean up expired sessions before creating new session", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 5 }),
          async (expiredCount) => {
            // Create a test user
            const user = await createTestUser(
              `test-${Date.now()}-${Math.random()}@example.com`,
              `testuser-${Date.now()}-${Math.random()}`
            );

            // Create expired sessions manually
            const now = new Date();
            for (let i = 0; i < expiredCount; i++) {
              const expiredDate = new Date(now);
              expiredDate.setDate(expiredDate.getDate() - (i + 1));
              await prisma.session.create({
                data: {
                  userId: user.id,
                  token: `expired-token-${i}-${Date.now()}-${Math.random()}`,
                  expiresAt: expiredDate,
                  ipAddress: "127.0.0.1",
                  userAgent: "test-agent",
                },
              });
            }

            // Verify expired sessions exist
            const expiredSessionsBefore = await prisma.session.count({
              where: {
                userId: user.id,
                expiresAt: { lt: now },
              },
            });
            expect(expiredSessionsBefore).toBe(expiredCount);

            // Create new session (should trigger cleanup)
            const newSession = await createSession(
              user.id,
              "127.0.0.1",
              "test-agent"
            );

            // Verify: expired sessions were cleaned up
            const expiredSessionsAfter = await prisma.session.count({
              where: {
                userId: user.id,
                expiresAt: { lt: now },
              },
            });
            expect(expiredSessionsAfter).toBe(0);

            // Verify: only the new session exists
            const totalSessions = await prisma.session.count({
              where: { userId: user.id },
            });
            expect(totalSessions).toBe(1);

            // Verify: the new session is the one we created
            const foundSession = await prisma.session.findUnique({
              where: { id: newSession.id },
            });
            expect(foundSession).not.toBeNull();
            expect(foundSession.id).toBe(newSession.id);

            // Cleanup: delete user and sessions
            await prisma.session.deleteMany({ where: { userId: user.id } });
            await prisma.user.delete({ where: { id: user.id } });
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
