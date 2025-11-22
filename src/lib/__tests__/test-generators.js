/**
 * Property-Based Testing Generators
 *
 * This file contains fast-check generators for creating random valid test data
 * for transactions, expenses, packages, and date ranges.
 *
 * These generators are used in property-based tests to verify correctness
 * properties across a wide range of inputs.
 */

import fc from "fast-check";

/**
 * Generate a valid date within a reasonable range
 * Default: between 2020 and 2030
 */
export const dateArbitrary = (minYear = 2020, maxYear = 2030) => {
  return fc.date({
    min: new Date(minYear, 0, 1),
    max: new Date(maxYear, 11, 31),
  });
};

/**
 * Generate a valid date range where start is before end
 */
export const dateRangeArbitrary = () => {
  return fc
    .tuple(dateArbitrary(), fc.integer({ min: 1, max: 365 }))
    .map(([start, daysOffset]) => {
      // Ensure start is a valid date
      const startDate = new Date(start);
      if (isNaN(startDate.getTime())) {
        // Fallback to a valid date if invalid
        return { start: new Date(2023, 0, 1), end: new Date(2023, 0, 2) };
      }

      const end = new Date(startDate);
      end.setDate(end.getDate() + daysOffset);

      // Ensure end is also valid
      if (isNaN(end.getTime())) {
        const fallbackEnd = new Date(startDate);
        fallbackEnd.setDate(fallbackEnd.getDate() + 1);
        return { start: startDate, end: fallbackEnd };
      }

      return { start: startDate, end };
    });
};

/**
 * Generate a valid package type
 */
export const packageTypeArbitrary = () => {
  return fc.constantFrom(
    "CAR_RENTAL",
    "TOUR_PACKAGE",
    "FULL_DAY_TRIP",
    "CUSTOM_PRICING"
  );
};

/**
 * Generate a valid expense category
 */
export const expenseCategoryArbitrary = () => {
  return fc.constantFrom(
    "BBM",
    "Maintenance",
    "Gaji Sopir",
    "Gaji Staff",
    "Sewa Kantor",
    "Listrik",
    "Internet",
    "Lain-lain"
  );
};

/**
 * Generate a valid approval status
 */
export const approvalStatusArbitrary = (approvedBias = 0.8) => {
  return fc.oneof(
    {
      arbitrary: fc.constant("APPROVED"),
      weight: Math.floor(approvedBias * 100),
    },
    {
      arbitrary: fc.constant("PENDING"),
      weight: Math.floor((1 - approvedBias) * 50),
    },
    {
      arbitrary: fc.constant("REJECTED"),
      weight: Math.floor((1 - approvedBias) * 50),
    }
  );
};

/**
 * Generate a valid payment status
 */
export const paymentStatusArbitrary = () => {
  return fc.constantFrom("UNPAID", "DOWN_PAYMENT", "PAID");
};

/**
 * Generate hotel tiers for tour packages
 */
export const hotelTiersArbitrary = () => {
  return fc.array(
    fc.record({
      id: fc.uuid(),
      name: fc.constantFrom("Budget", "Standard", "Premium", "Luxury"),
      priceRanges: fc
        .array(
          fc.record({
            minPax: fc.integer({ min: 1, max: 10 }),
            maxPax: fc.integer({ min: 1, max: 20 }),
            price: fc.integer({ min: 50000, max: 500000 }),
          }),
          { minLength: 1, maxLength: 5 }
        )
        .map((ranges) => {
          // Sort and ensure non-overlapping ranges
          return ranges
            .sort((a, b) => a.minPax - b.minPax)
            .map((range, idx) => ({
              ...range,
              minPax: idx === 0 ? 1 : ranges[idx - 1].maxPax + 1,
              maxPax:
                range.maxPax > range.minPax ? range.maxPax : range.minPax + 2,
            }));
        }),
    }),
    { minLength: 1, maxLength: 4 }
  );
};

/**
 * Generate a valid package object
 */
export const packageArbitrary = () => {
  return packageTypeArbitrary().chain((type) => {
    if (type === "TOUR_PACKAGE") {
      return fc.record({
        id: fc.uuid(),
        name: fc.string({ minLength: 5, maxLength: 50 }),
        type: fc.constant(type),
        price: fc.integer({ min: 100000, max: 2000000 }),
        description: fc.option(fc.string({ minLength: 10, maxLength: 200 }), {
          nil: null,
        }),
        durationHours: fc.constant(null),
        hotelTiers: hotelTiersArbitrary(),
      });
    } else if (type === "FULL_DAY_TRIP") {
      return fc.record({
        id: fc.uuid(),
        name: fc.string({ minLength: 5, maxLength: 50 }),
        type: fc.constant(type),
        price: fc.integer({ min: 100000, max: 2000000 }),
        description: fc.option(fc.string({ minLength: 10, maxLength: 200 }), {
          nil: null,
        }),
        durationHours: fc.constant(null),
        hotelTiers: fc.constant(null),
      });
    } else {
      return fc.record({
        id: fc.uuid(),
        name: fc.string({ minLength: 5, maxLength: 50 }),
        type: fc.constant(type),
        price: fc.integer({ min: 100000, max: 2000000 }),
        description: fc.option(fc.string({ minLength: 10, maxLength: 200 }), {
          nil: null,
        }),
        durationHours: fc.integer({ min: 4, max: 24 }),
        hotelTiers: fc.constant(null),
      });
    }
  });
};

/**
 * Generate a valid transaction object
 */
export const transactionArbitrary = () => {
  return fc
    .record({
      id: fc.uuid(),
      invoice_code: fc
        .string({ minLength: 8, maxLength: 20 })
        .map((s) => `INV-${s}`),
      customer_name: fc.string({ minLength: 3, maxLength: 50 }),
      booking_date: dateArbitrary(),
      checkout_datetime: dateArbitrary(),
      all_in_rate: fc.integer({ min: 100000, max: 5000000 }),
      overtime_rate_per_hour: fc.integer({ min: 25000, max: 200000 }),
      custom_price: fc.option(fc.integer({ min: 100000, max: 5000000 }), {
        nil: null,
      }),
      hotel_tier_id: fc.option(fc.uuid(), { nil: null }),
      pax_count: fc.option(fc.integer({ min: 1, max: 20 }), { nil: null }),
      approval_status: approvalStatusArbitrary(),
      payment_status: paymentStatusArbitrary(),
      dp_amount: fc.integer({ min: 0, max: 2000000 }),
      packageId: fc.option(fc.uuid(), { nil: null }),
      armadaId: fc.option(fc.uuid(), { nil: null }),
      driverId: fc.option(fc.uuid(), { nil: null }),
    })
    .chain((baseTransaction) => {
      // Generate checkin_datetime after checkout_datetime
      return fc.integer({ min: 1, max: 72 }).map((hoursOffset) => {
        const checkout = new Date(baseTransaction.checkout_datetime);

        // Handle invalid dates
        if (isNaN(checkout.getTime())) {
          const fallbackCheckout = new Date(2023, 0, 1, 8, 0, 0);
          const fallbackCheckin = new Date(2023, 0, 1, 20, 0, 0);
          return {
            ...baseTransaction,
            checkout_datetime: fallbackCheckout,
            checkin_datetime: fallbackCheckin,
            actual_checkin_datetime: null,
          };
        }

        const checkin = new Date(checkout);
        checkin.setHours(checkin.getHours() + hoursOffset);

        return {
          ...baseTransaction,
          checkin_datetime: checkin,
          actual_checkin_datetime: fc.sample(
            fc.option(
              fc.constant(checkin).map((d) => {
                const actual = new Date(d);
                actual.setMinutes(
                  actual.getMinutes() +
                    fc.sample(fc.integer({ min: -30, max: 120 }), 1)[0]
                );
                return actual;
              }),
              { nil: null }
            ),
            1
          )[0],
        };
      });
    });
};

/**
 * Generate a transaction with a specific package
 */
export const transactionWithPackageArbitrary = () => {
  return fc
    .tuple(transactionArbitrary(), packageArbitrary())
    .map(([transaction, pkg]) => ({
      ...transaction,
      packageId: pkg.id,
      package: pkg,
      // Set hotel_tier_id and pax_count for TOUR_PACKAGE
      hotel_tier_id:
        pkg.type === "TOUR_PACKAGE" && pkg.hotelTiers?.length > 0
          ? pkg.hotelTiers[0].id
          : null,
      pax_count:
        pkg.type === "TOUR_PACKAGE"
          ? fc.sample(fc.integer({ min: 1, max: 10 }), 1)[0]
          : null,
    }));
};

/**
 * Generate an approved transaction (for filtering tests)
 */
export const approvedTransactionArbitrary = () => {
  return transactionArbitrary().map((t) => ({
    ...t,
    approval_status: "APPROVED",
  }));
};

/**
 * Generate a valid expense object
 */
export const expenseArbitrary = () => {
  return fc.record({
    id: fc.uuid(),
    date: dateArbitrary(),
    category: expenseCategoryArbitrary(),
    amount: fc.integer({ min: 10000, max: 5000000 }),
    description: fc.string({ minLength: 5, maxLength: 200 }),
    approval_status: approvalStatusArbitrary(),
    paymentMonth: fc.option(dateArbitrary(), { nil: null }),
    armadaId: fc.option(fc.uuid(), { nil: null }),
    driverId: fc.option(fc.uuid(), { nil: null }),
    staffId: fc.option(fc.uuid(), { nil: null }),
  });
};

/**
 * Generate an approved expense (for filtering tests)
 */
export const approvedExpenseArbitrary = () => {
  return expenseArbitrary().map((e) => ({
    ...e,
    approval_status: "APPROVED",
  }));
};

/**
 * Generate a BBM (fuel) expense
 */
export const fuelExpenseArbitrary = () => {
  return expenseArbitrary().map((e) => ({
    ...e,
    category: "BBM",
    armadaId: fc.sample(fc.uuid(), 1)[0], // Always has a vehicle
  }));
};

/**
 * Generate an approved BBM expense
 */
export const approvedFuelExpenseArbitrary = () => {
  return fuelExpenseArbitrary().map((e) => ({
    ...e,
    approval_status: "APPROVED",
  }));
};

/**
 * Generate a driver object
 */
export const driverArbitrary = () => {
  return fc.record({
    id: fc.uuid(),
    driver_name: fc.string({ minLength: 3, maxLength: 50 }),
    phone: fc.string({ minLength: 10, maxLength: 15 }),
    license_number: fc.string({ minLength: 10, maxLength: 20 }),
    status: fc.constantFrom("AVAILABLE", "ON_TRIP", "OFF_DUTY"),
  });
};

/**
 * Generate a vehicle object
 */
export const vehicleArbitrary = () => {
  return fc.record({
    id: fc.uuid(),
    license_plate: fc.string({ minLength: 5, maxLength: 15 }),
    brand: fc.constantFrom(
      "Toyota",
      "Honda",
      "Suzuki",
      "Daihatsu",
      "Mitsubishi"
    ),
    model: fc.string({ minLength: 3, maxLength: 30 }),
    year: fc.integer({ min: 2010, max: 2025 }),
    status: fc.constantFrom("READY", "BOOKED", "ON_TRIP", "MAINTENANCE"),
  });
};

/**
 * Generate a staff object
 */
export const staffArbitrary = () => {
  return fc.record({
    id: fc.uuid(),
    staff_name: fc.string({ minLength: 3, maxLength: 50 }),
    position: fc.constantFrom("Manager", "Admin", "Operator", "Accountant"),
    phone: fc.string({ minLength: 10, maxLength: 15 }),
    salary: fc.integer({ min: 3000000, max: 15000000 }),
  });
};

/**
 * Generate a user object
 */
export const userArbitrary = () => {
  return fc.record({
    id: fc.uuid(),
    username: fc.string({ minLength: 3, maxLength: 30 }),
    email: fc.emailAddress(),
    role: fc.constantFrom("ADMIN", "OPERATOR"),
    name: fc.string({ minLength: 3, maxLength: 50 }),
  });
};
