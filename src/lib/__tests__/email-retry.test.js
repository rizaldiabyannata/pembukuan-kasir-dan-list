/**
 * Tests for email retry mechanism with exponential backoff
 */

import {
  sendEmailWithRetry,
  EmailErrorType,
  getUserFriendlyErrorMessage,
} from "../email";

// Mock console methods to avoid cluttering test output
const originalConsoleInfo = console.info;
const originalConsoleError = console.error;
const originalConsoleLog = console.log;

beforeAll(() => {
  console.info = jest.fn();
  console.error = jest.fn();
  console.log = jest.fn();
});

afterAll(() => {
  console.info = originalConsoleInfo;
  console.error = originalConsoleError;
  console.log = originalConsoleLog;
});

describe("Email Retry Mechanism", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  describe("sendEmailWithRetry", () => {
    it("should succeed on first attempt without retries", async () => {
      const mockSendFunction = jest.fn().mockResolvedValue({
        success: true,
        messageId: "test-message-id",
        deliveryTime: 100,
      });

      const result = await sendEmailWithRetry(
        mockSendFunction,
        "test@example.com",
        {
          maxRetries: 3,
          initialDelay: 1000,
          metadata: { type: "test" },
        }
      );

      expect(mockSendFunction).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        success: true,
        messageId: "test-message-id",
        deliveryTime: 100,
        retryCount: 0,
      });
    });

    it("should retry on network errors with exponential backoff", async () => {
      jest.useFakeTimers();

      const networkError = new Error("Network timeout");
      networkError.errorType = EmailErrorType.NETWORK_ERROR;
      networkError.code = "ETIMEDOUT";

      const mockSendFunction = jest
        .fn()
        .mockRejectedValueOnce(networkError)
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce({
          success: true,
          messageId: "test-message-id",
          deliveryTime: 100,
        });

      const resultPromise = sendEmailWithRetry(
        mockSendFunction,
        "test@example.com",
        {
          maxRetries: 3,
          initialDelay: 1000,
          metadata: { type: "test" },
        }
      );

      // First attempt fails immediately
      await jest.advanceTimersByTimeAsync(0);
      expect(mockSendFunction).toHaveBeenCalledTimes(1);

      // Wait for first backoff (1s)
      await jest.advanceTimersByTimeAsync(1000);
      expect(mockSendFunction).toHaveBeenCalledTimes(2);

      // Wait for second backoff (2s)
      await jest.advanceTimersByTimeAsync(2000);
      expect(mockSendFunction).toHaveBeenCalledTimes(3);

      const result = await resultPromise;

      expect(result).toEqual({
        success: true,
        messageId: "test-message-id",
        deliveryTime: 100,
        retryCount: 2,
      });

      jest.useRealTimers();
    });

    it("should not retry on authentication errors", async () => {
      const authError = new Error("Authentication failed");
      authError.errorType = EmailErrorType.AUTH_FAILED;
      authError.code = "EAUTH";

      const mockSendFunction = jest.fn().mockRejectedValue(authError);

      await expect(
        sendEmailWithRetry(mockSendFunction, "test@example.com", {
          maxRetries: 3,
          initialDelay: 1000,
          metadata: { type: "test" },
        })
      ).rejects.toThrow("Authentication failed");

      // Should only attempt once, no retries
      expect(mockSendFunction).toHaveBeenCalledTimes(1);
    });

    it("should not retry on invalid recipient errors", async () => {
      const recipientError = new Error("Invalid recipient");
      recipientError.errorType = EmailErrorType.INVALID_RECIPIENT;
      recipientError.responseCode = 550;

      const mockSendFunction = jest.fn().mockRejectedValue(recipientError);

      await expect(
        sendEmailWithRetry(mockSendFunction, "invalid@example.com", {
          maxRetries: 3,
          initialDelay: 1000,
          metadata: { type: "test" },
        })
      ).rejects.toThrow("Invalid recipient");

      // Should only attempt once, no retries
      expect(mockSendFunction).toHaveBeenCalledTimes(1);
    });

    it("should throw error after max retries reached", async () => {
      // Use real timers with very short delays for this test
      const mockSendFunction = jest.fn().mockImplementation(() => {
        const error = new Error("Network timeout");
        error.errorType = EmailErrorType.NETWORK_ERROR;
        error.code = "ETIMEDOUT";
        return Promise.reject(error);
      });

      let errorThrown = false;
      try {
        await sendEmailWithRetry(mockSendFunction, "test@example.com", {
          maxRetries: 3,
          initialDelay: 10, // Very short delay for testing
          metadata: { type: "test" },
        });
      } catch (error) {
        errorThrown = true;
        expect(error.message).toBe("Network timeout");
      }

      // Should have attempted 3 times
      expect(mockSendFunction).toHaveBeenCalledTimes(3);
      expect(errorThrown).toBe(true);
    });

    it("should use correct exponential backoff delays", async () => {
      // Track timing of attempts
      const attemptTimes = [];
      const mockSendFunction = jest.fn().mockImplementation(() => {
        attemptTimes.push(Date.now());
        const error = new Error("Network timeout");
        error.errorType = EmailErrorType.NETWORK_ERROR;
        return Promise.reject(error);
      });

      try {
        await sendEmailWithRetry(mockSendFunction, "test@example.com", {
          maxRetries: 3,
          initialDelay: 50, // Short delay for testing
          metadata: { type: "test" },
        });
      } catch (error) {
        // Expected to throw
      }

      // Verify 3 attempts were made
      expect(mockSendFunction).toHaveBeenCalledTimes(3);

      // Verify delays are increasing (exponential backoff)
      // First delay: ~50ms, Second delay: ~100ms
      const delay1 = attemptTimes[1] - attemptTimes[0];
      const delay2 = attemptTimes[2] - attemptTimes[1];

      // Allow some tolerance for timing
      expect(delay1).toBeGreaterThanOrEqual(40);
      expect(delay1).toBeLessThan(100);
      expect(delay2).toBeGreaterThanOrEqual(80);
      expect(delay2).toBeLessThan(150);
      expect(delay2).toBeGreaterThan(delay1); // Second delay should be longer
    });

    it("should retry on rate limit errors", async () => {
      jest.useFakeTimers();

      const rateLimitError = new Error("Rate limit exceeded");
      rateLimitError.errorType = EmailErrorType.RATE_LIMIT;
      rateLimitError.responseCode = 450;

      const mockSendFunction = jest
        .fn()
        .mockRejectedValueOnce(rateLimitError)
        .mockResolvedValueOnce({
          success: true,
          messageId: "test-message-id",
          deliveryTime: 100,
        });

      const resultPromise = sendEmailWithRetry(
        mockSendFunction,
        "test@example.com",
        {
          maxRetries: 3,
          initialDelay: 1000,
          metadata: { type: "test" },
        }
      );

      // First attempt fails
      await jest.advanceTimersByTimeAsync(0);
      expect(mockSendFunction).toHaveBeenCalledTimes(1);

      // Wait for backoff and retry
      await jest.advanceTimersByTimeAsync(1000);
      expect(mockSendFunction).toHaveBeenCalledTimes(2);

      const result = await resultPromise;

      expect(result).toEqual({
        success: true,
        messageId: "test-message-id",
        deliveryTime: 100,
        retryCount: 1,
      });

      jest.useRealTimers();
    });

    it("should include retry count in successful result", async () => {
      jest.useFakeTimers();

      const networkError = new Error("Network timeout");
      networkError.errorType = EmailErrorType.NETWORK_ERROR;

      const mockSendFunction = jest
        .fn()
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce({
          success: true,
          messageId: "test-message-id",
          deliveryTime: 100,
        });

      const resultPromise = sendEmailWithRetry(
        mockSendFunction,
        "test@example.com",
        {
          maxRetries: 3,
          initialDelay: 1000,
          metadata: { type: "test" },
        }
      );

      await jest.advanceTimersByTimeAsync(0);
      await jest.advanceTimersByTimeAsync(1000);

      const result = await resultPromise;

      expect(result.retryCount).toBe(1);

      jest.useRealTimers();
    });
  });

  describe("Error Classification", () => {
    it("should provide user-friendly error messages", () => {
      expect(getUserFriendlyErrorMessage(EmailErrorType.AUTH_FAILED)).toBe(
        "Email server configuration issue. Please contact support."
      );
      expect(getUserFriendlyErrorMessage(EmailErrorType.NETWORK_ERROR)).toBe(
        "Network connectivity issue. Please try again later."
      );
      expect(
        getUserFriendlyErrorMessage(EmailErrorType.INVALID_RECIPIENT)
      ).toBe("The email address may be invalid. Please check and try again.");
      expect(getUserFriendlyErrorMessage(EmailErrorType.RATE_LIMIT)).toBe(
        "Too many email requests. Please try again in a few minutes."
      );
      expect(getUserFriendlyErrorMessage(EmailErrorType.UNKNOWN)).toBe(
        "An unexpected error occurred. Please try again or contact support."
      );
    });
  });
});
