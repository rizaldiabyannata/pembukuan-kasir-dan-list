/**
 * Accounting Utilities
 * Centralized financial calculation logic for consistency across the application
 */

/**
 * Calculate CUSTOM_PRICING package price
 * @param {Object} transaction - Transaction object with custom pricing
 * @returns {number} Custom price for the package
 */
function calculateCustomPackagePrice(transaction) {
  if (!transaction.package || transaction.package.type !== "CUSTOM_PRICING") {
    return transaction.all_in_rate || 0;
  }

  // For CUSTOM_PRICING, use the custom_price field if available
  // Otherwise fall back to all_in_rate
  return transaction.custom_price || transaction.all_in_rate || 0;
}

/**
 * Calculate TOUR_PACKAGE pricing based on hotel tier and pax count
 * @param {Object} packageObj - Package object with hotelTiers
 * @param {string} hotelTierId - Selected hotel tier ID
 * @param {number} paxCount - Number of passengers
 * @returns {number} Calculated price for the TOUR_PACKAGE
 */
export function calculateTourPackagePriceFromParams(packageObj, hotelTierId, paxCount) {
  if (!packageObj || packageObj.type !== "TOUR_PACKAGE") {
    return 0;
  }

  if (!hotelTierId || !paxCount) {
    return 0;
  }

  // Find the selected hotel tier
  const selectedTier = packageObj.hotelTiers?.find(
    (tier) => tier.id === hotelTierId
  );

  if (!selectedTier || !selectedTier.priceRanges) {
    return 0;
  }

  const pax = parseInt(paxCount) || 0;
  if (pax <= 0) {
    return 0;
  }

  // Find the appropriate price range for the pax count
  const applicableRange = selectedTier.priceRanges.find(
    (range) => pax >= range.minPax && pax <= range.maxPax
  );

  if (!applicableRange) {
    return 0;
  }

  // Calculate total price: price per pax * number of pax
  // Note: 'price' field in DB represents price per pax
  return applicableRange.price * pax;
}

/**
 * Calculate TOUR_PACKAGE pricing based on hotel tier and pax count
 * @param {Object} transaction - Transaction object with package and hotel_tier_id
 * @returns {number} Calculated price for the TOUR_PACKAGE
 */
function calculateTourPackagePrice(transaction) {
  if (!transaction.package || transaction.package.type !== "TOUR_PACKAGE") {
    return transaction.all_in_rate || 0;
  }

  return calculateTourPackagePriceFromParams(
    transaction.package,
    transaction.hotel_tier_id,
    transaction.pax_count
  );
}

/**
 * Calculate financial details for a single transaction
 * @param {Object} transaction - Transaction object with all financial fields
 * @returns {Object} Calculated financial metrics
 */
export function calculateTransactionFinancials(transaction) {
  // Package duration: use package duration if exists, otherwise undefined for custom rentals
  const durasiPaketJam = transaction.package?.durationHours;

  // Use actual checkin time if transaction is completed, otherwise use planned time
  const start = new Date(transaction.checkout_datetime);
  const end = transaction.actual_checkin_datetime
    ? new Date(transaction.actual_checkin_datetime)
    : new Date(transaction.checkin_datetime);

  // Validate dates are valid Date objects
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return {
      lamaSewaJam: 0,
      lamaOvertimeJam: 0,
      totalOvertimeFee: 0,
      totalPendapatan: transaction.all_in_rate || 0,
      totalBiayaOps: 0,
      labaKotor: transaction.all_in_rate || 0,
      error: "Invalid date format",
    };
  }

  // Edge case: Invalid time range
  if (end <= start) {
    return {
      lamaSewaJam: 0,
      lamaOvertimeJam: 0,
      totalOvertimeFee: 0,
      totalPendapatan: transaction.all_in_rate || 0,
      totalBiayaOps: 0,
      labaKotor: transaction.all_in_rate || 0,
    };
  }

  // Calculate rental duration in hours
  const diffMs = end.getTime() - start.getTime();
  const lamaSewaJam = Math.round(diffMs / (1000 * 60 * 60));

  // For TOUR_PACKAGE and FULL_DAY_TRIP, no overtime calculation (flat rate)
  // For custom rentals without packages, also no overtime (no package duration to exceed)
  const packageType = transaction.package?.type;
  const hasNoOvertime =
    packageType === "TOUR_PACKAGE" ||
    packageType === "FULL_DAY_TRIP" ||
    !durasiPaketJam; // No package duration means custom rental

  const lamaOvertimeJam = hasNoOvertime
    ? 0
    : Math.max(0, lamaSewaJam - durasiPaketJam);

  // Calculate overtime fee (0 for TOUR_PACKAGE and FULL_DAY_TRIP)
  const totalOvertimeFee = hasNoOvertime
    ? 0
    : lamaOvertimeJam * (transaction.overtime_rate_per_hour || 0);

  // Calculate base revenue (use appropriate pricing based on package type)
  const baseRevenue =
    packageType === "TOUR_PACKAGE"
      ? calculateTourPackagePrice(transaction)
      : packageType === "CUSTOM_PRICING"
        ? calculateCustomPackagePrice(transaction)
        : transaction.all_in_rate || 0;

  // Calculate total revenue (base rate + overtime)
  const totalPendapatan = baseRevenue + totalOvertimeFee;

  // Operational costs from transaction-level fuel/driver are removed
  const totalBiayaOps = 0;

  // Calculate gross profit
  const labaKotor = totalPendapatan - totalBiayaOps;

  return {
    lamaSewaJam,
    lamaOvertimeJam,
    totalOvertimeFee,
    totalPendapatan,
    totalBiayaOps,
    labaKotor,
  };
}

/**
 * Calculate aggregate financial metrics for multiple transactions
 * @param {Array} transactions - Array of transaction objects
 * @returns {Object} Aggregated financial metrics
 */
export function calculateAggregateFinancials(transactions) {
  let totalRevenue = 0;
  let totalOperationalCosts = 0;
  let totalGrossProfit = 0;
  let totalOvertimeFees = 0;

  transactions.forEach((transaction) => {
    const financials = calculateTransactionFinancials(transaction);
    totalRevenue += financials.totalPendapatan;
    totalOperationalCosts += financials.totalBiayaOps;
    totalGrossProfit += financials.labaKotor;
    totalOvertimeFees += financials.totalOvertimeFee;
  });

  return {
    totalRevenue,
    totalOperationalCosts,
    totalGrossProfit,
    totalOvertimeFees,
    transactionCount: transactions.length,
    averageRevenue:
      transactions.length > 0 ? totalRevenue / transactions.length : 0,
    averageProfit:
      transactions.length > 0 ? totalGrossProfit / transactions.length : 0,
  };
}

/**
 * Calculate net profit including office expenses
 * @param {number} grossProfit - Total gross profit from transactions
 * @param {number} officeExpenses - Total office/operational expenses
 * @returns {Object} Net profit calculation
 */
export function calculateNetProfit(grossProfit, officeExpenses) {
  const netProfit = grossProfit - officeExpenses;
  const profitMargin = grossProfit > 0 ? (netProfit / grossProfit) * 100 : 0;

  return {
    grossProfit,
    officeExpenses,
    netProfit,
    profitMargin,
  };
}

/**
 * Validate transaction financial data
 * @param {Object} transaction - Transaction object to validate
 * @returns {Object} Validation result with errors array
 */
export function validateTransactionFinancials(transaction) {
  const errors = [];

  // Validate checkout before checkin
  const checkout = new Date(transaction.checkout_datetime);
  const checkin = new Date(transaction.checkin_datetime);

  if (checkin <= checkout) {
    errors.push("Check-in time must be after check-out time");
  }

  // Validate positive amounts
  if (transaction.all_in_rate < 0) {
    errors.push("All-in rate cannot be negative");
  }

  if (transaction.overtime_rate_per_hour < 0) {
    errors.push("Overtime rate cannot be negative");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Format currency to IDR
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount) {
  if (typeof amount !== "number" || isNaN(amount)) {
    return "Rp 0";
  }

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format currency to compact notation (for charts/dashboards)
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency string
 */
export function formatCurrencyCompact(amount) {
  if (typeof amount !== "number" || isNaN(amount)) {
    return "Rp 0";
  }

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    notation: "compact",
  }).format(amount);
}
/**
 * Map Expense Categories to Financial Statement Sections
 * COGS: Cost of Goods Sold (Biaya Langsung)
 * OPEX: Operating Expenses (Biaya Operasional Kantor)
 */
export const EXPENSE_CATEGORIES_MAP = {
  // COGS - Direct Costs
  BBM: "COGS",
  GAJI_SOPIR: "COGS",
  PERAWATAN_ARMADA: "COGS",
  KONSUMSI: "COGS", // Konsumsi during trips usually

  // OPEX - Operating Expenses
  LISTRIK: "OPEX",
  INTERNET: "OPEX",
  PAKET_DATA: "OPEX",
  GAJI_STAF_OPERASIONAL: "OPEX",
  GAJI_STAF_ADMIN: "OPEX",
  INSENTIF_BONUS: "OPEX",
  PAJAK: "OPEX",
  ALAT_TULIS_KANTOR: "OPEX",
  KOMPUTER_SUPPLIES: "OPEX",
  OPERASIONAL_LAINNYA: "OPEX",
  LAINNYA: "OPEX",
};

/**
 * Calculate Income Statement (Laporan Laba Rugi)
 * Standard Structure: Revenue -> COGS -> Gross Profit -> OpEx -> Net Profit
 * @param {Array} transactions - List of approved transactions
 * @param {Array} expenses - List of approved expenses
 * @returns {Object} Income Statement Data
 */
export function calculateIncomeStatement(transactions, expenses) {
  // 1. Calculate Revenue (Pendapatan)
  let revenue = {
    rental: 0, // Sewa Mobil
    overtime: 0, // Overtime
    total: 0,
  };

  transactions.forEach((tx) => {
    const financials = calculateTransactionFinancials(tx);
    revenue.rental += financials.totalPendapatan - financials.totalOvertimeFee;
    revenue.overtime += financials.totalOvertimeFee;
  });
  revenue.total = revenue.rental + revenue.overtime;

  // 2. Calculate COGS (Harga Pokok Penjualan)
  let cogs = {
    fuel: 0, // BBM
    driverSalary: 0, // Gaji Sopir
    maintenance: 0, // Perawatan Armada
    consumption: 0, // Konsumsi
    other: 0, // Lainnya (if any mapped to COGS)
    total: 0,
  };

  // 3. Calculate OpEx (Biaya Operasional)
  let opex = {
    officeSalaries: 0, // Gaji Staff
    utilities: 0, // Listrik, Internet
    supplies: 0, // ATK, Komputer
    marketing: 0, // Iklan/Promosi (if any)
    other: 0, // Lainnya
    total: 0,
  };

  expenses.forEach((exp) => {
    const type = EXPENSE_CATEGORIES_MAP[exp.category] || "OPEX"; // Default to OPEX if unknown
    const amount = exp.amount || 0;

    if (type === "COGS") {
      cogs.total += amount;
      if (exp.category === "BBM") cogs.fuel += amount;
      else if (exp.category === "GAJI_SOPIR") cogs.driverSalary += amount;
      else if (exp.category === "PERAWATAN_ARMADA") cogs.maintenance += amount;
      else if (exp.category === "KONSUMSI") cogs.consumption += amount;
      else cogs.other += amount;
    } else {
      opex.total += amount;
      if (
        [
          "GAJI_STAF_OPERASIONAL",
          "GAJI_STAF_ADMIN",
          "INSENTIF_BONUS",
        ].includes(exp.category)
      ) {
        opex.officeSalaries += amount;
      } else if (["LISTRIK", "INTERNET", "PAKET_DATA"].includes(exp.category)) {
        opex.utilities += amount;
      } else if (
        ["ALAT_TULIS_KANTOR", "KOMPUTER_SUPPLIES"].includes(exp.category)
      ) {
        opex.supplies += amount;
      } else {
        opex.other += amount;
      }
    }
  });

  // 4. Calculate Profits
  const grossProfit = revenue.total - cogs.total;
  const netProfit = grossProfit - opex.total;

  // 5. Calculate Margins
  const grossMargin =
    revenue.total > 0 ? (grossProfit / revenue.total) * 100 : 0;
  const netMargin = revenue.total > 0 ? (netProfit / revenue.total) * 100 : 0;

  return {
    revenue,
    cogs,
    grossProfit,
    opex,
    netProfit,
    margins: {
      gross: grossMargin.toFixed(2),
      net: netMargin.toFixed(2),
    },
  };
}
