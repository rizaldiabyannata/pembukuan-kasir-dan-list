/**
 * Transaction Validator
 * Zod schemas for transaction data validation
 */

import { z } from "zod";

// Base schema for transaction data
export const createTransactionSchema = z
  .object({
    // Customer data
    customer_name: z
      .string()
      .min(1, "Nama pelanggan wajib diisi")
      .max(100, "Nama pelanggan terlalu panjang (maksimal 100 karakter)"),
    customer_phone: z
      .string()
      .min(10, "Nomor telepon tidak valid (minimal 10 digit)")
      .max(15, "Nomor telepon terlalu panjang (maksimal 15 digit)")
      .regex(
        /^[0-9+\-\s()]+$/,
        "Nomor telepon hanya boleh berisi angka dan simbol +, -, (), spasi"
      ),

    // Dates
    booking_date: z.string().datetime("Format tanggal booking tidak valid"),
    checkout_datetime: z
      .string()
      .datetime("Format tanggal checkout tidak valid"),
    checkin_datetime: z.string().datetime("Format tanggal checkin tidak valid"),

    // Financial data
    all_in_rate: z
      .number()
      .positive("Tarif sewa harus angka positif")
      .int("Tarif sewa harus angka bulat")
      .max(1000000000, "Tarif sewa terlalu besar"),
    overtime_rate_per_hour: z
      .number()
      .nonnegative("Tarif overtime tidak boleh negatif")
      .int("Tarif overtime harus angka bulat")
      .max(10000000, "Tarif overtime terlalu besar")
      .optional()
      .nullable(),
    dp_amount: z
      .number()
      .nonnegative("Jumlah DP tidak boleh negatif")
      .int("Jumlah DP harus angka bulat")
      .max(1000000000, "Jumlah DP terlalu besar")
      .optional()
      .nullable(),
    payment_status: z.enum(["UNPAID", "DOWN_PAYMENT", "PAID"]).optional(),

    // Optional tour package data
    hotel_name: z
      .string()
      .max(200, "Nama hotel terlalu panjang")
      .optional()
      .nullable(),
    pax_count: z
      .number()
      .positive("Jumlah pax harus positif")
      .int("Jumlah pax harus angka bulat")
      .max(100, "Jumlah pax terlalu besar (maksimal 100)")
      .optional()
      .nullable(),
    hotel_tier_id: z
      .string()
      .uuid("ID Hotel Tier tidak valid")
      .optional()
      .nullable(),
    custom_price: z
      .number()
      .positive("Harga custom harus positif")
      .int("Harga custom harus angka bulat")
      .max(1000000000, "Harga custom terlalu besar")
      .optional()
      .nullable(),

    // Relations
    armadaId: z.string().uuid("ID Armada tidak valid"),
    driverId: z.string().uuid("ID Sopir tidak valid"),
    packageId: z.string().uuid("ID Paket tidak valid").optional().nullable(),
  })
  .refine(
    (data) => {
      // Validate that checkin is after checkout
      const checkout = new Date(data.checkout_datetime);
      const checkin = new Date(data.checkin_datetime);
      return checkin > checkout;
    },
    {
      message: "Waktu mobil in (selesai) harus setelah waktu mobil out (jalan)",
      path: ["checkin_datetime"],
    }
  )
  .refine(
    (data) => {
      // Validate that dates are not too far in the past (more than 1 year)
      const checkout = new Date(data.checkout_datetime);
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      return checkout >= oneYearAgo;
    },
    {
      message: "Tanggal checkout tidak boleh lebih dari 1 tahun yang lalu",
      path: ["checkout_datetime"],
    }
  )
  .refine(
    (data) => {
      // Validate that dates are not too far in the future (more than 1 year)
      const checkin = new Date(data.checkin_datetime);
      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
      return checkin <= oneYearFromNow;
    },
    {
      message: "Tanggal checkin tidak boleh lebih dari 1 tahun ke depan",
      path: ["checkin_datetime"],
    }
  )
  .refine(
    (data) => {
      // Validate that DP amount doesn't exceed total rate
      const dpAmount = data.dp_amount || 0;
      const totalRate = data.all_in_rate || 0;
      return dpAmount <= totalRate;
    },
    {
      message: "Jumlah DP tidak boleh melebihi total tarif sewa",
      path: ["dp_amount"],
    }
  );

// Schema for updating transaction (same as create for now)
export const updateTransactionSchema = createTransactionSchema;

// Helper function to validate transaction data
export function validateTransactionData(data, isUpdate = false) {
  const schema = isUpdate ? updateTransactionSchema : createTransactionSchema;
  return schema.safeParse(data);
}
