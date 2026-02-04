import { describe, it, expect, beforeEach } from "vitest";
import {
  checkRateLimit,
  resetRateLimit,
  getRateLimitStatus,
  RATE_LIMITS,
} from "./rate-limit";

describe("Rate Limiter", () => {
  const testEmail = "test@example.com";

  beforeEach(() => {
    // Reset rate limits before each test
    resetRateLimit(testEmail, "auth");
    resetRateLimit(testEmail, "otp");
    resetRateLimit(testEmail, "ticket");
  });

  describe("checkRateLimit", () => {
    it("should allow requests within limit", () => {
      const result = checkRateLimit(testEmail, "auth");

      expect(result.success).toBe(true);
      expect(result.remaining).toBe(RATE_LIMITS.auth.requests - 1);
    });

    it("should block requests exceeding limit", () => {
      // Use all allowed requests
      for (let i = 0; i < RATE_LIMITS.auth.requests; i++) {
        checkRateLimit(testEmail, "auth");
      }

      // Next request should be blocked
      const result = checkRateLimit(testEmail, "auth");

      expect(result.success).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.message).toContain("Demasiados intentos");
    });

    it("should track different identifiers separately", () => {
      const email1 = "user1@example.com";
      const email2 = "user2@example.com";

      // Exhaust limit for email1
      for (let i = 0; i < RATE_LIMITS.auth.requests; i++) {
        checkRateLimit(email1, "auth");
      }

      // email2 should still be allowed
      const result = checkRateLimit(email2, "auth");
      expect(result.success).toBe(true);

      // Clean up
      resetRateLimit(email1, "auth");
      resetRateLimit(email2, "auth");
    });

    it("should track different rate limit types separately", () => {
      // Exhaust auth limit
      for (let i = 0; i < RATE_LIMITS.auth.requests; i++) {
        checkRateLimit(testEmail, "auth");
      }

      // OTP should still be allowed (different type)
      const result = checkRateLimit(testEmail, "otp");
      expect(result.success).toBe(true);
    });
  });

  describe("resetRateLimit", () => {
    it("should reset rate limit for identifier", () => {
      // Exhaust limit
      for (let i = 0; i < RATE_LIMITS.auth.requests; i++) {
        checkRateLimit(testEmail, "auth");
      }

      // Verify blocked
      expect(checkRateLimit(testEmail, "auth").success).toBe(false);

      // Reset
      resetRateLimit(testEmail, "auth");

      // Should be allowed again
      const result = checkRateLimit(testEmail, "auth");
      expect(result.success).toBe(true);
    });
  });

  describe("getRateLimitStatus", () => {
    it("should return current status without incrementing", () => {
      // Make 2 requests
      checkRateLimit(testEmail, "auth");
      checkRateLimit(testEmail, "auth");

      // Get status (should not increment)
      const status = getRateLimitStatus(testEmail, "auth");

      expect(status.current).toBe(2);
      expect(status.limit).toBe(RATE_LIMITS.auth.requests);
      expect(status.remaining).toBe(RATE_LIMITS.auth.requests - 2);

      // Verify it didn't increment
      const status2 = getRateLimitStatus(testEmail, "auth");
      expect(status2.current).toBe(2);
    });

    it("should return full limit for unknown identifier", () => {
      const status = getRateLimitStatus("unknown@example.com", "auth");

      expect(status.current).toBe(0);
      expect(status.limit).toBe(RATE_LIMITS.auth.requests);
      expect(status.remaining).toBe(RATE_LIMITS.auth.requests);
    });
  });

  describe("RATE_LIMITS configuration (security limits)", () => {
    it("should have correct auth limits (5 req/min - anti brute-force)", () => {
      expect(RATE_LIMITS.auth.requests).toBe(5);
      expect(RATE_LIMITS.auth.windowMs).toBe(60 * 1000);
    });

    it("should have correct register limits (3 req/min - anti spam)", () => {
      expect(RATE_LIMITS.register.requests).toBe(3);
      expect(RATE_LIMITS.register.windowMs).toBe(60 * 1000);
    });

    it("should have correct otp limits (3 req/5min - OTP protection)", () => {
      expect(RATE_LIMITS.otp.requests).toBe(3);
      expect(RATE_LIMITS.otp.windowMs).toBe(5 * 60 * 1000);
    });

    it("should have correct ticket limits (10 req/min)", () => {
      expect(RATE_LIMITS.ticket.requests).toBe(10);
      expect(RATE_LIMITS.ticket.windowMs).toBe(60 * 1000);
    });

    it("should have correct api limits (100 req/min)", () => {
      expect(RATE_LIMITS.api.requests).toBe(100);
      expect(RATE_LIMITS.api.windowMs).toBe(60 * 1000);
    });
  });
});
