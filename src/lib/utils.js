import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import * as XLSX from "xlsx";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Format currency to Indonesian Rupiah
export function formatCurrency(amount) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount || 0);
}

// DEPRECATED: Use calculateTransactionFinancials from @/lib/accounting instead
// This function is kept for backward compatibility but will be removed in future versions
export function calculateFinancials(tx) {
  if (process.env.NODE_ENV !== "production") {
    console.warn(
      "DEPRECATED: calculateFinancials() from utils.js is deprecated. Use calculateTransactionFinancials() from @/lib/accounting instead."
    );
  }

  // Import and re-export from accounting.js
  const { calculateTransactionFinancials } = require("./accounting");
  return calculateTransactionFinancials(tx);
}

export function exportToExcel(data, fileName) {
  try {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Laporan");
    const finalFileName = `${fileName}_${
      new Date().toISOString().split("T")[0]
    }.xlsx`;
    XLSX.writeFile(wb, finalFileName);
  } catch (error) {
    console.error("Gagal mengekspor Excel:", error);
    throw new Error("Gagal mengunduh laporan Excel.");
  }
}

/**
 * Validate an array of price ranges for a hotel tier.
 * Rules:
 * - minPax and maxPax must be integers >= 1
 * - maxPax >= minPax
 * - price must be a valid number > 0
 * - ranges must not overlap or touch (cur.min <= prev.max => invalid)
 *
 * Returns { ok: boolean, message?: string }
 */
export function validatePriceRangesForTier(priceRanges) {
  if (!Array.isArray(priceRanges)) return { ok: true };

  const normalized = priceRanges.map((r, idx) => {
    const min = Number(r?.minPax ?? r?.min ?? 0);
    const max = Number(r?.maxPax ?? r?.max ?? 0);
    // Handle price more carefully - could be string from CurrencyInput
    let price = r?.price;
    if (typeof price === "string") {
      price = price.trim() === "" ? 0 : Number(price);
    } else {
      price = Number(price || 0);
    }
    return { min, max, price, idx };
  });

  for (const r of normalized) {
    if (!Number.isFinite(r.min) || !Number.isFinite(r.max)) {
      return {
        ok: false,
        message: `Rentang tidak valid (min/max harus angka)`,
      };
    }
    if (r.min < 1) {
      return { ok: false, message: `minPax harus >= 1` };
    }
    if (r.max < r.min) {
      return { ok: false, message: `maxPax harus >= minPax` };
    }
    if (!Number.isFinite(r.price) || r.price <= 0) {
      return {
        ok: false,
        message: `Harga harus berupa angka yang valid dan > 0`,
      };
    }
  }

  normalized.sort((a, b) => a.min - b.min);
  for (let i = 1; i < normalized.length; i++) {
    const prev = normalized[i - 1];
    const cur = normalized[i];
    // allow touching (e.g., [1-3] and [3-5]) but disallow true overlap
    // invalid when cur.min < prev.max
    if (cur.min < prev.max) {
      return {
        ok: false,
        message: `Rentang pax bertumpuk antara [${prev.min}-${prev.max}] dan [${cur.min}-${cur.max}]`,
      };
    }
  }

  return { ok: true };
}

/**
 * Returns detailed conflicts for priceRanges.
 * Output: { errors: Array<{ index, message }>, overlaps: Array<{ aIndex, bIndex, a, b }> }
 */
export function getPriceRangeConflicts(priceRanges) {
  const result = { errors: [], overlaps: [] };
  if (!Array.isArray(priceRanges)) return result;

  const normalized = priceRanges.map((r, idx) => ({
    min: Number(r?.minPax ?? r?.min ?? 0),
    max: Number(r?.maxPax ?? r?.max ?? 0),
    // Handle price more carefully - could be string from CurrencyInput
    price: (() => {
      let p = r?.price;
      if (typeof p === "string") {
        p = p.trim() === "" ? 0 : Number(p);
      } else {
        p = Number(p || 0);
      }
      return p;
    })(),
    idx,
  }));

  normalized.forEach((r) => {
    if (!Number.isFinite(r.min) || !Number.isFinite(r.max)) {
      result.errors.push({ index: r.idx, message: `min/max harus angka` });
    } else if (r.min < 1) {
      result.errors.push({ index: r.idx, message: `minPax harus >= 1` });
    } else if (r.max < r.min) {
      result.errors.push({ index: r.idx, message: `maxPax harus >= minPax` });
    }
    if (!Number.isFinite(r.price) || r.price <= 0) {
      result.errors.push({
        index: r.idx,
        message: `Harga harus valid dan > 0`,
      });
    }
  });

  // check overlaps (allow touching: cur.min < prev.max invalid)
  const sorted = [...normalized].sort((a, b) => a.min - b.min || a.max - b.max);
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const cur = sorted[i];
    if (cur.min < prev.max) {
      result.overlaps.push({
        aIndex: prev.idx,
        bIndex: cur.idx,
        a: prev,
        b: cur,
      });
    }
  }

  return result;
}
