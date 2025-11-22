import nodemailer from "nodemailer";

/**
 * Email service for sending OTP and notifications
 */

// Create reusable transporter
let transporter = null;

/**
 * Error types for email operations
 */
export const EmailErrorType = {
  AUTH_FAILED: "auth_failed",
  NETWORK_ERROR: "network_error",
  INVALID_RECIPIENT: "invalid_recipient",
  RATE_LIMIT: "rate_limit",
  UNKNOWN: "unknown",
};

/**
 * User-friendly error messages
 */
const ERROR_MESSAGES = {
  [EmailErrorType.AUTH_FAILED]:
    "Email server configuration issue. Please contact support.",
  [EmailErrorType.NETWORK_ERROR]:
    "Network connectivity issue. Please try again later.",
  [EmailErrorType.INVALID_RECIPIENT]:
    "The email address may be invalid. Please check and try again.",
  [EmailErrorType.RATE_LIMIT]:
    "Too many email requests. Please try again in a few minutes.",
  [EmailErrorType.UNKNOWN]:
    "An unexpected error occurred. Please try again or contact support.",
};

/**
 * Classify error type based on error details
 */
function classifyError(error) {
  const errorMessage = error.message?.toLowerCase() || "";
  const errorCode = error.code?.toLowerCase() || "";
  const responseCode = error.responseCode || 0;

  // Authentication errors
  if (
    errorMessage.includes("authentication") ||
    errorMessage.includes("auth") ||
    errorMessage.includes("invalid login") ||
    errorMessage.includes("username and password not accepted") ||
    errorCode === "eauth" ||
    responseCode === 535
  ) {
    return EmailErrorType.AUTH_FAILED;
  }

  // Network errors
  if (
    errorMessage.includes("timeout") ||
    errorMessage.includes("econnrefused") ||
    errorMessage.includes("enotfound") ||
    errorMessage.includes("network") ||
    errorCode === "etimedout" ||
    errorCode === "econnrefused" ||
    errorCode === "enotfound" ||
    responseCode === 421
  ) {
    return EmailErrorType.NETWORK_ERROR;
  }

  // Invalid recipient errors
  if (
    errorMessage.includes("recipient") ||
    errorMessage.includes("mailbox") ||
    errorMessage.includes("user unknown") ||
    errorMessage.includes("no such user") ||
    errorMessage.includes("invalid address") ||
    responseCode === 550 ||
    responseCode === 551 ||
    responseCode === 553
  ) {
    return EmailErrorType.INVALID_RECIPIENT;
  }

  // Rate limit errors
  if (
    errorMessage.includes("rate limit") ||
    errorMessage.includes("too many") ||
    errorMessage.includes("quota") ||
    errorMessage.includes("throttle") ||
    responseCode === 450 ||
    responseCode === 451 ||
    responseCode === 452
  ) {
    return EmailErrorType.RATE_LIMIT;
  }

  return EmailErrorType.UNKNOWN;
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyErrorMessage(errorType) {
  return ERROR_MESSAGES[errorType] || ERROR_MESSAGES[EmailErrorType.UNKNOWN];
}

/**
 * Check if error type is retryable
 */
function isRetryableError(errorType) {
  // Don't retry for authentication failures or invalid recipients
  return (
    errorType !== EmailErrorType.AUTH_FAILED &&
    errorType !== EmailErrorType.INVALID_RECIPIENT
  );
}

/**
 * Calculate exponential backoff delay
 */
function calculateBackoffDelay(attemptNumber, initialDelay = 1000) {
  // Exponential backoff: 1s, 2s, 4s
  return initialDelay * Math.pow(2, attemptNumber - 1);
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Send email with retry mechanism and exponential backoff
 * @param {Function} sendFunction - The function that sends the email
 * @param {string} recipient - Email recipient
 * @param {Object} options - Retry options
 * @returns {Promise} - Result of email send
 */
export async function sendEmailWithRetry(
  sendFunction,
  recipient,
  options = {}
) {
  const maxRetries = options.maxRetries || 3;
  const initialDelay = options.initialDelay || 1000;
  const metadata = options.metadata || {};

  let lastError = null;
  let lastErrorType = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Log retry attempt if not first attempt
      if (attempt > 1) {
        logEmailOperation("send", recipient, "retrying", {
          ...metadata,
          retryCount: attempt - 1,
          attemptNumber: attempt,
          maxRetries,
        });
      }

      // Attempt to send email
      const result = await sendFunction();

      // If successful, return result with retry count
      return {
        ...result,
        retryCount: attempt - 1,
      };
    } catch (error) {
      lastError = error;
      lastErrorType = error.errorType || classifyError(error);

      // Log the error for this attempt
      logEmailOperation("send", recipient, "failed", {
        ...metadata,
        retryCount: attempt - 1,
        attemptNumber: attempt,
        maxRetries,
        errorType: lastErrorType,
        errorMessage: error.message,
      });

      // Check if error is retryable
      if (!isRetryableError(lastErrorType)) {
        logEmailOperation("send", recipient, "non-retryable", {
          ...metadata,
          errorType: lastErrorType,
          reason: "Error type is not retryable",
        });
        throw error;
      }

      // If this was the last attempt, throw the error
      if (attempt === maxRetries) {
        logEmailOperation("send", recipient, "max-retries-reached", {
          ...metadata,
          retryCount: attempt - 1,
          errorType: lastErrorType,
        });
        throw error;
      }

      // Calculate backoff delay and wait
      const delay = calculateBackoffDelay(attempt, initialDelay);
      logEmailOperation("send", recipient, "backoff", {
        ...metadata,
        retryCount: attempt - 1,
        attemptNumber: attempt,
        nextAttempt: attempt + 1,
        delayMs: delay,
      });

      await sleep(delay);
    }
  }

  // This should never be reached, but just in case
  throw lastError;
}

/**
 * Log email operation
 */
function logEmailOperation(operation, recipient, outcome, metadata = {}) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    component: "email-service",
    operation,
    recipient,
    outcome,
    ...metadata,
  };

  if (outcome === "success") {
    console.info("[EMAIL-SERVICE]", JSON.stringify(logEntry));
  } else if (outcome === "failed") {
    console.error("[EMAIL-SERVICE]", JSON.stringify(logEntry));
  } else {
    console.log("[EMAIL-SERVICE]", JSON.stringify(logEntry));
  }
}

/**
 * Log detailed error information
 */
function logEmailError(recipient, error, metadata = {}) {
  const errorType = classifyError(error);
  const timestamp = new Date().toISOString();

  const errorLog = {
    timestamp,
    component: "email-service",
    operation: "send",
    recipient,
    outcome: "failed",
    error: {
      type: errorType,
      message: error.message,
      code: error.code || null,
      responseCode: error.responseCode || null,
      command: error.command || null,
      stack: error.stack,
    },
    ...metadata,
  };

  console.error("[EMAIL-SERVICE] Error:", JSON.stringify(errorLog));

  return errorType;
}

function getTransporter() {
  if (!transporter) {
    // Configure email transporter
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }
  return transporter;
}

/**
 * Generate 6-digit OTP
 */
export function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send OTP email for password reset
 */
export async function sendPasswordResetOTP(email, otp, userName) {
  const startTime = Date.now();
  const transport = getTransporter();

  const mailOptions = {
    from: `"${process.env.APP_NAME || "Pembukuan Kasir"}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to: email,
    subject: "Reset Password - Kode OTP",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Password OTP</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background: #ffffff;
              border-radius: 8px;
              padding: 32px;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 32px;
            }
            .header h1 {
              color: #1a1a1a;
              font-size: 24px;
              margin: 0 0 8px 0;
            }
            .header p {
              color: #666;
              margin: 0;
            }
            .otp-box {
              background: #f8f9fa;
              border: 2px dashed #e0e0e0;
              border-radius: 8px;
              padding: 24px;
              text-align: center;
              margin: 24px 0;
            }
            .otp-code {
              font-size: 36px;
              font-weight: bold;
              color: #2563eb;
              letter-spacing: 8px;
              margin: 0;
              font-family: 'Courier New', monospace;
            }
            .otp-label {
              color: #666;
              font-size: 14px;
              margin-top: 8px;
            }
            .content {
              color: #333;
              line-height: 1.8;
            }
            .warning {
              background: #fff3cd;
              border-left: 4px solid #ffc107;
              padding: 12px 16px;
              margin: 24px 0;
              border-radius: 4px;
            }
            .warning p {
              margin: 0;
              color: #856404;
              font-size: 14px;
            }
            .footer {
              text-align: center;
              margin-top: 32px;
              padding-top: 24px;
              border-top: 1px solid #e0e0e0;
              color: #666;
              font-size: 14px;
            }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background: #2563eb;
              color: #ffffff !important;
              text-decoration: none;
              border-radius: 6px;
              margin: 16px 0;
              font-weight: 500;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Reset Password</h1>
              <p>Permintaan reset password untuk akun Anda</p>
            </div>
            
            <div class="content">
              <p>Halo <strong>${userName}</strong>,</p>
              <p>Kami menerima permintaan untuk mereset password akun Anda. Gunakan kode OTP berikut untuk melanjutkan proses reset password:</p>
            </div>
            
            <div class="otp-box">
              <p class="otp-code">${otp}</p>
              <p class="otp-label">Kode OTP berlaku selama 10 menit</p>
            </div>
            
            <div class="content">
              <p>Masukkan kode OTP ini di halaman reset password untuk melanjutkan.</p>
              <div style="text-align: center; margin: 24px 0;">
                <a href="${process.env.NEXT_PUBLIC_BASE_URL}/reset-password/verify?email=${encodeURIComponent(email)}" class="button">Verifikasi OTP</a>
              </div>
            </div>
            
            <div class="warning">
              <p><strong>⚠️ Perhatian:</strong> Jika Anda tidak meminta reset password, abaikan email ini. Kode OTP akan kedaluwarsa dalam 10 menit.</p>
            </div>
            
            <div class="footer">
              <p>Email ini dikirim secara otomatis, mohon tidak membalas.</p>
              <p style="margin-top: 8px; color: #999; font-size: 12px;">
                © ${new Date().getFullYear()} ${process.env.APP_NAME || "Pembukuan Kasir"}. All rights reserved.
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Reset Password - Kode OTP

Halo ${userName},

Kami menerima permintaan untuk mereset password akun Anda.
Gunakan kode OTP berikut untuk melanjutkan:

Kode OTP: ${otp}

Kode ini berlaku selama 10 menit.

Jika Anda tidak meminta reset password, abaikan email ini.

© ${new Date().getFullYear()} ${process.env.APP_NAME || "Pembukuan Kasir"}
    `.trim(),
  };

  // Log operation start
  logEmailOperation("send", email, "pending", {
    type: "otp",
    provider: process.env.SMTP_HOST || "smtp.gmail.com",
  });

  // Define the send function for retry mechanism
  const sendFunction = async () => {
    try {
      const info = await transport.sendMail(mailOptions);
      const deliveryTime = Date.now() - startTime;

      // Log successful send
      logEmailOperation("send", email, "success", {
        type: "otp",
        messageId: info.messageId,
        provider: process.env.SMTP_HOST || "smtp.gmail.com",
        deliveryTime,
        response: info.response,
      });

      return {
        success: true,
        messageId: info.messageId,
        deliveryTime,
      };
    } catch (error) {
      // Classify and log error
      const errorType = logEmailError(email, error, {
        type: "otp",
        provider: process.env.SMTP_HOST || "smtp.gmail.com",
      });

      // Get user-friendly error message
      const userMessage = getUserFriendlyErrorMessage(errorType);

      // Create enhanced error
      const enhancedError = new Error(userMessage);
      enhancedError.originalError = error;
      enhancedError.errorType = errorType;
      enhancedError.code = error.code;
      enhancedError.responseCode = error.responseCode;

      throw enhancedError;
    }
  };

  // Use retry mechanism
  return await sendEmailWithRetry(sendFunction, email, {
    maxRetries: parseInt(process.env.EMAIL_RETRY_MAX || "3"),
    initialDelay: parseInt(process.env.EMAIL_RETRY_DELAY || "1000"),
    metadata: {
      type: "otp",
      provider: process.env.SMTP_HOST || "smtp.gmail.com",
    },
  });
}

/**
 * Send password changed notification
 */
export async function sendPasswordChangedNotification(email, userName) {
  const startTime = Date.now();
  const transport = getTransporter();

  const mailOptions = {
    from: `"${process.env.APP_NAME || "Pembukuan Kasir"}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to: email,
    subject: "Password Berhasil Diubah",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .container { background: #ffffff; border-radius: 8px; padding: 32px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); }
            .header { text-align: center; margin-bottom: 24px; }
            .header h1 { color: #16a34a; margin: 0; }
            .content { color: #333; }
            .footer { text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e0e0e0; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Password Berhasil Diubah</h1>
            </div>
            <div class="content">
              <p>Halo <strong>${userName}</strong>,</p>
              <p>Password akun Anda telah berhasil diubah pada ${new Date().toLocaleString("id-ID")}.</p>
              <p>Jika Anda tidak melakukan perubahan ini, segera hubungi administrator sistem.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} ${process.env.APP_NAME || "Pembukuan Kasir"}</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };

  // Log operation start
  logEmailOperation("send", email, "pending", {
    type: "notification",
    provider: process.env.SMTP_HOST || "smtp.gmail.com",
  });

  // Define the send function for retry mechanism
  const sendFunction = async () => {
    try {
      const info = await transport.sendMail(mailOptions);
      const deliveryTime = Date.now() - startTime;

      // Log successful send
      logEmailOperation("send", email, "success", {
        type: "notification",
        messageId: info.messageId,
        provider: process.env.SMTP_HOST || "smtp.gmail.com",
        deliveryTime,
        response: info.response,
      });

      return {
        success: true,
        messageId: info.messageId,
        deliveryTime,
      };
    } catch (error) {
      // Classify and log error
      const errorType = logEmailError(email, error, {
        type: "notification",
        provider: process.env.SMTP_HOST || "smtp.gmail.com",
      });

      // Get user-friendly error message
      const userMessage = getUserFriendlyErrorMessage(errorType);

      // Create enhanced error
      const enhancedError = new Error(userMessage);
      enhancedError.originalError = error;
      enhancedError.errorType = errorType;
      enhancedError.code = error.code;
      enhancedError.responseCode = error.responseCode;

      throw enhancedError;
    }
  };

  // Use retry mechanism, but catch errors for notifications (don't throw)
  try {
    return await sendEmailWithRetry(sendFunction, email, {
      maxRetries: parseInt(process.env.EMAIL_RETRY_MAX || "3"),
      initialDelay: parseInt(process.env.EMAIL_RETRY_DELAY || "1000"),
      metadata: {
        type: "notification",
        provider: process.env.SMTP_HOST || "smtp.gmail.com",
      },
    });
  } catch (error) {
    // Don't throw error for notifications, just return failure
    return {
      success: false,
      errorType: error.errorType,
      errorMessage: error.message,
      retryCount: 3, // Max retries reached
    };
  }
}
