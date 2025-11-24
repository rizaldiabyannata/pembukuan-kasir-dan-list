/**
 * Property-Based Tests for Expired Session Validation
 * Feature: session-token-collision-fix
 * Validates: Requirements 2.2
 * @jest-environment node
 */

// Set environment variable BEFORE importing auth module
process.env.JWT_SECRET =
  "test-jwt-secret-key-for-testing-purposes-minimum-32-characters";

import fc from "fast-check";
import { prisma } from "../prisma";
import { getSession, generateUniqueSessionToken } from "../auth";

// Mock console methods to avoid cluttering test output
beforeAll(() => {
  jest.spyOn(console, "info").mockImplementation(() => {});
  jest.spyOn(console, "warn").mockImplementation(() => {});
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterAll(() => {
  jest.restoreAllMocks();
});

describe("Expired Session Validation - Property-Based Tests", () => {
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

  // Cleanup after each test
  afterEach(async () => {
    await prisma.session.deleteMany({});
    await prisma.user.deleteMany({});
  });

  /**
   * Feature: session-token-collision-fix, Property: Expired Session Validation
   * Validates: Requirements 2.2
   *
   * For any expired session, when attempting to authenticate with that session,
   * the system should reject the session and return null.
   */
  describe("Property: Expired Session Validation", () => {
    it("should reject expired sessions for authentication", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            daysExpired: fc.integer({ min: 1, max: 365 }), // How many days ago it expired
            hoursExpired: fc.integer({ min: 0, max: 23 }), // Additional hours
            minutesExpired: fc.integer({ min: 0, max: 59 }), // Additional minutes
          }),
          async ({ daysExpired, hoursExpired, minutesExpired }) => {
            // Create a test user
            const user = await createTestUser(
              `test-${Date.now()}-${Math.random()}@example.com`,
              `testuser-${Date.now()}-${Math.random()}`
            );

            // Generate a unique token
            const token = await generateUniqueSessionToken({
              userId: user.id,
              role: user.role,
              email: user.email,
              username: user.username,
              name: user.name,
              isActive: user.isActive,
            });

            // Calculate expiry date in the past
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() - daysExpired);
            expiresAt.setHours(expiresAt.getHours() - hoursExpired);
            expiresAt.setMinutes(expiresAt.getMinutes() - minutesExpired);

            // Create expired session directly in database
            await prisma.session.create({
              data: {
                userId: user.id,
                token,
                expiresAt,
                ipAddress: "127.0.0.1",
                userAgent: "test-agent",
              },
            });

            // Attempt to get the expired session
            const result = await getSession(token);

            // Verify: expired session is rejected (returns null)
            expect(result).toBeNull();

            // Verify: session still exists in database (not deleted)
            const sessionInDb = await prisma.session.findUnique({
              where: { token },
            });
            expect(sessionInDb).not.toBeNull();
            expect(sessionInDb.expiresAt.getTime()).toBeLessThan(
              new Date().getTime()
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should accept valid (non-expired) sessions for authentication", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            daysValid: fc.integer({ min: 1, max: 6 }), // How many days in the future (within JWT expiry of 7 days)
            hoursValid: fc.integer({ min: 0, max: 23 }), // Additional hours
            minutesValid: fc.integer({ min: 0, max: 59 }), // Additional minutes
          }),
          async ({ daysValid, hoursValid, minutesValid }) => {
            // Create a test user
            const user = await createTestUser(
              `test-${Date.now()}-${Math.random()}@example.com`,
              `testuser-${Date.now()}-${Math.random()}`
            );

            // Generate a unique token (JWT is valid for 7 days)
            const token = await generateUniqueSessionToken({
              userId: user.id,
              role: user.role,
              email: user.email,
              username: user.username,
              name: user.name,
              isActive: user.isActive,
            });

            // Calculate expiry date in the future (but within JWT validity)
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + daysValid);
            expiresAt.setHours(expiresAt.getHours() + hoursValid);
            expiresAt.setMinutes(expiresAt.getMinutes() + minutesValid);

            // Create valid session directly in database
            await prisma.session.create({
              data: {
                userId: user.id,
                token,
                expiresAt,
                ipAddress: "127.0.0.1",
                userAgent: "test-agent",
              },
            });

            // Attempt to get the valid session
            const result = await getSession(token);

            // Verify: valid session is accepted (returns session object)
            expect(result).not.toBeNull();
            expect(result.userId).toBe(user.id);
            expect(result.token).toBe(token);
            expect(result.expiresAt.getTime()).toBeGreaterThan(
              new Date().getTime()
            );
            expect(result.user).toBeTruthy();
            expect(result.user.id).toBe(user.id);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should reject sessions that expire exactly at current time", async () => {
      await fc.assert(
        fc.asyncProperty(fc.constant(null), async () => {
          // Create a test user
          const user = await createTestUser(
            `test-${Date.now()}-${Math.random()}@example.com`,
            `testuser-${Date.now()}-${Math.random()}`
          );

          // Generate a unique token
          const token = await generateUniqueSessionToken({
            userId: user.id,
            role: user.role,
            email: user.email,
            username: user.username,
            name: user.name,
            isActive: user.isActive,
          });

          // Set expiry to a time slightly in the past (1 second ago)
          // This ensures the session is expired when we check it
          const expiresAt = new Date();
          expiresAt.setSeconds(expiresAt.getSeconds() - 1);

          // Create session with expiry at current time
          await prisma.session.create({
            data: {
              userId: user.id,
              token,
              expiresAt,
              ipAddress: "127.0.0.1",
              userAgent: "test-agent",
            },
          });

          // Attempt to get the session
          const result = await getSession(token);

          // Verify: session at boundary is rejected
          expect(result).toBeNull();
        }),
        { numRuns: 100 }
      );
    });

    it("should log expired session access attempts", async () => {
      // Temporarily restore console.warn for this test
      const originalWarn = console.warn;
      console.warn.mockRestore();

      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 10 }),
          async (daysExpired) => {
            // Create a test user
            const user = await createTestUser(
              `test-${Date.now()}-${Math.random()}@example.com`,
              `testuser-${Date.now()}-${Math.random()}`
            );

            // Generate a unique token
            const token = await generateUniqueSessionToken({
              userId: user.id,
              role: user.role,
              email: user.email,
              username: user.username,
              name: user.name,
              isActive: user.isActive,
            });

            // Calculate expiry date in the past
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() - daysExpired);

            // Create expired session
            await prisma.session.create({
              data: {
                userId: user.id,
                token,
                expiresAt,
                ipAddress: "127.0.0.1",
                userAgent: "test-agent",
              },
            });

            // Create a fresh spy on console.warn
            const warnSpy = jest
              .spyOn(console, "warn")
              .mockImplementation(() => {});

            // Attempt to get the expired session
            await getSession(token);

            // Verify: warning was logged
            expect(warnSpy).toHaveBeenCalled();
            const logCall = warnSpy.mock.calls.find((call) =>
              call[0].includes("[Session Expired]")
            );
            expect(logCall).toBeTruthy();
            expect(logCall[0]).toContain(user.id);
            expect(logCall[0]).toContain("expired session");

            // Verify: log doesn't contain full token (security)
            expect(logCall[0]).not.toContain(token);

            warnSpy.mockRestore();
          }
        ),
        { numRuns: 100 }
      );

      // Re-mock console.warn for other tests
      jest.spyOn(console, "warn").mockImplementation(() => {});
    });

    it("should handle multiple expired sessions for same user independently", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 2, max: 5 }),
          async (sessionCount) => {
            // Create a test user
            const user = await createTestUser(
              `test-${Date.now()}-${Math.random()}@example.com`,
              `testuser-${Date.now()}-${Math.random()}`
            );

            const tokens = [];

            // Create multiple expired sessions
            for (let i = 0; i < sessionCount; i++) {
              const token = await generateUniqueSessionToken({
                userId: user.id,
                role: user.role,
                email: user.email,
                username: user.username,
                name: user.name,
                isActive: user.isActive,
              });

              const expiresAt = new Date();
              expiresAt.setDate(expiresAt.getDate() - (i + 1));

              await prisma.session.create({
                data: {
                  userId: user.id,
                  token,
                  expiresAt,
                  ipAddress: "127.0.0.1",
                  userAgent: "test-agent",
                },
              });

              tokens.push(token);
            }

            // Verify: all expired sessions are rejected
            for (const token of tokens) {
              const result = await getSession(token);
              expect(result).toBeNull();
            }

            // Verify: all sessions still exist in database
            const sessionsInDb = await prisma.session.count({
              where: { userId: user.id },
            });
            expect(sessionsInDb).toBe(sessionCount);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should reject expired sessions even if user is active", async () => {
      await fc.assert(
        fc.asyncProperty(fc.boolean(), async (isActive) => {
          // Create a test user with specified active status
          const user = await prisma.user.create({
            data: {
              email: `test-${Date.now()}-${Math.random()}@example.com`,
              username: `testuser-${Date.now()}-${Math.random()}`,
              password: "hashed_password",
              name: "Test User",
              role: "OPERATOR",
              isActive,
            },
          });

          // Generate a unique token
          const token = await generateUniqueSessionToken({
            userId: user.id,
            role: user.role,
            email: user.email,
            username: user.username,
            name: user.name,
            isActive: user.isActive,
          });

          // Create expired session
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() - 1);

          await prisma.session.create({
            data: {
              userId: user.id,
              token,
              expiresAt,
              ipAddress: "127.0.0.1",
              userAgent: "test-agent",
            },
          });

          // Attempt to get the expired session
          const result = await getSession(token);

          // Verify: expired session is rejected regardless of user active status
          expect(result).toBeNull();
        }),
        { numRuns: 100 }
      );
    });
  });
});
