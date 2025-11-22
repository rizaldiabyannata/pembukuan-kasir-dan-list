/**
 * Transaction Validator Tests
 * Tests for transaction data validation
 */

import { validateTransactionData } from "../transaction-validator";

describe("Transaction Validator", () => {
  const validTransactionData = {
    customer_name: "John Doe",
    customer_phone: "081234567890",
    booking_date: new Date().toISOString(),
    checkout_datetime: new Date().toISOString(),
    checkin_datetime: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
    all_in_rate: 500000,
    overtime_rate_per_hour: 50000,
    dp_amount: 100000,
    armadaId: "123e4567-e89b-12d3-a456-426614174000",
    driverId: "123e4567-e89b-12d3-a456-426614174001",
  };

  describe("Valid transaction data", () => {
    it("should validate correct transaction data", () => {
      const result = validateTransactionData(validTransactionData);
      expect(result.success).toBe(true);
    });

    it("should validate transaction with optional fields", () => {
      const data = {
        ...validTransactionData,
        packageId: "123e4567-e89b-12d3-a456-426614174002",
        hotel_name: "Hotel Test",
        pax_count: 5,
        hotel_tier_id: "123e4567-e89b-12d3-a456-426614174003",
        custom_price: 750000,
      };
      const result = validateTransactionData(data);
      expect(result.success).toBe(true);
    });
  });

  describe("Customer data validation", () => {
    it("should reject empty customer name", () => {
      const data = { ...validTransactionData, customer_name: "" };
      const result = validateTransactionData(data);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toContain(
        "Nama pelanggan wajib diisi"
      );
    });

    it("should reject customer name that is too long", () => {
      const data = { ...validTransactionData, customer_name: "A".repeat(101) };
      const result = validateTransactionData(data);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toContain("terlalu panjang");
    });

    it("should reject invalid phone number (too short)", () => {
      const data = { ...validTransactionData, customer_phone: "123" };
      const result = validateTransactionData(data);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toContain("tidak valid");
    });

    it("should reject invalid phone number (too long)", () => {
      const data = {
        ...validTransactionData,
        customer_phone: "1234567890123456",
      };
      const result = validateTransactionData(data);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toContain("terlalu panjang");
    });

    it("should reject phone number with invalid characters", () => {
      const data = { ...validTransactionData, customer_phone: "081234abc890" };
      const result = validateTransactionData(data);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toContain(
        "hanya boleh berisi angka"
      );
    });
  });

  describe("Date validation", () => {
    it("should reject when checkin is before checkout", () => {
      const data = {
        ...validTransactionData,
        checkout_datetime: new Date(
          Date.now() + 12 * 60 * 60 * 1000
        ).toISOString(),
        checkin_datetime: new Date().toISOString(),
      };
      const result = validateTransactionData(data);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toContain("harus setelah");
    });

    it("should reject when checkin equals checkout", () => {
      const now = new Date().toISOString();
      const data = {
        ...validTransactionData,
        checkout_datetime: now,
        checkin_datetime: now,
      };
      const result = validateTransactionData(data);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toContain("harus setelah");
    });

    it("should reject checkout date more than 1 year in the past", () => {
      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
      const data = {
        ...validTransactionData,
        checkout_datetime: twoYearsAgo.toISOString(),
        checkin_datetime: new Date(
          twoYearsAgo.getTime() + 12 * 60 * 60 * 1000
        ).toISOString(),
      };
      const result = validateTransactionData(data);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toContain("1 tahun yang lalu");
    });

    it("should reject checkin date more than 1 year in the future", () => {
      const twoYearsFromNow = new Date();
      twoYearsFromNow.setFullYear(twoYearsFromNow.getFullYear() + 2);
      const data = {
        ...validTransactionData,
        checkout_datetime: new Date().toISOString(),
        checkin_datetime: twoYearsFromNow.toISOString(),
      };
      const result = validateTransactionData(data);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toContain("1 tahun ke depan");
    });
  });

  describe("Financial data validation", () => {
    it("should reject negative all_in_rate", () => {
      const data = { ...validTransactionData, all_in_rate: -100000 };
      const result = validateTransactionData(data);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toContain("positif");
    });

    it("should reject zero all_in_rate", () => {
      const data = { ...validTransactionData, all_in_rate: 0 };
      const result = validateTransactionData(data);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toContain("positif");
    });

    it("should reject all_in_rate that is too large", () => {
      const data = { ...validTransactionData, all_in_rate: 2000000000 };
      const result = validateTransactionData(data);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toContain("terlalu besar");
    });

    it("should reject negative overtime_rate_per_hour", () => {
      const data = { ...validTransactionData, overtime_rate_per_hour: -50000 };
      const result = validateTransactionData(data);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toContain("tidak boleh negatif");
    });

    it("should accept zero overtime_rate_per_hour", () => {
      const data = { ...validTransactionData, overtime_rate_per_hour: 0 };
      const result = validateTransactionData(data);
      expect(result.success).toBe(true);
    });

    it("should reject negative dp_amount", () => {
      const data = { ...validTransactionData, dp_amount: -50000 };
      const result = validateTransactionData(data);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toContain("tidak boleh negatif");
    });

    it("should reject dp_amount exceeding all_in_rate", () => {
      const data = {
        ...validTransactionData,
        all_in_rate: 500000,
        dp_amount: 600000,
      };
      const result = validateTransactionData(data);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toContain("tidak boleh melebihi");
    });

    it("should accept dp_amount equal to all_in_rate", () => {
      const data = {
        ...validTransactionData,
        all_in_rate: 500000,
        dp_amount: 500000,
      };
      const result = validateTransactionData(data);
      expect(result.success).toBe(true);
    });

    it("should accept null dp_amount", () => {
      const data = { ...validTransactionData, dp_amount: null };
      const result = validateTransactionData(data);
      expect(result.success).toBe(true);
    });
  });

  describe("Relation validation", () => {
    it("should reject invalid armadaId UUID", () => {
      const data = { ...validTransactionData, armadaId: "invalid-uuid" };
      const result = validateTransactionData(data);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toContain("tidak valid");
    });

    it("should reject invalid driverId UUID", () => {
      const data = { ...validTransactionData, driverId: "invalid-uuid" };
      const result = validateTransactionData(data);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toContain("tidak valid");
    });

    it("should reject invalid packageId UUID", () => {
      const data = { ...validTransactionData, packageId: "invalid-uuid" };
      const result = validateTransactionData(data);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toContain("tidak valid");
    });

    it("should accept null packageId", () => {
      const data = { ...validTransactionData, packageId: null };
      const result = validateTransactionData(data);
      expect(result.success).toBe(true);
    });
  });

  describe("Tour package data validation", () => {
    it("should reject pax_count that is too large", () => {
      const data = { ...validTransactionData, pax_count: 150 };
      const result = validateTransactionData(data);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toContain("terlalu besar");
    });

    it("should reject negative pax_count", () => {
      const data = { ...validTransactionData, pax_count: -5 };
      const result = validateTransactionData(data);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toContain("positif");
    });

    it("should reject zero pax_count", () => {
      const data = { ...validTransactionData, pax_count: 0 };
      const result = validateTransactionData(data);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toContain("positif");
    });

    it("should accept valid pax_count", () => {
      const data = { ...validTransactionData, pax_count: 10 };
      const result = validateTransactionData(data);
      expect(result.success).toBe(true);
    });

    it("should reject hotel_name that is too long", () => {
      const data = { ...validTransactionData, hotel_name: "A".repeat(201) };
      const result = validateTransactionData(data);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toContain("terlalu panjang");
    });
  });

  describe("Custom pricing validation", () => {
    it("should reject negative custom_price", () => {
      const data = { ...validTransactionData, custom_price: -100000 };
      const result = validateTransactionData(data);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toContain("positif");
    });

    it("should reject zero custom_price", () => {
      const data = { ...validTransactionData, custom_price: 0 };
      const result = validateTransactionData(data);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toContain("positif");
    });

    it("should reject custom_price that is too large", () => {
      const data = { ...validTransactionData, custom_price: 2000000000 };
      const result = validateTransactionData(data);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toContain("terlalu besar");
    });

    it("should accept valid custom_price", () => {
      const data = { ...validTransactionData, custom_price: 750000 };
      const result = validateTransactionData(data);
      expect(result.success).toBe(true);
    });
  });
});
