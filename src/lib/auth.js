/**
 * Authentication Utilities
 * Handles password hashing, token generation, and session management
 */

import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "./prisma";

// JWT Secret (should be in environment variables)
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key-change-this-in-production"
);

const JWT_EXPIRY = "7d"; // 7 days
const SESSION_EXPIRY_DAYS = 7;

/**
 * Hash password using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
export async function hashPassword(password) {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

/**
 * Verify password against hash
 * @param {string} password - Plain text password
 * @param {string} hashedPassword - Hashed password from database
 * @returns {Promise<boolean>} True if password matches
 */
export async function verifyPassword(password, hashedPassword) {
  return bcrypt.compare(password, hashedPassword);
}

/**
 * Generate JWT token
 * @param {object} payload - Data to encode in token
 * @returns {Promise<string>} JWT token
 */
export async function generateToken(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRY)
    .sign(JWT_SECRET);
}

/**
 * Generate unique session token with cryptographic guarantees
 * Combines JWT with cryptographic nonce and high-precision timestamp
 * to ensure uniqueness even under concurrent load
 *
 * @param {object} payload - User data to encode in JWT
 * @returns {Promise<string>} Unique session token with minimum 128 bits of randomness
 */
export async function generateUniqueSessionToken(payload) {
  const crypto = require("crypto");

  // 1. Generate base JWT with user claims
  const jwt = await generateToken(payload);

  // 2. Add cryptographic nonce (16 bytes = 128 bits = 32 hex chars)
  // This provides the minimum 128 bits of randomness required
  const nonce = crypto.randomBytes(16).toString("hex");

  // 3. Add high-precision timestamp for temporal uniqueness
  const timestamp = Date.now();

  // Use process.hrtime() for nanosecond precision if available (Node.js runtime only)
  // Check if process.hrtime exists before using it (not available in Edge Runtime)
  let preciseTime = timestamp.toString();
  if (typeof process !== "undefined" && typeof process.hrtime === "function") {
    try {
      const [seconds, nanoseconds] = process.hrtime();
      preciseTime = `${timestamp}.${nanoseconds}`;
    } catch (error) {
      // Fallback if hrtime fails
      const microRandom = crypto.randomBytes(4).toString("hex");
      preciseTime = `${timestamp}.${microRandom}`;
    }
  } else {
    // Edge runtime fallback - add additional random component for uniqueness
    const microRandom = crypto.randomBytes(4).toString("hex");
    preciseTime = `${timestamp}.${microRandom}`;
  }

  // 4. Combine all components into unique token
  // Format: JWT.NONCE.TIMESTAMP
  const uniqueToken = `${jwt}.${nonce}.${preciseTime}`;

  return uniqueToken;
}

/**
 * Verify JWT token
 * @param {string} token - JWT token to verify
 * @returns {Promise<object>} Decoded token payload
 */
export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch (error) {
    throw new Error("Invalid or expired token");
  }
}

/**
 * Attempt to create session with collision handling and retry logic
 * Catches Prisma P2002 unique constraint errors and retries with exponential backoff
 *
 * @param {object} sessionData - Session data to create
 * @param {number} attempt - Current attempt number (1-indexed)
 * @param {number} maxRetries - Maximum retry attempts (default: 3)
 * @returns {Promise<object>} Created session
 * @throws {Error} If max retries exceeded or other error occurs
 */
export async function createSessionWithRetry(
  sessionData,
  attempt = 1,
  maxRetries = 3
) {
  try {
    // Attempt to create session in database
    const session = await prisma.session.create({
      data: sessionData,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            name: true,
            role: true,
            isActive: true,
          },
        },
      },
    });

    // Log successful creation if it required retries
    if (attempt > 1) {
      console.info(
        `[Session Creation] Successfully created session for user ${sessionData.userId} on attempt ${attempt}`
      );
    }

    return session;
  } catch (error) {
    // Check if this is a unique constraint violation (token collision)
    if (error.code === "P2002" && error.meta?.target?.includes("token")) {
      // Log collision event with context
      console.warn(
        `[Session Collision] Token collision detected for user ${sessionData.userId} on attempt ${attempt}/${maxRetries} at ${new Date().toISOString()}`
      );

      // Check if we've exceeded max retries
      if (attempt >= maxRetries) {
        console.error(
          `[Session Creation Failed] Max retries (${maxRetries}) exceeded for user ${sessionData.userId}`
        );
        throw new Error("Unable to create session. Please try again.", {
          cause: "SESSION_CREATION_FAILED",
        });
      }

      // Calculate exponential backoff delay (100ms * attempt)
      const backoffDelay = 100 * attempt;

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, backoffDelay));

      // Generate new unique token for retry
      const user = await prisma.user.findUnique({
        where: { id: sessionData.userId },
        select: {
          id: true,
          email: true,
          username: true,
          name: true,
          role: true,
          isActive: true,
        },
      });

      if (!user) {
        throw new Error("User not found");
      }

      const newToken = await generateUniqueSessionToken({
        userId: user.id,
        role: user.role,
        email: user.email,
        username: user.username,
        name: user.name,
        isActive: user.isActive,
      });

      // Retry with new token
      return createSessionWithRetry(
        {
          ...sessionData,
          token: newToken,
        },
        attempt + 1,
        maxRetries
      );
    }

    // Re-throw other errors
    throw error;
  }
}

/**
 * Create session in database with automatic cleanup of expired sessions
 * Uses enhanced token generation with collision retry logic
 * @param {string} userId - User ID
 * @param {string} ipAddress - Client IP address
 * @param {string} userAgent - Client user agent
 * @returns {Promise<object>} Session object with token
 */
export async function createSession(userId, ipAddress, userAgent) {
  // Clean up expired sessions for this user before creating new session
  await cleanupUserExpiredSessions(userId);

  // Get user data first to include in JWT
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      username: true,
      name: true,
      role: true,
      isActive: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Generate unique session token with cryptographic guarantees
  const token = await generateUniqueSessionToken({
    userId: user.id,
    role: user.role,
    email: user.email,
    username: user.username,
    name: user.name,
    isActive: user.isActive,
  });

  // Calculate expiry date
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_EXPIRY_DAYS);

  // Create session in database with collision retry logic
  const session = await createSessionWithRetry({
    userId,
    token,
    expiresAt,
    ipAddress,
    userAgent,
  });

  return session;
}

/**
 * Get session from token
 * IMPORTANT: This function performs full database validation and should be used in:
 * - API routes (Node.js runtime)
 * - Server components
 * - Server actions
 *
 * DO NOT use in middleware (edge runtime) - use validateSession from route-protection.js instead
 *
 * @param {string} token - Session token
 * @returns {Promise<object|null>} Session object or null
 */
export async function getSession(token) {
  if (!token) return null;

  try {
    // Get session from database
    // Note: We don't verify the JWT portion of the enhanced token here because
    // the database lookup is the source of truth for session validity
    const session = await prisma.session.findUnique({
      where: { token },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            name: true,
            role: true,
            isActive: true,
          },
        },
      },
    });

    // Check if session doesn't exist
    if (!session) {
      return null;
    }

    // Check if session is expired
    const now = new Date();
    if (session.expiresAt < now) {
      // Log expired session access attempt
      const crypto = require("crypto");
      const tokenHash = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex")
        .substring(0, 16);
      console.warn(
        `[Session Expired] User ${session.userId} attempted to use expired session (token hash: ${tokenHash}) at ${now.toISOString()}`
      );
      return null;
    }

    // Check if user is active
    if (!session.user.isActive) {
      return null;
    }

    return session;
  } catch (error) {
    return null;
  }
}

/**
 * Delete session (logout)
 * @param {string} token - Session token to delete
 * @returns {Promise<void>}
 */
export async function deleteSession(token) {
  await prisma.session
    .delete({
      where: { token },
    })
    .catch(() => {
      // Ignore error if session doesn't exist
    });
}

/**
 * Delete all sessions for a user
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
export async function deleteAllUserSessions(userId) {
  await prisma.session.deleteMany({
    where: { userId },
  });
}

/**
 * Refresh/extend session expiry
 * @param {string} token - Current session token
 * @returns {Promise<object|null>} Updated session or null if invalid
 */
export async function refreshSession(token) {
  if (!token) return null;

  try {
    // Get current session
    // Note: We don't verify the JWT portion of the enhanced token here because
    // the database lookup is the source of truth for session validity
    const session = await prisma.session.findUnique({
      where: { token },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            name: true,
            role: true,
            isActive: true,
          },
        },
      },
    });

    // Check if session exists and user is active
    if (!session || !session.user.isActive) {
      return null;
    }

    // Calculate new expiry date
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + SESSION_EXPIRY_DAYS);

    // Update session expiry
    const updatedSession = await prisma.session.update({
      where: { token },
      data: { expiresAt: newExpiresAt },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            name: true,
            role: true,
            isActive: true,
          },
        },
      },
    });

    return updatedSession;
  } catch (error) {
    return null;
  }
}

/**
 * Clean up expired sessions for a specific user
 * Removes all sessions where the expiry date is in the past
 * Should be called before creating a new session during login
 *
 * @param {string} userId - User ID
 * @returns {Promise<number>} Number of deleted sessions
 */
export async function cleanupUserExpiredSessions(userId) {
  const result = await prisma.session.deleteMany({
    where: {
      userId,
      expiresAt: {
        lt: new Date(),
      },
    },
  });

  // Log cleanup operation
  if (result.count > 0) {
    console.info(
      `[Session Cleanup] Removed ${result.count} expired session(s) for user ${userId}`
    );
  }

  return result.count;
}

/**
 * Clean up expired sessions (global cleanup for scheduled maintenance)
 * Removes all expired sessions across all users
 *
 * @returns {Promise<number>} Number of deleted sessions
 */
export async function cleanupExpiredSessions() {
  const result = await prisma.session.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });

  // Log cleanup operation
  if (result.count > 0) {
    console.info(
      `[Session Cleanup] Global cleanup removed ${result.count} expired session(s)`
    );
  }

  return result.count;
}

/**
 * Check if user account is locked
 * @param {object} user - User object
 * @returns {boolean} True if account is locked
 */
export function isAccountLocked(user) {
  if (!user.lockedUntil) return false;
  return user.lockedUntil > new Date();
}

/**
 * Lock user account after failed login attempts
 * @param {string} userId - User ID
 * @param {number} lockMinutes - Minutes to lock account
 * @returns {Promise<void>}
 */
export async function lockAccount(userId, lockMinutes = 30) {
  const lockedUntil = new Date();
  lockedUntil.setMinutes(lockedUntil.getMinutes() + lockMinutes);

  await prisma.user.update({
    where: { id: userId },
    data: { lockedUntil },
  });
}

/**
 * Record failed login attempt
 * @param {string} userId - User ID
 * @param {number} maxAttempts - Max attempts before locking (default: 5)
 * @returns {Promise<boolean>} True if account is now locked
 */
export async function recordFailedLogin(userId, maxAttempts = 5) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { failedLoginAttempts: true },
  });

  const newAttempts = (user?.failedLoginAttempts || 0) + 1;

  await prisma.user.update({
    where: { id: userId },
    data: { failedLoginAttempts: newAttempts },
  });

  // Lock account if max attempts reached
  if (newAttempts >= maxAttempts) {
    await lockAccount(userId);
    return true;
  }

  return false;
}

/**
 * Reset failed login attempts (after successful login)
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
export async function resetFailedLoginAttempts(userId) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
  });
}

/**
 * Update last login info
 * @param {string} userId - User ID
 * @param {string} ipAddress - Client IP
 * @returns {Promise<void>}
 */
export async function updateLastLogin(userId, ipAddress) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      lastLoginAt: new Date(),
      lastLoginIp: ipAddress,
    },
  });
}

/**
 * Generate password reset token
 * @param {string} email - User email
 * @returns {Promise<string>} Reset token
 */
export async function generatePasswordResetToken(email) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Generate random hex token (simpler and safer for URLs than JWT)
  const resetToken = require("crypto").randomBytes(32).toString("hex");

  // Set expiry (1 hour)
  const resetTokenExpiry = new Date();
  resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1);

  // Save to database
  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetToken,
      resetTokenExpiry,
    },
  });

  return resetToken;
}

/**
 * Verify password reset token
 * @param {string} token - Reset token
 * @returns {Promise<object>} User object
 */
export async function verifyPasswordResetToken(token) {
  const user = await prisma.user.findFirst({
    where: {
      resetToken: token,
      resetTokenExpiry: {
        gt: new Date(),
      },
    },
  });

  if (!user) {
    throw new Error("Invalid or expired reset token");
  }

  return user;
}

/**
 * Reset password using token
 * @param {string} token - Reset token
 * @param {string} newPassword - New password
 * @returns {Promise<void>}
 */
export async function resetPassword(token, newPassword) {
  const user = await verifyPasswordResetToken(token);

  const hashedPassword = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      resetToken: null,
      resetTokenExpiry: null,
    },
  });

  // Invalidate all existing sessions
  await deleteAllUserSessions(user.id);
}
