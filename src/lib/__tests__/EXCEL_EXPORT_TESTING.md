# Excel Export Testing Infrastructure

This document describes the property-based testing infrastructure for Excel export functionality.

## Overview

The testing infrastructure uses **fast-check** for property-based testing (PBT) to ensure Excel export functions handle all possible data variations correctly. Property-based testing generates hundreds of random test cases to verify that correctness properties hold across all inputs.

## Setup

### Dependencies

- **fast-check** (v4.3.0): Property-based testing library
- **Jest** (v30.2.0): Test framework
- **@testing-library/jest-dom**: DOM matchers

### Configuration

Jest is configured in `jest.config.js` with:

- Test timeout: 30 seconds (for 100+ property test iterations)
- Global fast-check configuration: minimum 100 runs per property test
- Test environment: jsdom

Fast-check is globally configured in `src/lib/__tests__/setup.js`:

```javascript
fc.configureGlobal({
  numRuns: 100, // Minimum as per design document
  verbose: false,
  seed: Date.now(),
});
```

## Test Utilities

### File: `excel-export-test-setup.js`

This file provides:

#### 1. Fast-check Generators (Arbitraries)

- **`transactionArbitrary`**: Generates random transaction objects with nested relations
- **`expenseArbitrary`**: Generates random expense objects with nested relations

Example usage:

```javascript
fc.assert(
  fc.property(transactionArbitrary, (transaction) => {
    // Test property with random transaction
    const result = mapTransactionToExportRow(transaction);
    expect(result).toBeDefined();
    return true;
  })
);
```

#### 2. Validation Utilities

- **`isPresent(value)`**: Check if value is not null/undefined
- **`isValidNumber(value)`**: Validate numeric values
- **`isValidDate(value)`**: Validate date values
- **`hasNestedProperty(obj, path)`**: Check nested property existence
- **`testAccessor(obj, correctPath, incorrectPath)`**: Test field accessor correctness
- **`getNestedValue(obj, path)`**: Safely retrieve nested values

#### 3. Mock Data Generators

For specific test scenarios:

- **`createCompleteTransaction(overrides)`**: Transaction with all relations
- **`createTransactionWithMissingRelations(overrides)`**: Transaction with null relations
- **`createCompleteExpense(overrides)`**: Expense with all relations
- **`createExpenseWithMissingRelations(overrides)`**: Expense with null relations

Example:

```javascript
const tx = createCompleteTransaction({
  customer_name: "Custom Name",
  all_in_rate: 999999,
});
```

#### 4. Export Validation Helpers

- **`validateExportRow(row, requiredIndices)`**: Validate export row completeness
- **`validateCurrencyValue(value)`**: Validate currency formatting
- **`validateDateFormat(dateString, locale)`**: Validate date formatting

#### 5. Test Configuration

Constants in `TEST_CONFIG`:

- `MIN_PROPERTY_TEST_RUNS`: 100 (minimum iterations)
- `DEFAULT_DATE_RANGE`: Test date range
- `MISSING_DATA_PLACEHOLDER`: "-" (for missing data)
- `ZERO_AMOUNT_PLACEHOLDER`: 0 (for zero amounts)

## Writing Property-Based Tests

### Basic Structure

```javascript
import fc from "fast-check";
import { transactionArbitrary } from "./excel-export-test-setup";

describe("Property: Field Accessor Consistency", () => {
  it("should use correct nested accessors for all transactions", () => {
    fc.assert(
      fc.property(transactionArbitrary, (transaction) => {
        // Test the property
        const result = mapTransactionToExportRow(transaction);

        // Verify property holds
        expect(result).toBeDefined();

        return true;
      })
    );
  });
});
```

### Property Test Annotations

Each property-based test MUST include a comment linking to the design document:

```javascript
/**
 * Feature: financial-report-export-data-fix, Property 1: Field Accessor Consistency
 * Validates: Requirements 5.1, 5.2, 5.3, 5.4
 */
it("should use correct field accessors", () => {
  // Test implementation
});
```

## Running Tests

### Run all export tests

```bash
npm test -- excel-export
```

### Run specific test file

```bash
npm test -- src/lib/__tests__/excel-export-setup.test.js
```

### Run with coverage

```bash
npm run test:coverage -- excel-export
```

### Run in watch mode

```bash
npm run test:watch -- excel-export
```

## Test Organization

Export tests are organized as follows:

```
src/lib/__tests__/
├── excel-export-test-setup.js       # Test utilities and generators
├── excel-export-setup.test.js       # Infrastructure verification tests
├── excel-export-data-mapping.test.js      # Unit tests (to be created)
└── excel-export.property.test.js          # Property-based tests (to be created)
```

## Best Practices

### 1. Use Property Tests for Universal Properties

Property tests should verify rules that apply to ALL inputs:

- Field accessor consistency
- Null safety
- Data type preservation
- Format consistency

### 2. Use Unit Tests for Specific Examples

Unit tests should verify specific scenarios:

- Edge cases (empty data, boundary values)
- Error conditions
- Integration with other modules

### 3. Generate Smart Test Data

Constrain generators to valid input space:

```javascript
// Good: Constrained to valid range
fc.integer({ min: 100000, max: 5000000 });

// Bad: Unconstrained (may generate invalid values)
fc.integer();
```

### 4. Test Real Functionality

- DO NOT use mocks to make tests pass
- Tests should validate actual export behavior
- Use real data structures from Prisma

### 5. Handle Failures Properly

When a property test fails:

1. Check if test is incorrect (wrong constraints)
2. Check if code has a bug
3. Check if specification needs clarification
4. Use `updatePBTStatus` tool to report issues

## Troubleshooting

### Test Timeout

If tests timeout, increase Jest timeout:

```javascript
jest.setTimeout(60000); // 60 seconds
```

### Flaky Tests

If tests are flaky:

1. Check for non-deterministic behavior
2. Verify generators produce valid data
3. Use fixed seed for reproducibility:

```javascript
fc.configureGlobal({ seed: 12345 });
```

### Debugging Property Tests

Enable verbose mode to see generated values:

```javascript
fc.configureGlobal({ verbose: true });
```

Or use `fc.sample()` to inspect generated values:

```javascript
const samples = fc.sample(transactionArbitrary, 10);
console.log(samples);
```

## References

- [fast-check Documentation](https://fast-check.dev/)
- [Property-Based Testing Guide](https://fast-check.dev/docs/introduction/)
- Design Document: `.kiro/specs/financial-report-export-data-fix/design.md`
- Requirements: `.kiro/specs/financial-report-export-data-fix/requirements.md`
