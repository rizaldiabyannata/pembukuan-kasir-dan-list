import * as XLSX from "xlsx";

/**
 * Enhanced Excel Export Utility
 * ============================
 *
 * Provides professional Excel exports with multiple sheets, styling, and comprehensive data presentation
 * for financial reports including income, expenses, rekap, and performance reports.
 *
 * Key Features:
 * - Data validation before export to catch missing fields early
 * - Standardized data mapping patterns using correct Prisma field accessors
 * - Defensive null checking with optional chaining
 * - Consistent currency and date formatting (Indonesian locale)
 * - Professional Excel styling with headers, borders, and colors
 * - Multiple sheet support for comprehensive reports
 *
 * Data Mapping Patterns:
 * - Always use nested object accessors (e.g., tx.armada.license_plate, not tx.armada_license_plate)
 * - Use optional chaining (?.) for nullable relations
 * - Provide default values ("-" for text, 0 for numbers) when data is missing
 * - Format dates using Indonesian locale (DD/MM/YYYY)
 * - Format currency as numbers (not strings) for Excel calculations
 *
 * @module excel-export
 * @requires xlsx
 * @see {@link https://docs.sheetjs.com/} SheetJS Documentation
 */

// Style definitions for professional appearance
const STYLES = {
  header: {
    font: { bold: true, sz: 14 },
    fill: { fgColor: { rgb: "FFE6E6FA" } },
    alignment: { horizontal: "center", vertical: "center" },
    border: {
      top: { style: "thin", color: { rgb: "FF000000" } },
      bottom: { style: "thin", color: { rgb: "FF000000" } },
      left: { style: "thin", color: { rgb: "FF000000" } },
      right: { style: "thin", color: { rgb: "FF000000" } },
    },
  },
  subHeader: {
    font: { bold: true, sz: 12 },
    fill: { fgColor: { rgb: "FFF0F8FF" } },
    alignment: { horizontal: "left", vertical: "center" },
    border: {
      top: { style: "thin", color: { rgb: "FF000000" } },
      bottom: { style: "thin", color: { rgb: "FF000000" } },
      left: { style: "thin", color: { rgb: "FF000000" } },
      right: { style: "thin", color: { rgb: "FF000000" } },
    },
  },
  data: {
    font: { sz: 10 },
    alignment: { horizontal: "left", vertical: "center" },
    border: {
      top: { style: "thin", color: { rgb: "FFCCCCCC" } },
      bottom: { style: "thin", color: { rgb: "FFCCCCCC" } },
      left: { style: "thin", color: { rgb: "FFCCCCCC" } },
      right: { style: "thin", color: { rgb: "FFCCCCCC" } },
    },
  },
  currency: {
    font: { sz: 10 },
    alignment: { horizontal: "right", vertical: "center" },
    border: {
      top: { style: "thin", color: { rgb: "FFCCCCCC" } },
      bottom: { style: "thin", color: { rgb: "FFCCCCCC" } },
      left: { style: "thin", color: { rgb: "FFCCCCCC" } },
      right: { style: "thin", color: { rgb: "FFCCCCCC" } },
    },
    numFmt: '"Rp" #,##0',
  },
  number: {
    font: { sz: 10 },
    alignment: { horizontal: "right", vertical: "center" },
    border: {
      top: { style: "thin", color: { rgb: "FFCCCCCC" } },
      bottom: { style: "thin", color: { rgb: "FFCCCCCC" } },
      left: { style: "thin", color: { rgb: "FFCCCCCC" } },
      right: { style: "thin", color: { rgb: "FFCCCCCC" } },
    },
  },
  total: {
    font: { bold: true, sz: 11 },
    fill: { fgColor: { rgb: "FFFFE4B5" } },
    alignment: { horizontal: "right", vertical: "center" },
    border: {
      top: { style: "thick", color: { rgb: "FF000000" } },
      bottom: { style: "thick", color: { rgb: "FF000000" } },
      left: { style: "thin", color: { rgb: "FFCCCCCC" } },
      right: { style: "thin", color: { rgb: "FFCCCCCC" } },
    },
    numFmt: '"Rp" #,##0',
  },
  positive: {
    font: { sz: 10, color: { rgb: "FF008000" } },
    alignment: { horizontal: "right", vertical: "center" },
    border: {
      top: { style: "thin", color: { rgb: "FFCCCCCC" } },
      bottom: { style: "thin", color: { rgb: "FFCCCCCC" } },
      left: { style: "thin", color: { rgb: "FFCCCCCC" } },
      right: { style: "thin", color: { rgb: "FFCCCCCC" } },
    },
    numFmt: '"Rp" #,##0',
  },
  negative: {
    font: { sz: 10, color: { rgb: "FFFF0000" } },
    alignment: { horizontal: "right", vertical: "center" },
    border: {
      top: { style: "thin", color: { rgb: "FFCCCCCC" } },
      bottom: { style: "thin", color: { rgb: "FFCCCCCC" } },
      left: { style: "thin", color: { rgb: "FFCCCCCC" } },
      right: { style: "thin", color: { rgb: "FFCCCCCC" } },
    },
    numFmt: '"Rp" #,##0',
  },
};

/**
 * Validate transaction data structure for export
 * @param {Object} transaction - Transaction object from Prisma
 * @returns {Object} Validation result with warnings
 */
export function validateTransactionForExport(transaction) {
  const warnings = [];

  // Check required fields
  if (!transaction.invoice_code) warnings.push("Missing invoice_code");
  if (!transaction.customer_name) warnings.push("Missing customer_name");
  if (!transaction.booking_date) warnings.push("Missing booking_date");

  // Check nested objects
  if (transaction.armada) {
    if (!transaction.armada.license_plate) {
      warnings.push("Armada exists but missing license_plate");
    }
    if (!transaction.armada.brand) {
      warnings.push("Armada exists but missing brand");
    }
    if (!transaction.armada.model) {
      warnings.push("Armada exists but missing model");
    }
  }

  if (transaction.driver && !transaction.driver.driver_name) {
    warnings.push("Driver exists but missing driver_name");
  }

  if (transaction.package && !transaction.package.name) {
    warnings.push("Package exists but missing name");
  }

  return {
    isValid: warnings.length === 0,
    warnings,
    transaction,
  };
}

/**
 * Validate expense data structure for export
 * @param {Object} expense - Expense object from Prisma
 * @returns {Object} Validation result with warnings
 */
export function validateExpenseForExport(expense) {
  const warnings = [];

  // Check required fields
  if (!expense.date) warnings.push("Missing date");
  if (!expense.category) warnings.push("Missing category");
  if (!expense.description) warnings.push("Missing description");
  if (expense.amount === undefined || expense.amount === null) {
    warnings.push("Missing amount");
  }

  // Check nested objects
  if (expense.armada && !expense.armada.license_plate) {
    warnings.push("Armada exists but missing license_plate");
  }

  if (expense.driver && !expense.driver.driver_name) {
    warnings.push("Driver exists but missing driver_name");
  }

  if (expense.staff && !expense.staff.staff_name) {
    warnings.push("Staff exists but missing staff_name");
  }

  return {
    isValid: warnings.length === 0,
    warnings,
    expense,
  };
}

/**
 * Safely format date to Indonesian locale
 * @param {Date|string|null|undefined} dateValue - Date value to format
 * @returns {string} Formatted date or "-"
 */
export function formatDateSafely(dateValue) {
  if (!dateValue) return "-";

  const date = new Date(dateValue);
  if (isNaN(date.getTime())) {
    console.warn("Invalid date:", dateValue);
    return "-";
  }

  return date.toLocaleDateString("id-ID");
}

/**
 * Map transaction data to export format
 * @param {Object} tx - Transaction from Prisma
 * @param {Object} financials - Calculated financials from accounting.js
 * @returns {Array} Row data for Excel
 */
export function mapTransactionToExportRow(tx, financials) {
  return [
    tx.invoice_code || "-",
    formatDateSafely(tx.booking_date),
    tx.customer_name || "-",
    tx.package?.name || "Custom",
    tx.armada
      ? `${tx.armada.brand} ${tx.armada.model} (${tx.armada.license_plate})`
      : "-",
    tx.driver?.driver_name || "-",
    formatCurrencyForExcel(financials.tarifSewa || 0),
    formatCurrencyForExcel(financials.biayaOvertime || 0),
    formatCurrencyForExcel(financials.totalPendapatan || 0),
    formatCurrencyForExcel(financials.totalBiayaOps || 0),
    formatCurrencyForExcel(financials.labaKotor || 0),
    tx.payment_status || "-",
    tx.approval_status || "-",
  ];
}

/**
 * Map expense data to export format
 * @param {Object} expense - Expense from Prisma
 * @returns {Array} Row data for Excel
 */
export function mapExpenseToExportRow(expense) {
  return [
    formatDateSafely(expense.date),
    expense.category || "-",
    expense.description || "-",
    formatCurrencyForExcel(expense.amount || 0),
    expense.namaPenerima || "-",
    expense.armada?.license_plate || "-",
    expense.driver?.driver_name || "-",
    expense.staff?.staff_name || "-",
    expense.attachments?.length > 0
      ? `${expense.attachments.length} file(s)`
      : "Tidak ada",
  ];
}

/**
 * Create a new Excel workbook with professional styling
 */
export function createWorkbook() {
  const wb = XLSX.utils.book_new();

  // Set workbook properties
  wb.Props = {
    Title: "Laporan Bisnis",
    Subject: "Laporan Keuangan",
    Author: "Sistem Pembukuan Kasir",
    CreatedDate: new Date(),
  };

  return wb;
}

/**
 * Add a sheet to workbook with data and styling
 */
export function addSheet(wb, sheetName, data, options = {}) {
  const {
    startRow = 0,
    startCol = 0,
    styleMap = {},
    columnWidths = [],
    mergeCells = [],
  } = options;

  // Convert data to worksheet
  const ws = XLSX.utils.aoa_to_sheet(data, {
    origin: { r: startRow, c: startCol },
  });

  // Apply styles
  if (ws["!ref"]) {
    const range = XLSX.utils.decode_range(ws["!ref"]);
    for (let r = range.s.r; r <= range.e.r; r++) {
      for (let c = range.s.c; c <= range.e.c; c++) {
        const cellRef = XLSX.utils.encode_cell({ r, c });
        if (ws[cellRef]) {
          const styleKey = styleMap[`${r},${c}`] || styleMap[r] || "data";
          if (STYLES[styleKey]) {
            ws[cellRef].s = STYLES[styleKey];
          }
        }
      }
    }
  }

  // Set column widths
  if (columnWidths.length > 0) {
    ws["!cols"] = columnWidths.map((width) => ({ wch: width }));
  }

  // Merge cells
  if (mergeCells.length > 0) {
    ws["!merges"] = mergeCells;
  }

  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  return wb;
}

/**
 * Generate report header with company info and date range
 */
export function generateReportHeader(title, dateRange, companyInfo = {}) {
  const { companyName = "PT. Pembukuan Kasir", generatedBy = "Sistem" } =
    companyInfo;

  const header = [
    [companyName],
    [`Laporan: ${title}`],
    [`Periode: ${dateRange.from} s/d ${dateRange.to}`],
    [`Dibuat pada: ${new Date().toLocaleString("id-ID")}`],
    [`Oleh: ${generatedBy}`],
    [], // Empty row
  ];

  return header;
}

/**
 * Format currency for Excel (without currency symbol for numFmt)
 */
export function formatCurrencyForExcel(amount) {
  return parseFloat(amount) || 0;
}

/**
 * Format percentage for Excel display
 * @param {number} value - The decimal value (e.g., 0.45 for 45%)
 * @param {number} decimals - Number of decimal places (default: 1)
 * @returns {string} Formatted percentage string (e.g., "45.5%")
 */
export function formatPercentage(value, decimals = 1) {
  if (value === null || value === undefined || isNaN(value)) {
    return "0%";
  }
  return `${value.toFixed(decimals)}%`;
}

/**
 * Calculate percentage from two numbers
 * @param {number} part - The part value
 * @param {number} total - The total value
 * @param {number} decimals - Number of decimal places (default: 1)
 * @returns {string} Formatted percentage string or "0%" if total is 0
 */
export function calculatePercentage(part, total, decimals = 1) {
  if (!total || total === 0) {
    return "0%";
  }
  const percentage = (part / total) * 100;
  return formatPercentage(percentage, decimals);
}

/**
 * Create summary sheet with key metrics
 */
export function createSummarySheet(metrics, title = "Ringkasan") {
  const data = [
    [title],
    [],
    ["Metrik", "Nilai"],
    ...metrics.map(([label, value]) => [label, value]),
  ];

  const styleMap = {
    "0,0": "header",
    "2,0": "subHeader",
    "2,1": "subHeader",
  };

  // Apply currency styling to value column
  metrics.forEach((_, index) => {
    const rowIndex = index + 3;
    styleMap[`${rowIndex},1`] =
      typeof metrics[index][1] === "number" ? "currency" : "data";
  });

  return { data, styleMap };
}

/**
 * Export workbook to file
 */
export function exportWorkbook(wb, fileName) {
  try {
    const finalFileName = `${fileName}_${new Date().toISOString().split("T")[0]}.xlsx`;
    XLSX.writeFile(wb, finalFileName);
    return finalFileName;
  } catch (error) {
    console.error("Failed to export Excel:", error);
    throw new Error("Gagal mengunduh laporan Excel.");
  }
}

/**
 * Specialized export functions for different report types
 */

/**
 * Export transaction summary report with detailed breakdown
 */
export async function exportTransactionReport(data, dateRange) {
  const wb = createWorkbook();

  // Summary sheet
  const summaryMetrics = [
    ["Total Transaksi", data.totalTransaksi || 0],
    ["Total Pemasukan Sewa", formatCurrencyForExcel(data.totalPemasukan || 0)],
    [
      "Total Pengeluaran (BBM + Gaji)",
      formatCurrencyForExcel(data.totalPengeluaranOps || 0),
    ],
    ["Total Laba Kotor", formatCurrencyForExcel(data.totalLabaKotor || 0)],
    [
      "Margin Laba Kotor",
      data.totalPemasukan
        ? `${((data.totalLabaKotor / data.totalPemasukan) * 100).toFixed(1)}%`
        : "0%",
    ],
  ];

  const summarySheet = createSummarySheet(
    summaryMetrics,
    "Ringkasan Transaksi"
  );
  addSheet(wb, "Ringkasan", summarySheet.data, {
    styleMap: summarySheet.styleMap,
    columnWidths: [30, 20],
  });

  // Detailed Transaction Breakdown sheet
  if (data.transactions && data.transactions.length > 0) {
    const transactionHeaders = [
      "Invoice",
      "Tanggal Booking",
      "Pelanggan",
      "Paket",
      "Armada",
      "Sopir",
      "Tarif Sewa",
      "Biaya Overtime",
      "Total Pendapatan",
      "Biaya Operasional",
      "Laba Kotor",
      "Status Pembayaran",
      "Status Approval",
    ];

    const transactionData = [
      ["Detail Transaksi"],
      [],
      transactionHeaders,
      ...(await Promise.all(
        data.transactions.map(async (tx) => {
          const { calculateTransactionFinancials } = await import(
            "./accounting.js"
          );
          const financials = calculateTransactionFinancials(tx);
          const baseRevenue =
            financials.totalPendapatan - financials.totalOvertimeFee;

          return [
            tx.invoice_code || "-",
            tx.booking_date
              ? new Date(tx.booking_date).toLocaleDateString("id-ID")
              : "-",
            tx.customer_name || "-",
            tx.package?.package_name || "Custom",
            tx.armada?.license_plate || "-",
            tx.driver?.driver_name || "-",
            formatCurrencyForExcel(baseRevenue),
            formatCurrencyForExcel(financials.totalOvertimeFee),
            formatCurrencyForExcel(financials.totalPendapatan),
            formatCurrencyForExcel(financials.totalBiayaOps),
            formatCurrencyForExcel(financials.labaKotor),
            tx.payment_status || "-",
            tx.approval_status || "-",
          ];
        })
      )),
    ];

    const transactionStyleMap = {
      "0,0": "header",
      "2,0": "subHeader",
      "2,1": "subHeader",
      "2,2": "subHeader",
      "2,3": "subHeader",
      "2,4": "subHeader",
      "2,5": "subHeader",
      "2,6": "subHeader",
      "2,7": "subHeader",
      "2,8": "subHeader",
      "2,9": "subHeader",
      "2,10": "subHeader",
      "2,11": "subHeader",
      "2,12": "subHeader",
    };

    // Apply styling to transaction data rows
    await Promise.all(
      data.transactions.map(async (tx, index) => {
        const { calculateTransactionFinancials } = await import(
          "./accounting.js"
        );
        const financials = calculateTransactionFinancials(tx);
        const rowIndex = index + 3;
        transactionStyleMap[`${rowIndex},6`] = "currency";
        transactionStyleMap[`${rowIndex},7`] = "currency";
        transactionStyleMap[`${rowIndex},8`] = "currency";
        transactionStyleMap[`${rowIndex},9`] = "currency";
        transactionStyleMap[`${rowIndex},10`] =
          financials.labaKotor >= 0 ? "positive" : "negative";
      })
    );

    addSheet(wb, "Detail Transaksi", transactionData, {
      styleMap: transactionStyleMap,
      columnWidths: [15, 12, 20, 25, 12, 20, 15, 15, 15, 15, 15, 15, 15],
    });
  }

  // Profit/Loss Analysis sheet
  const profitLossData = [
    ["Analisis Laba Rugi"],
    [],
    ["Kategori", "Jumlah", "Persentase"],
    [
      "Pemasukan Sewa",
      formatCurrencyForExcel(data.totalPemasukan || 0),
      "100%",
    ],
    [
      "Pengeluaran Operasional",
      formatCurrencyForExcel(data.totalPengeluaranOps || 0),
      data.totalPemasukan
        ? `${((data.totalPengeluaranOps / data.totalPemasukan) * 100).toFixed(1)}%`
        : "0%",
    ],
    [
      "Laba Kotor",
      formatCurrencyForExcel(data.totalLabaKotor || 0),
      data.totalPemasukan
        ? `${((data.totalLabaKotor / data.totalPemasukan) * 100).toFixed(1)}%`
        : "0%",
    ],
  ];

  const profitLossStyleMap = {
    "0,0": "header",
    "2,0": "subHeader",
    "2,1": "subHeader",
    "2,2": "subHeader",
    "3,1": "currency",
    "4,1": "currency",
    "5,1": data.totalLabaKotor >= 0 ? "positive" : "negative",
  };

  addSheet(wb, "Analisis Laba Rugi", profitLossData, {
    styleMap: profitLossStyleMap,
    columnWidths: [25, 20, 15],
  });

  // Audit Trail sheet
  if (data.transactions && data.transactions.length > 0) {
    const auditHeaders = [
      "Transaction ID",
      "Invoice",
      "Dibuat Tanggal",
      "Dibuat Oleh",
      "Dimodifikasi Tanggal",
      "Status Approval",
      "Disetujui Oleh",
      "Disetujui Tanggal",
    ];

    const auditData = [
      ["Audit Trail"],
      [],
      auditHeaders,
      ...data.transactions.map((tx) => [
        tx.id || "-",
        tx.invoice_code || "-",
        tx.created_at ? new Date(tx.created_at).toLocaleString("id-ID") : "-",
        tx.submitted_by?.name || "-",
        tx.updated_at ? new Date(tx.updated_at).toLocaleString("id-ID") : "-",
        tx.approval_status || "-",
        tx.approved_by?.name || tx.rejected_by?.name || "-",
        tx.approved_at || tx.rejected_at
          ? new Date(tx.approved_at || tx.rejected_at).toLocaleString("id-ID")
          : "-",
      ]),
    ];

    const auditStyleMap = {
      "0,0": "header",
      "2,0": "subHeader",
      "2,1": "subHeader",
      "2,2": "subHeader",
      "2,3": "subHeader",
      "2,4": "subHeader",
      "2,5": "subHeader",
      "2,6": "subHeader",
      "2,7": "subHeader",
    };

    addSheet(wb, "Audit Trail", auditData, {
      styleMap: auditStyleMap,
      columnWidths: [15, 15, 18, 20, 18, 15, 20, 18],
    });
  }

  // Cash Flow Analysis sheet
  if (data.transactions && data.transactions.length > 0) {
    const { calculateTransactionFinancials } = await import("./accounting.js");

    // Calculate cash flow metrics
    let totalCashInflow = 0;
    let totalCashOutflow = 0;
    let paidTransactions = 0;
    let unpaidTransactions = 0;
    let downPaymentTransactions = 0;

    const cashFlowDetails = await Promise.all(
      data.transactions.map(async (tx) => {
        const financials = calculateTransactionFinancials(tx);
        const isPaid =
          tx.payment_status === "PAID" || tx.payment_status === "DOWN_PAYMENT";

        if (isPaid) {
          totalCashInflow += financials.totalPendapatan;
          if (tx.payment_status === "PAID") paidTransactions++;
          else downPaymentTransactions++;
        } else {
          unpaidTransactions++;
        }

        totalCashOutflow += financials.totalBiayaOps;

        return [
          tx.invoice_code || "-",
          new Date(tx.booking_date).toLocaleDateString("id-ID"),
          tx.payment_status || "-",
          formatCurrencyForExcel(financials.totalPendapatan),
          formatCurrencyForExcel(financials.totalBiayaOps),
          formatCurrencyForExcel(
            financials.totalPendapatan - financials.totalBiayaOps
          ),
        ];
      })
    );

    const cashFlowData = [
      ["Analisis Arus Kas"],
      [],
      ["RINGKASAN"],
      [
        "Total Pemasukan (Cash Inflow)",
        formatCurrencyForExcel(totalCashInflow),
      ],
      [
        "Total Pengeluaran (Cash Outflow)",
        formatCurrencyForExcel(totalCashOutflow),
      ],
      [
        "Net Cash Flow",
        formatCurrencyForExcel(totalCashInflow - totalCashOutflow),
      ],
      [],
      ["STATUS PEMBAYARAN"],
      ["Transaksi Lunas", paidTransactions],
      ["Transaksi Belum Dibayar (Piutang)", unpaidTransactions],
      ["Piutang DP", downPaymentTransactions],
      [],
      ["DETAIL ARUS KAS"],
      [
        "Invoice",
        "Tanggal",
        "Status Bayar",
        "Pemasukan",
        "Pengeluaran",
        "Net Cash Flow",
      ],
      ...cashFlowDetails,
    ];

    const cashFlowStyleMap = {
      "0,0": "header",
      "2,0": "subHeader",
      "7,0": "subHeader",
      "12,0": "subHeader",
      "13,0": "subHeader",
      "13,1": "subHeader",
      "13,2": "subHeader",
      "13,3": "subHeader",
      "13,4": "subHeader",
      "13,5": "subHeader",
      "3,1": "currency",
      "4,1": "currency",
      "5,1": totalCashInflow - totalCashOutflow >= 0 ? "positive" : "negative",
    };

    // Apply styling to detail rows
    cashFlowDetails.forEach((_, index) => {
      const rowIdx = index + 14;
      cashFlowStyleMap[`${rowIdx},3`] = "currency";
      cashFlowStyleMap[`${rowIdx},4`] = "currency";
      const netCashFlow = totalCashInflow - totalCashOutflow;
      cashFlowStyleMap[`${rowIdx},5`] =
        netCashFlow >= 0 ? "positive" : "negative";
    });

    addSheet(wb, "Arus Kas", cashFlowData, {
      styleMap: cashFlowStyleMap,
      columnWidths: [15, 12, 15, 15, 18, 18],
    });
  }

  return exportWorkbook(wb, "Laporan_Transaksi");
}

/**
 * Export income report with package breakdown
 *
 * Generates a comprehensive Excel report showing income by service package type,
 * including transaction details, financial calculations, and summary metrics.
 *
 * @async
 * @param {Object} data - Income report data from API
 * @param {Array} data.incomeByPackage - Array of income grouped by package
 * @param {Array} data.transactions - Array of transaction objects with relations
 * @param {Object} dateRange - Date range for the report
 * @param {string} dateRange.from - Start date (YYYY-MM-DD)
 * @param {string} dateRange.to - End date (YYYY-MM-DD)
 * @param {Object} [filters={}] - Optional filters applied to the data
 * @param {string} [filters.packageType] - Filter by package type
 *
 * @returns {Promise<void>} Downloads the Excel file to the user's browser
 *
 * @throws {Error} If no income data is available for export
 *
 * @example
 * await exportIncomeReport(
 *   { incomeByPackage: [...], transactions: [...] },
 *   { from: '2025-11-01', to: '2025-11-30' },
 *   { packageType: 'CAR_RENTAL' }
 * );
 *
 * @description
 * The exported Excel file contains multiple sheets:
 * - Summary: Key metrics and totals
 * - Per Package: Income breakdown by service package
 * - All Transactions: Detailed transaction list with financial calculations
 *
 * Data Mapping:
 * - Uses calculateTransactionFinancials() for consistent financial calculations
 * - Accesses nested Prisma relations correctly (tx.armada.license_plate)
 * - Handles null/undefined values with optional chaining and defaults
 */
export async function exportIncomeReport(data, dateRange, filters = {}) {
  // Validate data before export - warn but continue
  if (!data || !data.incomeByPackage || data.incomeByPackage.length === 0) {
    console.warn("Export warning: No income data available");
    // Continue with empty export instead of throwing
  }

  const wb = createWorkbook();

  // Summary sheet
  const summaryMetrics = [
    ["Total Paket", data.summary?.totalPackages || 0],
    ["Total Transaksi", data.summary?.totalTransactions || 0],
    [
      "Total Pemasukan",
      formatCurrencyForExcel(data.summary?.totalRevenue || 0),
    ],
    [
      "Rata-rata per Paket",
      formatCurrencyForExcel(data.summary?.averageRevenuePerPackage || 0),
    ],
  ];

  const summarySheet = createSummarySheet(
    summaryMetrics,
    "Ringkasan Pemasukan"
  );
  addSheet(wb, "Ringkasan", summarySheet.data, {
    styleMap: summarySheet.styleMap,
    columnWidths: [30, 20],
  });

  // Package Performance sheet
  const packageHeaders = [
    "Nama Paket",
    "Jenis",
    "Transaksi",
    "Total Pemasukan",
    "Rata-rata",
    "% dari Total",
  ];
  const packageData = [
    ["Analisis Performa Paket"],
    [],
    packageHeaders,
    ...(data.incomeByPackage || []).map((pkg) => [
      pkg.packageName,
      pkg.packageType,
      pkg.transactionCount,
      formatCurrencyForExcel(pkg.totalRevenue),
      formatCurrencyForExcel(pkg.averageRevenue),
      data.summary?.totalRevenue
        ? `${((pkg.totalRevenue / data.summary.totalRevenue) * 100).toFixed(1)}%`
        : "0%",
    ]),
  ];

  const packageStyleMap = {
    "0,0": "header",
    "2,0": "subHeader",
    "2,1": "subHeader",
    "2,2": "subHeader",
    "2,3": "subHeader",
    "2,4": "subHeader",
    "2,5": "subHeader",
  };

  // Apply styling to data rows
  data.incomeByPackage.forEach((_, index) => {
    const rowIndex = index + 3;
    packageStyleMap[`${rowIndex},0`] = "data";
    packageStyleMap[`${rowIndex},1`] = "data";
    packageStyleMap[`${rowIndex},2`] = "number";
    packageStyleMap[`${rowIndex},3`] = "currency";
    packageStyleMap[`${rowIndex},4`] = "currency";
    packageStyleMap[`${rowIndex},5`] = "data";
  });

  addSheet(wb, "Performa Paket", packageData, {
    styleMap: packageStyleMap,
    columnWidths: [25, 20, 12, 18, 15, 12],
  });

  // Transaction Details sheet with corrected field accessors
  const transactionHeaders = [
    "Invoice",
    "Pelanggan",
    "Tanggal",
    "Paket",
    "Armada",
    "Sopir",
    "Tarif Dasar",
    "Overtime",
    "Total",
  ];
  const transactionData = [["Detail Transaksi"], [], transactionHeaders];

  // Import accounting module for financial calculations
  const { calculateTransactionFinancials } = await import("./accounting.js");

  // Validate and log warnings for transaction data
  let validationWarnings = 0;
  data.incomeByPackage.forEach((pkg) => {
    pkg.transactions.forEach((tx) => {
      // Validate transaction data
      const validation = validateTransactionForExport(tx);
      if (!validation.isValid) {
        console.warn(
          `Transaction ${tx.invoice_code || tx.id} validation warnings:`,
          validation.warnings
        );
        validationWarnings++;
      }

      // Use correct field accessors for nested objects
      const armadaInfo = tx.armada
        ? `${tx.armada.brand} ${tx.armada.model} (${tx.armada.license_plate})`
        : "-";
      const driverName = tx.driver?.driver_name || "-";
      const packageName = tx.package?.name || pkg.packageName;

      transactionData.push([
        tx.invoice_code || "-",
        tx.customer_name || "-",
        formatDateSafely(tx.booking_date),
        packageName,
        armadaInfo,
        driverName,
        formatCurrencyForExcel(tx.baseRevenue || 0),
        formatCurrencyForExcel(tx.overtimeRevenue || 0),
        formatCurrencyForExcel(tx.totalRevenue || 0),
      ]);
    });
  });

  if (validationWarnings > 0) {
    console.warn(
      `Income export: ${validationWarnings} transaction(s) have validation warnings. Export will continue.`
    );
  }

  const transactionStyleMap = {
    "0,0": "header",
    "2,0": "subHeader",
    "2,1": "subHeader",
    "2,2": "subHeader",
    "2,3": "subHeader",
    "2,4": "subHeader",
    "2,5": "subHeader",
    "2,6": "subHeader",
    "2,7": "subHeader",
    "2,8": "subHeader",
  };

  // Apply styling to transaction data rows
  let rowIndex = 3;
  data.incomeByPackage.forEach((pkg) => {
    pkg.transactions.forEach(() => {
      transactionStyleMap[`${rowIndex},6`] = "currency";
      transactionStyleMap[`${rowIndex},7`] = "currency";
      transactionStyleMap[`${rowIndex},8`] = "currency";
      rowIndex++;
    });
  });

  addSheet(wb, "Detail Transaksi", transactionData, {
    styleMap: transactionStyleMap,
    columnWidths: [15, 20, 12, 25, 25, 20, 15, 12, 15],
  });

  const filterSuffix = filters.packageType ? `_${filters.packageType}` : "";
  return exportWorkbook(wb, `Laporan_Pemasukan${filterSuffix}`);
}

/**
 * Export expense report with category breakdown
 *
 * Generates a comprehensive Excel report showing expenses by category,
 * including detailed expense records with relational data (staff, armada, driver).
 *
 * @param {Object} data - Expense report data from API
 * @param {Array} data.data - Array of expense objects with relations
 * @param {Object} data.summary - Summary metrics (total, count, categories)
 * @param {Object} dateRange - Date range for the report
 * @param {string} dateRange.from - Start date (YYYY-MM-DD)
 * @param {string} dateRange.to - End date (YYYY-MM-DD)
 *
 * @returns {void} Downloads the Excel file to the user's browser
 *
 * @throws {Error} If no expense data is available for export
 *
 * @example
 * exportExpenseReport(
 *   { data: [...], summary: { total: 1000000, count: 10 } },
 *   { from: '2025-11-01', to: '2025-11-30' }
 * );
 *
 * @description
 * The exported Excel file contains multiple sheets:
 * - Summary: Key metrics and category breakdown
 * - All Expenses: Detailed expense list with all fields
 *
 * Data Mapping:
 * - Correctly accesses nested relations (expense.staff.staff_name)
 * - Handles optional relations with optional chaining
 * - Shows attachment count if files are present
 * - Formats dates in Indonesian locale
 */
export function exportExpenseReport(data, dateRange) {
  // Validate data before export
  if (!data || !data.data || data.data.length === 0) {
    console.warn("Export warning: No expense data available");
    throw new Error("Tidak ada data pengeluaran untuk diekspor");
  }

  const wb = createWorkbook();

  // Summary sheet
  const summaryMetrics = [
    [
      "Total Pengeluaran",
      formatCurrencyForExcel(data.summary?.totalAmount || 0),
    ],
    ["Jumlah Transaksi", data.summary?.totalExpenses || 0],
    ["Jumlah Kategori", data.summary?.categoriesCount || 0],
    [
      "Rata-rata per Transaksi",
      formatCurrencyForExcel(
        data.summary
          ? Math.round(data.summary.totalAmount / data.summary.totalExpenses)
          : 0
      ),
    ],
  ];

  const summarySheet = createSummarySheet(
    summaryMetrics,
    "Ringkasan Pengeluaran"
  );
  addSheet(wb, "Ringkasan", summarySheet.data, {
    styleMap: summarySheet.styleMap,
    columnWidths: [30, 20],
  });

  // Category Breakdown sheet
  const categoryHeaders = [
    "Kategori",
    "Total Amount",
    "Jumlah Transaksi",
    "Persentase",
  ];
  const categoryData = [
    ["Breakdown per Kategori"],
    [],
    categoryHeaders,
    ...data.data.map((cat) => [
      cat.category,
      formatCurrencyForExcel(cat.totalAmount),
      cat.count,
      data.summary?.totalAmount
        ? `${((cat.totalAmount / data.summary.totalAmount) * 100).toFixed(1)}%`
        : "0%",
    ]),
  ];

  const categoryStyleMap = {
    "0,0": "header",
    "2,0": "subHeader",
    "2,1": "subHeader",
    "2,2": "subHeader",
    "2,3": "subHeader",
  };

  // Apply styling to category data rows
  data.data.forEach((_, index) => {
    const rowIndex = index + 3;
    categoryStyleMap[`${rowIndex},0`] = "data";
    categoryStyleMap[`${rowIndex},1`] = "currency";
    categoryStyleMap[`${rowIndex},2`] = "number";
    categoryStyleMap[`${rowIndex},3`] = "data";
  });

  addSheet(wb, "Kategori", categoryData, {
    styleMap: categoryStyleMap,
    columnWidths: [25, 18, 15, 12],
  });

  // Transaction Details sheet
  const transactionHeaders = [
    "Tanggal",
    "Kategori",
    "Deskripsi",
    "Jumlah",
    "Penerima",
    "Armada",
    "Sopir",
    "Staff",
    "Dokumen Pendukung",
  ];
  const transactionData = [["Detail Transaksi"], [], transactionHeaders];

  // Get all expenses (prefer rawExpenses if available)
  const allExpenses =
    data.rawExpenses || data.data.flatMap((cat) => cat.expenses);

  // Validate and log warnings for expense data
  let validationWarnings = 0;
  allExpenses
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .forEach((expense) => {
      // Validate expense data
      const validation = validateExpenseForExport(expense);
      if (!validation.isValid) {
        console.warn(
          `Expense ${expense.id} validation warnings:`,
          validation.warnings
        );
        validationWarnings++;
      }

      // Use mapExpenseToExportRow for consistency
      transactionData.push(mapExpenseToExportRow(expense));
    });

  if (validationWarnings > 0) {
    console.warn(
      `Expense export: ${validationWarnings} expense(s) have validation warnings. Export will continue.`
    );
  }

  const transactionStyleMap = {
    "0,0": "header",
    "2,0": "subHeader",
    "2,1": "subHeader",
    "2,2": "subHeader",
    "2,3": "subHeader",
    "2,4": "subHeader",
    "2,5": "subHeader",
    "2,6": "subHeader",
    "2,7": "subHeader",
    "2,8": "subHeader",
  };

  // Apply styling to transaction data rows
  let rowIndex = 3;
  allExpenses.forEach(() => {
    transactionStyleMap[`${rowIndex},3`] = "currency";
    rowIndex++;
  });

  addSheet(wb, "Detail Transaksi", transactionData, {
    styleMap: transactionStyleMap,
    columnWidths: [12, 20, 40, 15, 20, 15, 20, 20, 15],
  });

  // Audit Trail sheet for expenses
  if (allExpenses && allExpenses.length > 0) {
    const expenseAuditHeaders = [
      "Expense ID",
      "Tanggal",
      "Kategori",
      "Jumlah",
      "Dibuat Tanggal",
      "Status Approval",
      "Disetujui Oleh",
      "Disetujui Tanggal",
    ];

    const expenseAuditData = [
      ["Audit Trail Pengeluaran"],
      [],
      expenseAuditHeaders,
      ...allExpenses.map((expense) => [
        expense.id || "-",
        new Date(expense.date).toLocaleDateString("id-ID"),
        expense.category || "-",
        formatCurrencyForExcel(expense.amount),
        expense.created_at
          ? new Date(expense.created_at).toLocaleString("id-ID")
          : "-",
        expense.approval_status || "-",
        expense.approved_by?.name || "-",
        expense.approved_at
          ? new Date(expense.approved_at).toLocaleString("id-ID")
          : "-",
      ]),
    ];

    const expenseAuditStyleMap = {
      "0,0": "header",
      "2,0": "subHeader",
      "2,1": "subHeader",
      "2,2": "subHeader",
      "2,3": "subHeader",
      "2,4": "subHeader",
      "2,5": "subHeader",
      "2,6": "subHeader",
      "2,7": "subHeader",
    };

    // Apply currency styling
    allExpenses.forEach((_, index) => {
      const rowIdx = index + 3;
      expenseAuditStyleMap[`${rowIdx},3`] = "currency";
    });

    addSheet(wb, "Audit Trail", expenseAuditData, {
      styleMap: expenseAuditStyleMap,
      columnWidths: [15, 12, 20, 15, 18, 15, 20, 18],
    });
  }

  return exportWorkbook(wb, `Laporan_Pengeluaran`);
}

/**
 * Export rekap report with category-wise monthly breakdown
 *
 * Generates a comprehensive Excel report showing expense recapitulation by category
 * with monthly breakdown, trends, and growth percentages.
 *
 * @param {Object} data - Rekap report data from API
 * @param {Array} data.rekap - Array of expense categories with monthly data
 * @param {Object} data.summary - Summary metrics (total, count, categories)
 * @param {Object} dateRange - Date range for the report
 * @param {string} dateRange.from - Start date (YYYY-MM-DD)
 * @param {string} dateRange.to - End date (YYYY-MM-DD)
 *
 * @returns {void} Downloads the Excel file to the user's browser
 *
 * @throws {Error} If no rekap data is available for export
 *
 * @example
 * exportRekapReport(
 *   { rekap: [...], summary: { total: 5000000, categories: 6 } },
 *   { from: '2025-09-01', to: '2025-11-30' }
 * );
 *
 * @description
 * The exported Excel file contains multiple sheets:
 * - Summary: Overall metrics and category totals
 * - Per Category: Separate sheet for each expense category showing:
 *   - Monthly breakdown (transaction count, total, average)
 *   - Trend analysis (growth percentages month-over-month)
 *   - Visual indicators for increases/decreases
 *
 * Data Formatting:
 * - Months formatted in Indonesian (e.g., "Januari 2025")
 * - Currency formatted as Rupiah with thousand separators
 * - Percentages shown with 1 decimal place
 * - Trend arrows (↑/↓) for visual clarity
 */
export function exportRekapReport(data, dateRange) {
  // Validate data before export - warn but continue
  if (!data || !data.rekap || data.rekap.length === 0) {
    console.warn("Export warning: No rekap data available");
    // Continue with empty export instead of throwing
  }

  const wb = createWorkbook();

  // Summary sheet
  const summaryMetrics = [
    [
      "Total Pengeluaran",
      formatCurrencyForExcel(data.summary?.totalExpenses || 0),
    ],
    ["Jumlah Transaksi", data.summary?.totalTransactions || 0],
    ["Jumlah Kategori", data.summary?.categories || 0],
  ];

  const summarySheet = createSummarySheet(summaryMetrics, "Ringkasan Rekap");
  addSheet(wb, "Ringkasan", summarySheet.data, {
    styleMap: summarySheet.styleMap,
    columnWidths: [30, 20],
  });

  // Category-wise Monthly Breakdown sheet
  const monthlyHeaders = ["Kategori", "Total Pengeluaran", "Jumlah Transaksi"];
  const monthlyData = [["Rekap Bulanan per Kategori"], [], monthlyHeaders];

  // Add month headers dynamically
  const allMonths = new Set();
  (data.rekap || []).forEach((cat) => {
    (cat.months || []).forEach((month) => allMonths.add(month.month));
  });
  const sortedMonths = Array.from(allMonths).sort();

  // Add month columns to headers using Indonesian locale
  sortedMonths.forEach((month) => {
    // Parse month string (YYYY-MM format)
    const [year, monthNum] = month.split("-");
    const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1);

    // Format using Indonesian locale
    const monthName = date.toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
    });

    monthlyHeaders.push(monthName);
  });

  // Add data rows - ensure all category data is included
  (data.rekap || []).forEach((cat) => {
    const row = [
      cat.category,
      formatCurrencyForExcel(cat.totalAmount),
      cat.totalCount,
    ];

    // Add monthly data with proper calculations
    sortedMonths.forEach((month) => {
      const monthData = (cat.months || []).find((m) => m.month === month);
      row.push(monthData ? formatCurrencyForExcel(monthData.total) : 0);
    });

    monthlyData.push(row);
  });

  const monthlyStyleMap = {
    "0,0": "header",
    "2,0": "subHeader",
    "2,1": "subHeader",
    "2,2": "subHeader",
  };

  // Apply styling to month headers
  sortedMonths.forEach((_, index) => {
    monthlyStyleMap[`2,${index + 3}`] = "subHeader";
  });

  // Apply styling to data rows
  data.rekap.forEach((_, catIndex) => {
    const rowIndex = catIndex + 3;
    monthlyStyleMap[`${rowIndex},1`] = "currency";
    sortedMonths.forEach((_, monthIndex) => {
      monthlyStyleMap[`${rowIndex},${monthIndex + 3}`] = "currency";
    });
  });

  addSheet(wb, "Rekap Bulanan", monthlyData, {
    styleMap: monthlyStyleMap,
    columnWidths: [25, 18, 15, ...sortedMonths.map(() => 15)],
  });

  // Trend Analysis sheet with growth percentages
  const trendHeaders = [
    "Bulan",
    "Total Pengeluaran",
    "Jumlah Transaksi",
    "Rata-rata per Transaksi",
    "Pertumbuhan (%)",
  ];
  const trendData = [["Analisis Tren"], [], trendHeaders];

  let previousTotal = 0;
  sortedMonths.forEach((month, index) => {
    // Calculate monthly totals
    const monthTotal = data.rekap.reduce((sum, cat) => {
      const monthData = cat.months.find((m) => m.month === month);
      return sum + (monthData ? monthData.total : 0);
    }, 0);

    const monthCount = data.rekap.reduce((sum, cat) => {
      const monthData = cat.months.find((m) => m.month === month);
      return sum + (monthData ? monthData.count : 0);
    }, 0);

    const average = monthCount > 0 ? monthTotal / monthCount : 0;

    // Calculate growth percentage compared to previous month
    const growth =
      index > 0 && previousTotal > 0
        ? ((monthTotal - previousTotal) / previousTotal) * 100
        : 0;

    // Parse month string and format using Indonesian locale
    const [year, monthNum] = month.split("-");
    const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
    const monthName = date.toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
    });

    trendData.push([
      monthName,
      formatCurrencyForExcel(monthTotal),
      monthCount,
      formatCurrencyForExcel(Math.round(average)),
      growth !== 0 ? `${growth.toFixed(1)}%` : "-",
    ]);

    previousTotal = monthTotal;
  });

  const trendStyleMap = {
    "0,0": "header",
    "2,0": "subHeader",
    "2,1": "subHeader",
    "2,2": "subHeader",
    "2,3": "subHeader",
    "2,4": "subHeader",
  };

  // Apply styling to trend data
  sortedMonths.forEach((_, index) => {
    const rowIndex = index + 3;
    trendStyleMap[`${rowIndex},1`] = "currency";
    trendStyleMap[`${rowIndex},3`] = "currency";
  });

  addSheet(wb, "Analisis Tren", trendData, {
    styleMap: trendStyleMap,
    columnWidths: [15, 18, 15, 20, 15],
  });

  return exportWorkbook(wb, `Laporan_Rekap`);
}

/**
 * Export performance report with driver, package, and fuel analysis
 *
 * Generates a comprehensive Excel report showing operational performance metrics
 * including driver performance, package utilization, and fuel consumption analysis.
 *
 * @async
 * @param {Object} performanceData - Performance metrics from API
 * @param {Array} performanceData.driverPerformance - Driver performance data
 * @param {Array} performanceData.packagePerformance - Package performance data
 * @param {Object} fuelData - Fuel consumption data from API
 * @param {Array} fuelData.fuelAnalysis - Fuel analysis by vehicle
 * @param {Object} dateRange - Date range for the report
 * @param {string} dateRange.from - Start date (YYYY-MM-DD)
 * @param {string} dateRange.to - End date (YYYY-MM-DD)
 *
 * @returns {Promise<void>} Downloads the Excel file to the user's browser
 *
 * @throws {Error} If no performance or fuel data is available for export
 *
 * @example
 * await exportPerformanceReport(
 *   {
 *     driverPerformance: [...],
 *     packagePerformance: [...]
 *   },
 *   { fuelAnalysis: [...] },
 *   { from: '2025-11-01', to: '2025-11-30' }
 * );
 *
 * @description
 * The exported Excel file contains multiple sheets:
 * - Summary: Key performance indicators and totals
 * - Driver Performance: Metrics per driver (trips, hours, completion rate, revenue)
 * - Package Performance: Metrics per package (bookings, revenue, utilization)
 * - Fuel Analysis: Fuel consumption by vehicle (refills, cost, consumption per trip)
 *
 * Metrics Calculated:
 * - Driver: Total trips, working hours, completion rate, revenue
 * - Package: Total bookings, revenue, average per booking, utilization percentage
 * - Fuel: Total refills, cost, average per refill, consumption per trip
 *
 * Data Integration:
 * - Uses calculateTransactionFinancials() for revenue calculations
 * - Aggregates data across multiple dimensions
 * - Provides comparative analysis and rankings
 */
export async function exportPerformanceReport(
  performanceData,
  fuelData,
  dateRange
) {
  // Validate data before export
  if (
    !performanceData ||
    !performanceData.driverPerformance ||
    !performanceData.packagePerformance
  ) {
    console.warn("Export warning: No performance data available");
    throw new Error("Tidak ada data kinerja untuk diekspor");
  }

  if (!fuelData || !fuelData.fuelAnalysis) {
    console.warn("Export warning: No fuel data available");
    throw new Error("Tidak ada data BBM untuk diekspor");
  }

  const wb = createWorkbook();

  const { driverPerformance, packagePerformance, summary } = performanceData;
  const fuelSummary = fuelData?.summary || {};
  const fuelAnalysis = fuelData?.fuelAnalysis || [];

  // Summary sheet
  const summaryMetrics = [
    ["Total Sopir", summary.totalDrivers || 0],
    ["Total Paket", summary.totalPackages || 0],
    ["Total Trip", summary.totalTrips || 0],
    ["Total Pendapatan", formatCurrencyForExcel(summary.totalRevenue || 0)],
    ["Total Biaya BBM", formatCurrencyForExcel(fuelSummary.totalFuelCost || 0)],
    ["Total Pengisian BBM", fuelSummary.totalRefuels || 0],
  ];

  const summarySheet = createSummarySheet(summaryMetrics, "Ringkasan Kinerja");
  addSheet(wb, "Ringkasan", summarySheet.data, {
    styleMap: summarySheet.styleMap,
    columnWidths: [30, 20],
  });

  // Driver Performance sheet with revenue data
  const driverHeaders = [
    "Nama Sopir",
    "Total Trip",
    "Trip Selesai",
    "Total Pendapatan",
    "Rata-rata/Trip",
    "Tingkat Penyelesaian",
  ];
  const driverData = [
    ["Kinerja Sopir"],
    [],
    driverHeaders,
    ...driverPerformance.map((driver) => [
      driver.driverName || driver.driver_name || "-",
      driver.totalTrips || 0,
      driver.completedTrips || 0,
      formatCurrencyForExcel(driver.totalRevenue || 0),
      formatCurrencyForExcel(driver.averageRevenuePerTrip || 0),
      `${driver.completionRate || 0}%`,
    ]),
  ];

  const driverStyleMap = {
    "0,0": "header",
    "2,0": "subHeader",
    "2,1": "subHeader",
    "2,2": "subHeader",
    "2,3": "subHeader",
    "2,4": "subHeader",
    "2,5": "subHeader",
  };

  // Apply styling to driver data rows
  driverPerformance.forEach((_, index) => {
    const rowIndex = index + 3;
    driverStyleMap[`${rowIndex},0`] = "data";
    driverStyleMap[`${rowIndex},1`] = "number";
    driverStyleMap[`${rowIndex},2`] = "number";
    driverStyleMap[`${rowIndex},3`] = "currency";
    driverStyleMap[`${rowIndex},4`] = "currency";
    driverStyleMap[`${rowIndex},5`] = "data";
  });

  addSheet(wb, "Kinerja Sopir", driverData, {
    styleMap: driverStyleMap,
    columnWidths: [25, 12, 12, 18, 18, 18],
  });

  // Package Performance sheet with revenue data
  const packageHeaders = [
    "Jenis Paket",
    "Total Booking",
    "Total Pendapatan",
    "Rata-rata/Booking",
    "% dari Total",
  ];
  const packageData = [
    ["Kinerja Paket"],
    [],
    packageHeaders,
    ...packagePerformance.map((pkg) => [
      pkg.packageType || pkg.packageName || "-",
      pkg.totalBookings || pkg.frequency || 0,
      formatCurrencyForExcel(pkg.totalRevenue || 0),
      formatCurrencyForExcel(pkg.averageRevenuePerBooking || 0),
      `${pkg.revenueShare || 0}%`,
    ]),
  ];

  const packageStyleMap = {
    "0,0": "header",
    "2,0": "subHeader",
    "2,1": "subHeader",
    "2,2": "subHeader",
    "2,3": "subHeader",
    "2,4": "subHeader",
  };

  // Apply styling to package data rows
  packagePerformance.forEach((_, index) => {
    const rowIndex = index + 3;
    packageStyleMap[`${rowIndex},0`] = "data";
    packageStyleMap[`${rowIndex},1`] = "number";
    packageStyleMap[`${rowIndex},2`] = "currency";
    packageStyleMap[`${rowIndex},3`] = "currency";
    packageStyleMap[`${rowIndex},4`] = "data";
  });

  addSheet(wb, "Kinerja Paket", packageData, {
    styleMap: packageStyleMap,
    columnWidths: [25, 15, 18, 18, 12],
  });

  // Fuel Analysis sheet with corrected field accessors
  const fuelHeaders = [
    "Armada",
    "Total Pengisian",
    "Total Biaya",
    "Rata-rata/Pengisian",
    "Konsumsi/Trip (L)",
  ];
  const fuelDataRows = [
    ["Analisis BBM"],
    [],
    fuelHeaders,
    ...fuelAnalysis.map((fuel) => [
      fuel.armada_name || fuel.armadaName || "-",
      fuel.totalRefuels || 0,
      formatCurrencyForExcel(fuel.totalCost || 0),
      formatCurrencyForExcel(fuel.avgCostPerRefuel || 0),
      fuel.avgConsumptionPerTrip?.toFixed(2) || "0.00",
    ]),
  ];

  const fuelStyleMap = {
    "0,0": "header",
    "2,0": "subHeader",
    "2,1": "subHeader",
    "2,2": "subHeader",
    "2,3": "subHeader",
    "2,4": "subHeader",
  };

  // Apply styling to fuel data rows
  fuelAnalysis.forEach((_, index) => {
    const rowIndex = index + 3;
    fuelStyleMap[`${rowIndex},0`] = "data";
    fuelStyleMap[`${rowIndex},1`] = "number";
    fuelStyleMap[`${rowIndex},2`] = "currency";
    fuelStyleMap[`${rowIndex},3`] = "currency";
    fuelStyleMap[`${rowIndex},4`] = "data";
  });

  addSheet(wb, "Analisis BBM", fuelDataRows, {
    styleMap: fuelStyleMap,
    columnWidths: [25, 15, 18, 18, 15],
  });

  return exportWorkbook(wb, `Laporan_Kinerja`);
}

/**
 * Chart of Accounts mapping for tour and travel business
 */
const CHART_OF_ACCOUNTS = {
  // Revenue Accounts (4xxx)
  REVENUE: {
    4100: "Tour Package Revenue",
    4200: "Car Rental Revenue",
    4300: "Full Day Trip Revenue",
    4400: "Custom Service Revenue",
    4500: "Overtime Charges",
  },
  // Cost of Sales (5xxx)
  COST_OF_SALES: {
    5100: "Fuel Costs",
    5200: "Driver Wages (Direct)",
    5300: "Vehicle Maintenance (Direct)",
  },
  // Operating Expenses (6xxx)
  OPERATING_EXPENSES: {
    6100: "Administrative Salaries",
    6200: "Office Rent",
    6300: "Utilities",
    6400: "Marketing",
    6500: "Insurance",
    6600: "Depreciation",
  },
};

/**
 * Export income statement (Laporan Laba Rugi) with standard accounting format
 */
export function exportIncomeStatement(data, dateRange) {
  const wb = createWorkbook();

  // Income Statement sheet with standard format
  const incomeStatementData = [
    ["LAPORAN LABA RUGI"],
    [`Periode: ${dateRange.from} s/d ${dateRange.to}`],
    [],
    ["PENDAPATAN"],
    [
      "4100 - Pendapatan Sewa Kendaraan",
      formatCurrencyForExcel(data.totalPemasukanSewa || 0),
    ],
    ["Total Pendapatan", formatCurrencyForExcel(data.totalPemasukanSewa || 0)],
    [],
    ["HARGA POKOK PENJUALAN"],
    ["5100 - Biaya BBM", formatCurrencyForExcel(data.biayaBBM || 0)],
    [
      "5200 - Gaji Sopir (Langsung)",
      formatCurrencyForExcel(data.gajiSopir || 0),
    ],
    ["Total HPP", formatCurrencyForExcel(data.totalBiayaOps || 0)],
    [],
    [
      "LABA KOTOR",
      formatCurrencyForExcel(
        (data.totalPemasukanSewa || 0) - (data.totalBiayaOps || 0)
      ),
    ],
    [],
    ["BIAYA OPERASIONAL"],
    [
      "6100 - Gaji Staf Administrasi",
      formatCurrencyForExcel(data.gajiStaf || 0),
    ],
    ["6200 - Sewa Kantor", formatCurrencyForExcel(data.sewaKantor || 0)],
    [
      "6300 - Utilitas (Listrik, Internet)",
      formatCurrencyForExcel(data.utilitas || 0),
    ],
    ["6400 - Biaya Pemasaran", formatCurrencyForExcel(data.pemasaran || 0)],
    ["6500 - Asuransi", formatCurrencyForExcel(data.asuransi || 0)],
    ["6600 - Depresiasi", formatCurrencyForExcel(data.depresiasi || 0)],
    [
      "6900 - Operasional Lainnya",
      formatCurrencyForExcel(data.operasionalLainnya || 0),
    ],
    [
      "Total Biaya Operasional",
      formatCurrencyForExcel(data.totalBiayaKantor || 0),
    ],
    [],
    ["LABA (RUGI) BERSIH", formatCurrencyForExcel(data.labaRugiBersih || 0)],
    [],
    ["ANALISIS"],
    ["Margin Laba Kotor", data.grossProfitMargin || "0%"],
    ["Margin Laba Bersih", data.profitMargin || "0%"],
  ];

  const incomeStatementStyleMap = {
    "0,0": "header",
    "3,0": "subHeader",
    "7,0": "subHeader",
    "14,0": "subHeader",
    "5,0": "total",
    "5,1": "total",
    "10,0": "total",
    "10,1": "total",
    "12,0": "total",
    "12,1":
      data.totalPemasukanSewa - data.totalBiayaOps >= 0
        ? "positive"
        : "negative",
    "21,0": "total",
    "21,1": "total",
    "23,0": "total",
    "23,1": data.labaRugiBersih >= 0 ? "positive" : "negative",
  };

  // Apply currency styling to amount column
  for (let i = 4; i < 23; i++) {
    if (i !== 6 && i !== 11 && i !== 13 && i !== 22) {
      incomeStatementStyleMap[`${i},1`] = "currency";
    }
  }

  addSheet(wb, "Laporan Laba Rugi", incomeStatementData, {
    styleMap: incomeStatementStyleMap,
    columnWidths: [40, 20],
  });

  // Tax Summary sheet
  const taxableIncome = data.labaRugiBersih || 0;
  const vatRate = 0.11; // 11% PPN
  const estimatedVAT = (data.totalPemasukanSewa || 0) * vatRate;

  const taxData = [
    ["RINGKASAN PAJAK"],
    [],
    ["Pendapatan Kotor", formatCurrencyForExcel(data.totalPemasukanSewa || 0)],
    ["Penghasilan Kena Pajak", formatCurrencyForExcel(taxableIncome)],
    [],
    ["PPN (11%)", formatCurrencyForExcel(estimatedVAT)],
    ["PPN Masukan (Estimasi)", formatCurrencyForExcel(estimatedVAT * 0.5)],
    ["PPN Keluaran (Estimasi)", formatCurrencyForExcel(estimatedVAT)],
    ["Posisi PPN Neto", formatCurrencyForExcel(estimatedVAT * 0.5)],
  ];

  const taxStyleMap = {
    "0,0": "header",
    "2,1": "currency",
    "3,1": "currency",
    "5,1": "currency",
    "6,1": "currency",
    "7,1": "currency",
    "8,1": "currency",
  };

  addSheet(wb, "Ringkasan Pajak", taxData, {
    styleMap: taxStyleMap,
    columnWidths: [30, 20],
  });

  // Chart of Accounts sheet
  const coaData = [
    ["BAGAN AKUN (CHART OF ACCOUNTS)"],
    [],
    ["Kode Akun", "Nama Akun", "Kategori"],
    [],
    ["PENDAPATAN (4xxx)"],
    ...Object.entries(CHART_OF_ACCOUNTS.REVENUE).map(([code, name]) => [
      code,
      name,
      "Pendapatan",
    ]),
    [],
    ["HARGA POKOK PENJUALAN (5xxx)"],
    ...Object.entries(CHART_OF_ACCOUNTS.COST_OF_SALES).map(([code, name]) => [
      code,
      name,
      "HPP",
    ]),
    [],
    ["BIAYA OPERASIONAL (6xxx)"],
    ...Object.entries(CHART_OF_ACCOUNTS.OPERATING_EXPENSES).map(
      ([code, name]) => [code, name, "Biaya Operasional"]
    ),
  ];

  const coaStyleMap = {
    "0,0": "header",
    "2,0": "subHeader",
    "2,1": "subHeader",
    "2,2": "subHeader",
    "4,0": "subHeader",
  };

  addSheet(wb, "Bagan Akun", coaData, {
    styleMap: coaStyleMap,
    columnWidths: [15, 35, 20],
  });

  return exportWorkbook(wb, `Laporan_Laba_Rugi`);
}
