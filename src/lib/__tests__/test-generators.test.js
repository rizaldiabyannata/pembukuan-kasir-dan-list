/**
 * Property-Based Tests for Test Generators
 *
 * These tests validate that our test data generators produce valid data
 * that conforms to the expected structure and constraints.
 */

import { describe, it, expect } from "@jest/globals";
import fc from "fast-check";
import {
  transactionArbitrary,
  transactionWithPackageArbitrary,
  approvedTransactionArbitrary,
  expenseArbitrary,
  approvedExpenseArbitrary,
  fuelExpenseArbitrary,
  approvedFuelExpenseArbitrary,
  packageArbitrary,
  dateRangeArbitrary,
  driverArbitrary,
  vehicleArbitrary,
  staffArbitrary,
  userArbitrary,
} from "./test-generators";
import {
  isValidTransaction,
  isValidExpense,
  isValidPackage,
} from "./test-utils";

describe("Test Generators - Property-Based Tests", () => {
  describe("Transaction Generator", () => {
    // Feature: laporan-keuangan-testing, Property 1: Generated transactions are valid
    // Validates: Requirements 1.1
    it("should generate valid transaction objects", () => {
      fc.assert(
        fc.property(transactionArbitrary(), (transaction) => {
          // Check all required fields exist and have correct types
          expect(transaction).toBeDefined();
          expect(typeof transaction.id).toBe("string");
          expect(typeof transaction.invoice_code).toBe("string");
          expect(typeof transaction.customer_name).toBe("string");
          expect(transaction.booking_date).toBeInstanceOf(Date);
          expect(transaction.checkout_datetime).toBeInstanceOf(Date);
          expect(transaction.checkin_datetime).toBeInstanceOf(Date);
          expect(typeof transaction.all_in_rate).toBe("number");
          expect(typeof transaction.overtime_rate_per_hour).toBe("number");
          expect(typeof transaction.approval_status).toBe("string");
          expect(typeof transaction.payment_status).toBe("string");
          expect(typeof transaction.dp_amount).toBe("number");

          // Check value constraints
          expect(transaction.all_in_rate).toBeGreaterThanOrEqual(0);
          expect(transaction.overtime_rate_per_hour).toBeGreaterThanOrEqual(0);
          expect(transaction.dp_amount).toBeGreaterThanOrEqual(0);

          // Check that checkin is after checkout
          expect(transaction.checkin_datetime.getTime()).toBeGreaterThanOrEqual(
            transaction.checkout_datetime.getTime()
          );

          // Check approval status is valid
          expect(["APPROVED", "PENDING", "REJECTED"]).toContain(
            transaction.approval_status
          );

          // Check payment status is valid
          expect(["UNPAID", "DOWN_PAYMENT", "PAID"]).toContain(
            transaction.payment_status
          );

          // Validate using utility function
          expect(isValidTransaction(transaction)).toBe(true);
        })
      );
    });

    it("should generate transactions with package when requested", () => {
      fc.assert(
        fc.property(transactionWithPackageArbitrary(), (transaction) => {
          expect(transaction.package).toBeDefined();
          expect(transaction.packageId).toBe(transaction.package.id);
          expect(isValidPackage(transaction.package)).toBe(true);

          // If TOUR_PACKAGE, should have hotel_tier_id and pax_count
          if (transaction.package.type === "TOUR_PACKAGE") {
            expect(transaction.hotel_tier_id).toBeDefined();
            expect(transaction.pax_count).toBeGreaterThan(0);
          }
        })
      );
    });

    it("should generate approved transactions when requested", () => {
      fc.assert(
        fc.property(approvedTransactionArbitrary(), (transaction) => {
          expect(transaction.approval_status).toBe("APPROVED");
          expect(isValidTransaction(transaction)).toBe(true);
        })
      );
    });
  });

  describe("Expense Generator", () => {
    it("should generate valid expense objects", () => {
      fc.assert(
        fc.property(expenseArbitrary(), (expense) => {
          expect(expense).toBeDefined();
          expect(typeof expense.id).toBe("string");
          expect(expense.date).toBeInstanceOf(Date);
          expect(typeof expense.category).toBe("string");
          expect(typeof expense.amount).toBe("number");
          expect(typeof expense.description).toBe("string");
          expect(typeof expense.approval_status).toBe("string");

          // Check value constraints
          expect(expense.amount).toBeGreaterThanOrEqual(0);

          // Check approval status is valid
          expect(["APPROVED", "PENDING", "REJECTED"]).toContain(
            expense.approval_status
          );

          // Validate using utility function
          expect(isValidExpense(expense)).toBe(true);
        })
      );
    });

    it("should generate approved expenses when requested", () => {
      fc.assert(
        fc.property(approvedExpenseArbitrary(), (expense) => {
          expect(expense.approval_status).toBe("APPROVED");
          expect(isValidExpense(expense)).toBe(true);
        })
      );
    });

    it("should generate fuel expenses with BBM category", () => {
      fc.assert(
        fc.property(fuelExpenseArbitrary(), (expense) => {
          expect(expense.category).toBe("BBM");
          expect(expense.armadaId).toBeDefined();
          expect(typeof expense.armadaId).toBe("string");
          expect(isValidExpense(expense)).toBe(true);
        })
      );
    });

    it("should generate approved fuel expenses", () => {
      fc.assert(
        fc.property(approvedFuelExpenseArbitrary(), (expense) => {
          expect(expense.category).toBe("BBM");
          expect(expense.approval_status).toBe("APPROVED");
          expect(expense.armadaId).toBeDefined();
          expect(isValidExpense(expense)).toBe(true);
        })
      );
    });
  });

  describe("Package Generator", () => {
    it("should generate valid package objects", () => {
      fc.assert(
        fc.property(packageArbitrary(), (pkg) => {
          expect(pkg).toBeDefined();
          expect(typeof pkg.id).toBe("string");
          expect(typeof pkg.name).toBe("string");
          expect(typeof pkg.type).toBe("string");
          expect(typeof pkg.price).toBe("number");

          // Check value constraints
          expect(pkg.price).toBeGreaterThanOrEqual(0);

          // Check package type is valid
          expect([
            "CAR_RENTAL",
            "TOUR_PACKAGE",
            "FULL_DAY_TRIP",
            "CUSTOM_PRICING",
          ]).toContain(pkg.type);

          // TOUR_PACKAGE should have hotel tiers
          if (pkg.type === "TOUR_PACKAGE") {
            expect(pkg.hotelTiers).toBeDefined();
            expect(Array.isArray(pkg.hotelTiers)).toBe(true);
            expect(pkg.hotelTiers.length).toBeGreaterThan(0);
          }

          // CAR_RENTAL should have duration hours
          if (pkg.type === "CAR_RENTAL") {
            expect(pkg.durationHours).toBeGreaterThan(0);
          }

          // Validate using utility function
          expect(isValidPackage(pkg)).toBe(true);
        })
      );
    });
  });

  describe("Date Range Generator", () => {
    it("should generate valid date ranges where start is before end", () => {
      fc.assert(
        fc.property(dateRangeArbitrary(), (range) => {
          expect(range.start).toBeInstanceOf(Date);
          expect(range.end).toBeInstanceOf(Date);
          expect(range.end.getTime()).toBeGreaterThan(range.start.getTime());
        })
      );
    });
  });

  describe("Driver Generator", () => {
    it("should generate valid driver objects", () => {
      fc.assert(
        fc.property(driverArbitrary(), (driver) => {
          expect(driver).toBeDefined();
          expect(typeof driver.id).toBe("string");
          expect(typeof driver.driver_name).toBe("string");
          expect(typeof driver.phone).toBe("string");
          expect(typeof driver.license_number).toBe("string");
          expect(typeof driver.status).toBe("string");

          // Check status is valid
          expect(["AVAILABLE", "ON_TRIP", "OFF_DUTY"]).toContain(driver.status);
        })
      );
    });
  });

  describe("Vehicle Generator", () => {
    it("should generate valid vehicle objects", () => {
      fc.assert(
        fc.property(vehicleArbitrary(), (vehicle) => {
          expect(vehicle).toBeDefined();
          expect(typeof vehicle.id).toBe("string");
          expect(typeof vehicle.license_plate).toBe("string");
          expect(typeof vehicle.brand).toBe("string");
          expect(typeof vehicle.model).toBe("string");
          expect(typeof vehicle.year).toBe("number");
          expect(typeof vehicle.status).toBe("string");

          // Check year is reasonable
          expect(vehicle.year).toBeGreaterThanOrEqual(2010);
          expect(vehicle.year).toBeLessThanOrEqual(2025);

          // Check status is valid
          expect(["READY", "BOOKED", "ON_TRIP", "MAINTENANCE"]).toContain(
            vehicle.status
          );
        })
      );
    });
  });

  describe("Staff Generator", () => {
    it("should generate valid staff objects", () => {
      fc.assert(
        fc.property(staffArbitrary(), (staff) => {
          expect(staff).toBeDefined();
          expect(typeof staff.id).toBe("string");
          expect(typeof staff.staff_name).toBe("string");
          expect(typeof staff.position).toBe("string");
          expect(typeof staff.phone).toBe("string");
          expect(typeof staff.salary).toBe("number");

          // Check salary is reasonable
          expect(staff.salary).toBeGreaterThanOrEqual(0);
        })
      );
    });
  });

  describe("User Generator", () => {
    it("should generate valid user objects", () => {
      fc.assert(
        fc.property(userArbitrary(), (user) => {
          expect(user).toBeDefined();
          expect(typeof user.id).toBe("string");
          expect(typeof user.username).toBe("string");
          expect(typeof user.email).toBe("string");
          expect(typeof user.role).toBe("string");
          expect(typeof user.name).toBe("string");

          // Check email format
          expect(user.email).toContain("@");

          // Check role is valid
          expect(["ADMIN", "OPERATOR"]).toContain(user.role);
        })
      );
    });
  });
});
