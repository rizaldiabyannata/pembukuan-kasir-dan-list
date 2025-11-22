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
 * Create session in database
 * @param {string} userId - User ID
 * @param {string} ipAddress - Client IP address
 * @param {string} userAgent - Client user agent
 * @returns {Promise<object>} Session object with token
 */
export async function createSession(userId, ipAddress, userAgent) {
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

  // Generate session token with user data for edge runtime
  const token = await generateToken({
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

  // Create session in database
  const session = await prisma.session.create({
    data: {
      userId,
      token,
      expiresAt,
      ipAddress,
      userAgent,
    },
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
    // Verify token first
    await verifyToken(token);

    // Get session from database
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

    // Check if session exists and is not expired
    if (!session || session.expiresAt < new Date()) {
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
    // Verify token first
    await verifyToken(token);

    // Get current session
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
 * Clean up expired sessions
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

  // Generate random token
  const resetToken = await generateToken({
    userId: user.id,
    purpose: "password-reset",
  });

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
