const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

/**
 * SEED DATA UNTUK TEST EXPORT LAPORAN
 * =====================================
 * Script ini membuat data realistis untuk testing semua fitur export:
 * - Berbagai tipe paket (CAR_RENTAL, TOUR_PACKAGE, FULL_DAY_TRIP, CUSTOM_PRICING)
 * - Transaksi dengan berbagai status dan skenario (overtime, no overtime, dll)
 * - Expenses dengan berbagai kategori
 * - Data untuk 3 bulan terakhir (Sept-Nov 2024)
 */

async function main() {
  console.log("🧹 Cleaning database...");
  
  // Safe delete helper
  async function safeDeleteMany(name, fn) {
    try {
      await fn();
      console.log(`  ✅ Cleared ${name}`);
    } catch (e) {
      if (e && e.code === "P2021") {
        console.warn(`  ⚠️  Table for model ${name} not found — skipping delete.`);
      } else {
        throw e;
      }
    }
  }

  // Cleanup in correct order (FK constraints)
  await safeDeleteMany("Transaction", () => prisma.transaction.deleteMany());
  await safeDeleteMany("Expense", () => prisma.expense.deleteMany());
  await safeDeleteMany("ExpenseAttachment", () => prisma.expenseAttachment.deleteMany());
  await safeDeleteMany("ItineraryDay", () => prisma.itineraryDay.deleteMany());
  await safeDeleteMany("HotelPriceRange", () => prisma.hotelPriceRange.deleteMany());
  await safeDeleteMany("Hotel", () => prisma.hotel.deleteMany());
  await safeDeleteMany("HotelTier", () => prisma.hotelTier.deleteMany());
  await safeDeleteMany("ServicePackage", () => prisma.servicePackage.deleteMany());
  await safeDeleteMany("Staff", () => prisma.staff.deleteMany());
  await safeDeleteMany("Driver", () => prisma.driver.deleteMany());
  await safeDeleteMany("Armada", () => prisma.armada.deleteMany());
  await safeDeleteMany("Session", () => prisma.session.deleteMany());
  await safeDeleteMany("AuditLog", () => prisma.auditLog.deleteMany());
  await safeDeleteMany("User", () => prisma.user.deleteMany());

  console.log("\n👥 Creating users...");
  
  const hashedPassword = await bcrypt.hash("password123", 10);
  
  const adminUser = await prisma.user.create({
    data: {
      email: "admin@rental.com",
      username: "admin",
      password: hashedPassword,
      name: "Admin User",
      role: "ADMIN",
      isActive: true,
    },
  });

  const operatorUser = await prisma.user.create({
    data: {
      email: "operator@rental.com",
      username: "operator",  
      password: hashedPassword,
      name: "Operator User",
      role: "OPERATOR",
      isActive: true,
    },
  });

  console.log(`  ✅ Created admin: ${adminUser.email}`);
  console.log(`  ✅ Created operator: ${operatorUser.email}`);

  console.log("\n🚗 Creating armadas...");
  
  const armadas = await Promise.all([
    prisma.armada.create({
      data: {
        license_plate: "B 1234 ABC",
        brand: "Toyota",
        model: "Avanza",
        vehicle_type: "MPV",
        year: 2020,
        color: "Putih",
        capacity: 7,
        status: "READY",
      },
    }),
    prisma.armada.create({
      data: {
        license_plate: "B 5678 DEF",
        brand: "Daihatsu",
        model: "Xenia",
        vehicle_type: "MPV",
        year: 2019,
        color: "Silver",
        capacity: 7,
        status: "READY",
      },
    }),
    prisma.armada.create({
      data: {
        license_plate: "B 9012 GHI",
        brand: "Toyota",
        model: "Innova Reborn",
        vehicle_type: "MPV",
        year: 2021,
        color: "Hitam",
        capacity: 8,
        status: "ON_TRIP",
      },
    }),
    prisma.armada.create({
      data: {
        license_plate: "B 3456 JKL",
        brand: "Mitsubishi",
        model: "Pajero Sport",
        vehicle_type: "SUV",
        year: 2022,
        color: "Putih",
        capacity: 7,
        status: "READY",
      },
    }),
    prisma.armada.create({
      data: {
        license_plate: "B 7890 MNO",
        brand: "Toyota",
        model: "Fortuner",
        vehicle_type: "SUV",
        year: 2022,
        color: "Abu-abu",
        capacity: 7,
        status: "BOOKED",
      },
    }),
    prisma.armada.create({
      data: {
        license_plate: "B 2468 PQR",
        brand: "Honda",
        model: "CR-V",
        vehicle_type: "SUV",
        year: 2021,
        color: "Merah",
        capacity: 7,
        status: "MAINTENANCE",
      },
    }),
    prisma.armada.create({
      data: {
        license_plate: "B 1357 STU",
        brand: "Toyota",
        model: "Hiace Premio",
        vehicle_type: "Minibus",
        year: 2023,
        color: "Putih",
        capacity: 14,
        status: "READY",
      },
    }),
  ]);

  console.log(`  ✅ Created ${armadas.length} armadas`);

  console.log("\n👨‍✈️ Creating drivers...");
  
  const drivers = await Promise.all([
    prisma.driver.create({
      data: {
        driver_name: "Pak Budi Santoso",
        nik: "3201012101850001",
        phone_number: "081234567890",
        address: "Jl. Merdeka No. 123, Jakarta Pusat",
        status: "READY",
      },
    }),
    prisma.driver.create({
      data: {
        driver_name: "Pak Ahmad Wijaya",
        nik: "3201012202860002",
        phone_number: "081298765432",
        address: "Jl. Sudirman No. 456, Jakarta Selatan",
        status: "READY",
      },
    }),
    prisma.driver.create({
      data: {
        driver_name: "Pak Gunawan",
        nik: "3201012303870003",
        phone_number: "081333444555",
        address: "Jl. Gatot Subroto No. 789, Jakarta Barat",
        status: "ON_TRIP",
      },
    }),
    prisma.driver.create({
      data: {
        driver_name: "Pak Rudi Hermawan",
        nik: "3201012404880004",
        phone_number: "081444555666",
        address: "Jl. Rasuna Said No. 321, Jakarta Selatan",
        status: "READY",
      },
    }),
    prisma.driver.create({
      data: {
        driver_name: "Pak Hendra Kurniawan",
        nik: "3201012505890005",
        phone_number: "081555666777",
        address: "Jl. Thamrin No. 654, Jakarta Pusat",
        status: "READY",
      },
    }),
    prisma.driver.create({
      data: {
        driver_name: "Pak Slamet",
        nik: "3201012606900006",
        phone_number: "081666777888",
        address: "Jl. Imam Bonjol No. 987, Jakarta Pusat",
        status: "OFF_DUTY",
      },
    }),
  ]);

  console.log(`  ✅ Created ${drivers.length} drivers`);

  console.log("\n👔 Creating staff...");
  
  const staff = await Promise.all([
    prisma.staff.create({
      data: {
        staff_name: "Siti Nurhaliza",
        nik: "STF001",
        position: "Admin",
        phone_number: "081777888999",
        email: "siti@rental.com",
        address: "Jakarta",
        salary_amount: 4500000,
        allowances: 500000,
        bank_name: "BCA",
        bank_account: "1234567890",
        account_holder: "Siti Nurhaliza",
        status: "ACTIVE",
        join_date: new Date("2023-01-15"),
      },
    }),
     prisma.staff.create({
      data: {
        staff_name: "Dewi Lestari",
        nik: "STF002",
        position: "Finance",
        phone_number: "081888999000",
        email: "dewi@rental.com",
        address: "Jakarta",
        salary_amount: 5000000,
        allowances: 750000,
        bank_name: "Mandiri",
        bank_account: "0987654321",
        account_holder: "Dewi Lestari",
        status: "ACTIVE",
        join_date: new Date("2023-03-20"),
      },
    }),
    prisma.staff.create({
      data: {
        staff_name: "Agus Salim",
        nik: "STF003",
        position: "Operasional",
        phone_number: "081999000111",
        email: "agus@rental.com",
        address: "Jakarta",
        salary_amount: 4000000,
        allowances: 400000,
        bank_name: "BNI",
        bank_account: "1122334455",
        account_holder: "Agus Salim",
        status: "ACTIVE",
        join_date: new Date("2023-06-01"),
      },
    }),
  ]);

  console.log(`  ✅ Created ${staff.length} staff`);

  console.log("\n📦 Creating service packages...");

  // 1. CAR RENTAL - Avanza 12 jam
  const carRental12h = await prisma.servicePackage.create({
    data: {
      name: "Sewa Avanza 12 Jam",
      type: "CAR_RENTAL",
      description: "Paket sewa mobil Avanza termasuk sopir untuk 12 jam",
      includes: ["Sopir berpengalaman", "BBM dalam kota", "Asuransi dasar"],
      excludes: ["Parkir", "Tol", "Makan sopir", "Hotel sopir"],
      isCustomizable: true,
      customizableItems: ["Durasi", "Tujuan", "Pickup location"],
      price: 450000,
      durationHours: 12,
      overtimeRate: 50000,
    },
  });

  // 2. CAR RENTAL - Innova 24 jam
  const carRental24h = await prisma.servicePackage.create({
    data: {
      name: "Sewa Innova 24 Jam",
      type: "CAR_RENTAL",
      description: "Paket sewa mobil Innova termasuk sopir untuk 24 jam",
      includes: ["Sopir berpengalaman", "BBM dalam kota", "Asuransi komprehensif"],
      excludes: ["Parkir", "Tol", "Konsumsi sopir"],
      isCustomizable: true,
      customizableItems: ["Durasi", "Tujuan"],
      price: 750000,
      durationHours: 24,
      overtimeRate: 60000,
    },
  });

  // 3. TOUR_PACKAGE - Wisata Bali 3 Hari
  const tourBali = await prisma.servicePackage.create({
    data: {
      name: "Paket Wisata Bali 3 Hari 2 Malam",
      type: "TOUR_PACKAGE",
      description: "Paket wisata lengkap ke Bali dengan berbagai pilihan hotel",
      includes: [
        "Transportasi selama tour",
        "Penginapan sesuai tier hotel",
        "Tour guide berpengalaman",
        "Makan 6x (2 sarapan, 2 makan siang, 2 makan malam)",
        "Tiket masuk 3 destinasi wisata",
        "Dokumentasi foto",
      ],
      excludes: [
        "Tiket pesawat PP",
        "Pengeluaran pribadi",
        "Aktivitas tambahan",
      ],
      isCustomizable: false,
      customizableItems: [],
      durationDays: 3,
      durationNights: 2,
      hotelTiers: {
        create: [
          {
            starRating: 3,
            hotels: {
              create: [
                { name: "Hotel Bali Beach 3*" },
                { name: "Sanur Paradise Hotel 3*" },
              ],
            },
            priceRanges: {
              create: [
                { minPax: 2, maxPax: 2, price: 2500000 },
                { minPax: 3, maxPax: 4, price: 2200000 },
                { minPax: 5, maxPax: 6, price: 2000000 },
              ],
            },
          },
          {
            starRating: 4,
            hotels: {
              create: [
                { name: "Grand Inna Bali Beach 4*" },
                { name: "Aston Kuta Hotel 4*" },
              ],
            },
            priceRanges: {
              create: [
                { minPax: 2, maxPax: 2, price: 3500000 },
                { minPax: 3, maxPax: 4, price: 3200000 },
                { minPax: 5, maxPax: 6, price: 2900000 },
              ],
            },
          },
          {
            starRating: 5,
            hotels: {
              create: [
                { name: "The Laguna Resort \u0026 Spa 5*" },
                { name: "Hard Rock Hotel Bali 5*" },
              ],
            },
            priceRanges: {
              create: [
                { minPax: 2, maxPax: 2, price: 5000000 },
                { minPax: 3, maxPax: 4, price: 4500000 },
                { minPax: 5, maxPax: 6, price: 4200000 },
              ],
            },
          },
        ],
      },
      itineraries: {
        create: [
          {
            day: 1,
            title: "Arrival & Sunset di Tanah Lot",
            description: "Penjemputan bandara, check-in hotel, makan siang, kunjungan Tanah Lot untuk menikmati sunset",
          },
          {
            day: 2,
            title: "Tour Ubud & Tegalalang",
            description: "Sarapan, mengunjungi Monkey Forest, Tegalalang Rice Terrace, Tirta Empul, makan siang, kembali ke hotel",
          },
          {
            day: 3,
            title: "Beach Tour & Departure",
            description: "Sarapan, check-out, belanja oleh-oleh di Krisna, makan siang, antar ke bandara",
          },
        ],
      },
    },
  });

  // 4. FULL_DAY_TRIP - Trip Puncak
  const fullDayPuncak = await prisma.servicePackage.create({
    data: {
      name: "Full Day Trip Puncak",
      type: "FULL_DAY_TRIP",
      description: "Perjalanan satu hari penuh ke kawasan Puncak",
      includes: [
        "Transportasi PP",
        "Sopir",
        "BBM",
        "Tiket masuk Taman Safari (weekday)",
        "Makan siang",
      ],
      excludes: ["Pengeluaran pribadi", "Tiket wahana", "Parkir"],
      isCustomizable: false,
      customizableItems: [],
      price: 1200000,
    },
  });

  // 5. CUSTOM_PRICING - untuk transaksi khusus
  const customPricing = await prisma.servicePackage.create({
    data: {
      name: "Paket Custom",
      type: "CUSTOM_PRICING",
      description: "Paket dengan harga custom sesuai kesepakatan",
      includes: ["Sesuai kesepakatan"],
      excludes: [],
      isCustomizable: true,
      customizableItems: ["Semua aspek dapat disesuaikan"],
    },
  });

  console.log(`  ✅ Created 5 service packages`);

  console.log("\n💰 Creating expenses...");

  // Get hotel tiers for later use
  const hotelTiers = await prisma.hotelTier.findMany({
    where: { servicePackageId: tourBali.id },
  });

  const expenses = [];

  // November 2024 expenses
  expenses.push(
    // Biaya kantor
    await prisma.expense.create({
      data: {
        date: new Date("2024-11-01"),
        paymentMonth: new Date("2024-11-01"),
        category: "LISTRIK",
        description: "Tagihan listrik kantor bulan November",
        amount: 850000,
        approval_status: "APPROVED",
        approved_by_id: adminUser.id,
        approved_at: new Date("2024-11-02"),
      },
    }),
    await prisma.expense.create({
      data: {
        date: new Date("2024-11-01"),
        paymentMonth: new Date("2024-11-01"),
        category: "INTERNET",
        description: "Tagihan internet kantor bulan November",
        amount: 500000,
        approval_status: "APPROVED",
        approved_by_id: adminUser.id,
        approved_at: new Date("2024-11-02"),
      },
    }),
    await prisma.expense.create({
      data: {
        date: new Date("2024-11-05"),
        category: "ALAT_TULIS_KANTOR",
        description: "Pembelian ATK (kertas, tinta printer, alat tulis)",
        amount: 450000,
        approval_status: "APPROVED",
        approved_by_id: adminUser.id,
        approved_at: new Date("2024-11-05"),
      },
    }),
    // Gaji staff
    await prisma.expense.create({
      data: {
        date: new Date("2024-11-25"),
        paymentMonth: new Date("2024-11-01"),
        category: "GAJI_STAF_ADMIN",
        description: "Gaji bulan November - Siti Nurhaliza",
        amount: 5000000, // salary + allowance
        staffId: staff[0].id,
        namaPenerima: staff[0].staff_name,
        approval_status: "APPROVED",
        approved_by_id: adminUser.id,
        approved_at: new Date("2024-11-25"),
      },
    }),
    await prisma.expense.create({
      data: {
        date: new Date("2024-11-25"),
        paymentMonth: new Date("2024-11-01"),
        category: "GAJI_STAF_ADMIN",
        description: "Gaji bulan November - Dewi Lestari",
        amount: 5750000,
        staffId: staff[1].id,
        namaPenerima: staff[1].staff_name,
        approval_status: "APPROVED",
        approved_by_id: adminUser.id,
        approved_at: new Date("2024-11-25"),
      },
    }),
    await prisma.expense.create({
      data: {
        date: new Date("2024-11-25"),
        paymentMonth: new Date("2024-11-01"),
        category: "GAJI_STAF_OPERASIONAL",
        description: "Gaji bulan November - Agus Salim",
        amount: 4400000,
        staffId: staff[2].id,
        namaPenerima: staff[2].staff_name,
        approval_status: "APPROVED",
        approved_by_id: adminUser.id,
        approved_at: new Date("2024-11-25"),
      },
    }),
    // Perawatan armada
    await prisma.expense.create({
      data: {
        date: new Date("2024-11-10"),
        category: "PERAWATAN_ARMADA",
        description: "Servis berkala + ganti oli Honda CR-V",
        amount: 1200000,
        armadaId: armadas[5].id, // CR-V yang MAINTENANCE
        approval_status: "APPROVED",
        approved_by_id: adminUser.id,
        approved_at: new Date("2024-11-10"),
      },
    }),
    await prisma.expense.create({
      data: {
        date: new Date("2024-11-15"),
        category: "BBM",
        description: "BBM operasional armada minggu ke-2 November",
        amount: 3500000,
        approval_status: "APPROVED",
        approved_by_id: adminUser.id,
        approved_at: new Date("2024-11-16"),
      },
    }),
    // Konsumsi
    await prisma.expense.create({
      data: {
        date: new Date("2024-11-08"),
        category: "KONSUMSI",
        description: "Konsumsi rapat bulanan + snack kantor",
        amount: 750000,
        approval_status: "APPROVED",
        approved_by_id: adminUser.id,
        approved_at: new Date("2024-11-09"),
      },
    })
  );

  // October 2024 expenses
  expenses.push(
    await prisma.expense.create({
      data: {
        date: new Date("2024-10-01"),
        paymentMonth: new Date("2024-10-01"),
        category: "LISTRIK",
        description: "Tagihan listrik kantor bulan Oktober",
        amount: 820000,
        approval_status: "APPROVED",
        approved_by_id: adminUser.id,
        approved_at: new Date("2024-10-02"),
      },
    }),
    await prisma.expense.create({
      data: {
        date: new Date("2024-10-01"),
        paymentMonth: new Date("2024-10-01"),
        category: "INTERNET",
        description: "Tagihan internet kantor bulan Oktober",
        amount: 500000,
        approval_status: "APPROVED",
        approved_by_id: adminUser.id,
        approved_at: new Date("2024-10-02"),
      },
    }),
    await prisma.expense.create({
      data: {
        date: new Date("2024-10-25"),
        paymentMonth: new Date("2024-10-01"),
        category: "GAJI_STAF_ADMIN",
        description: "Gaji bulan Oktober - Siti Nurhaliza",
        amount: 5000000,
        staffId: staff[0].id,
        namaPenerima: staff[0].staff_name,
        approval_status: "APPROVED",
        approved_by_id: adminUser.id,
        approved_at: new Date("2024-10-25"),
      },
    }),
    await prisma.expense.create({
      data: {
        date: new Date("2024-10-25"),
        paymentMonth: new Date("2024-10-01"),
        category: "GAJI_STAF_ADMIN",
        description: "Gaji bulan Oktober - Dewi Lestari",
        amount: 5750000,
        staffId: staff[1].id,
        namaPenerima: staff[1].staff_name,
        approval_status: "APPROVED",
        approved_by_id: adminUser.id,
        approved_at: new Date("2024-10-25"),
      },
    }),
    await prisma.expense.create({
      data: {
        date: new Date("2024-10-12"),
        category: "BBM",
        description: "BBM operasional armada minggu ke-2 Oktober",
        amount: 3200000,
        approval_status: "APPROVED",
        approved_by_id: adminUser.id,
        approved_at: new Date("2024-10-13"),
      },
    }),
    await prisma.expense.create({
      data: {
        date: new Date("2024-10-05"),
        category: "PERAWATAN_ARMADA",
        description: "Ganti ban Innova Reborn",
        amount: 2500000,
        armadaId: armadas[2].id,
        approval_status: "APPROVED",
        approved_by_id: adminUser.id,
        approved_at: new Date("2024-10-05"),
      },
    })
  );

  // September 2024 expenses
  expenses.push(
    await prisma.expense.create({
      data: {
        date: new Date("2024-09-01"),
        paymentMonth: new Date("2024-09-01"),
        category: "LISTRIK",
        description: "Tagihan listrik kantor bulan September",
        amount: 780000,
        approval_status: "APPROVED",
        approved_by_id: adminUser.id,
        approved_at: new Date("2024-09-02"),
      },
    }),
    await prisma.expense.create({
      data: {
        date: new Date("2024-09-01"),
        paymentMonth: new Date("2024-09-01"),
        category: "INTERNET",
        description: "Tagihan internet kantor bulan September",
        amount: 500000,
        approval_status: "APPROVED",
        approved_by_id: adminUser.id,
        approved_at: new Date("2024-09-02"),
      },
    }),
    await prisma.expense.create({
      data: {
        date: new Date("2024-09-25"),
        paymentMonth: new Date("2024-09-01"),
        category: "GAJI_STAF_ADMIN",
        description: "Gaji bulan September - Siti Nurhaliza",
        amount: 5000000,
        staffId: staff[0].id,
        namaPenerima: staff[0].staff_name,
        approval_status: "APPROVED",
        approved_by_id: adminUser.id,
        approved_at: new Date("2024-09-25"),
      },
    }),
    await prisma.expense.create({
      data: {
        date: new Date("2024-09-15"),
        category: "BBM",
        description: "BBM operasional armada minggu ke-2 September",
        amount: 3000000,
        approval_status: "APPROVED",
        approved_by_id: adminUser.id,
        approved_at: new Date("2024-09-16"),
      },
    })
  );

  console.log(`  ✅ Created ${expenses.length} expenses`);

  console.log("\n📝 Creating transactions...");

  const transactions = [];

  // November 2024 transactions
  const novemberTxData = [
    // CAR_RENTAL dengan overtime
    {
      day: 2,
      customer: "PT Maju Jaya",
      phone: "021-5551234",
      packageId: carRental12h.id,
      baseRate: 450000,
      checkout: 8,
      checkin: 22, // 14 jam = 2 jam overtime
      overtimeRate: 50000,
      armadaIdx: 0,
      driverIdx: 0,
    },
    // CAR_RENTAL tanpa overtime
    {
      day: 5,
      customer: "Ibu Siti Rahayu",
      phone: "081234567890",
      packageId: carRental12h.id,
      baseRate: 450000,
      checkout: 9,
      checkin: 19, // 10 jam = no overtime
      overtimeRate: 50000,
      armadaIdx: 1,
      driverIdx: 1,
    },
    // TOUR_PACKAGE - 4 pax, hotel 4*
    {
      day: 8,
      customer: "Keluarga Bapak Hendra",
      phone: "081345678901",
      packageId: tourBali.id,
      hotelTierId: hotelTiers.find(t => t.starRating === 4)?.id,
      paxCount: 4,
      baseRate: 12800000, // 4 pax × 3,200,000
      checkout: 6,
      checkin: 18,
      overtimeRate: 0,
      armadaIdx: 6,
      driverIdx: 2,
      hotelName: "Aston Kuta Hotel 4*",
    },
    // FULL_DAY_TRIP
    {
      day: 10,
      customer: "CV Sejahtera Mandiri",
      phone: "021-7778888",
      packageId: fullDayPuncak.id,
      baseRate: 1200000,
      checkout: 7,
      checkin: 19,
      overtimeRate: 0,
      armadaIdx: 2,
      driverIdx: 3,
    },
    // CAR_RENTAL 24 jam dengan overtime
    {
      day: 12,
      customer: "Bapak Agus Widodo",
      phone: "081456789012",
      packageId: carRental24h.id,
      baseRate: 750000,
      checkout: 10,
      checkin: 38, // 28 jam = 4 jam overtime
      overtimeRate: 60000,
      armadaIdx: 3,
      driverIdx: 4,
    },
    // CUSTOM_PRICING
    {
      day: 15,
      customer: "PT Global Solutions",
      phone: "021-9990000",
      packageId: customPricing.id,
      baseRate: 2500000,
      customPrice: 2500000,
      checkout: 8,
      checkin: 20,
      overtimeRate: 0,
      armadaIdx: 4,
      driverIdx: 0,
    },
    // DOWN_PAYMENT transaction
    {
      day: 18,
      customer: "Ibu Linda Kusuma",
      phone: "081567890123",
      packageId: carRental12h.id,
      baseRate: 450000,
      checkout: 8,
      checkin: 20,
      overtimeRate: 50000,
      armadaIdx: 0,
      driverIdx: 1,
      paymentStatus: "DOWN_PAYMENT",
      dpAmount: 200000,
    },
    // TOUR_PACKAGE - 2 pax, hotel 3*
    {
      day: 20,
      customer: "Pasangan Muda Bahagia",
      phone: "081678901234",
      packageId: tourBali.id,
      hotelTierId: hotelTiers.find(t => t.starRating === 3)?.id,
      paxCount: 2,
      baseRate: 5000000, // 2 pax × 2,500,000
      checkout: 6,
      checkin: 18,
      overtimeRate: 0,
      armadaIdx: 6,
      driverIdx: 2,
      hotelName: "Sanur Paradise Hotel 3*",
    },
    // UNPAID transaction (untuk test filter)
    {
      day: 22,
      customer: "Bapak Tono",
      phone: "081789012345",
      packageId: carRental12h.id,
      baseRate: 450000,
      checkout: 9,
      checkin: 21,
      overtimeRate: 50000,
      armadaIdx: 1,
      driverIdx: 3,
      paymentStatus: "UNPAID",
    },
    // CAR_RENTAL dengan banyak overtime
    {
      day: 25,
      customer: "PT Karya Bersama",
      phone: "021-4443333",
      packageId: carRental12h.id,
      baseRate: 450000,
      checkout: 8,
      checkin: 26, // 18 jam = 6 jam overtime
      overtimeRate: 50000,
      armadaIdx: 0,
      driverIdx: 4,
    },
  ];

  for (let i = 0; i < novemberTxData.length; i++) {
    const tx = novemberTxData[i];
    const checkoutDate = new Date(`2024-11-${String(tx.day).padStart(2, "0")}T${String(tx.checkout).padStart(2, "0")}:00:00`);
    // Calculate checkin datetime
    let checkinDate;
    if (tx.checkin >= 24) {
      // Next day
      checkinDate = new Date(checkoutDate);
      checkinDate.setDate(checkinDate.getDate() + Math.floor(tx.checkin / 24));
      checkinDate.setHours(tx.checkin % 24, 0, 0, 0);
    } else {
      checkinDate = new Date(`2024-11-${String(tx.day).padStart(2, "0")}T${String(tx.checkin).padStart(2, "0")}:00:00`);
    }

    const transaction = await prisma.transaction.create({
      data: {
        invoice_code: `INV-2024-11-${String(i + 1).padStart(3, "0")}`,
        customer_name: tx.customer,
        customer_phone: tx.phone,
        booking_date: new Date(`2024-11-${String(tx.day).padStart(2, "0")}`),
        checkout_datetime: checkoutDate,
        checkin_datetime: checkinDate,
        actual_checkin_datetime: tx.paymentStatus !== "UNPAID" ? checkinDate : null,
        all_in_rate: tx.baseRate,
        overtime_rate_per_hour: tx.overtimeRate,
        custom_price: tx.customPrice,
        payment_status: tx.paymentStatus || "PAID",
        dp_amount: tx.dpAmount,
        approval_status: "APPROVED",
        submitted_at: new Date(`2024-11-${String(tx.day).padStart(2, "0")}`),
        submitted_by_id: operatorUser.id,
        approved_at: new Date(`2024-11-${String(tx.day).padStart(2, "0")}`),
        approved_by_id: adminUser.id,
        packageId: tx.packageId,
        armadaId: armadas[tx.armadaIdx].id,
        driverId: drivers[tx.driverIdx].id,
        hotel_tier_id: tx.hotelTierId,
        hotel_name: tx.hotelName,
        pax_count: tx.paxCount,
      },
    });
    transactions.push(transaction);
  }

  // October 2024 transactions (lebih sedikit)
  const octoberTxData = [
    {
      day: 5,
      customer: "Bapak Rudi",
      phone: "081222333444",
      packageId: carRental12h.id,
      baseRate: 450000,
      checkout: 8,
      checkin: 20,
      overtimeRate: 50000,
      armadaIdx: 0,
      driverIdx: 0,
    },
    {
      day: 10,
      customer: "Ibu Maria",
      phone: "081333444555",
      packageId: fullDayPuncak.id,
      baseRate: 1200000,
      checkout: 7,
      checkin: 19,
      overtimeRate: 0,
      armadaIdx: 2,
      driverIdx: 1,
    },
    {
      day: 15,
      customer: "PT Mandiri Jaya",
      phone: "021-1112222",
      packageId: carRental24h.id,
      baseRate: 750000,
      checkout: 9,
      checkin: 33,
      overtimeRate: 60000,
      armadaIdx: 3,
      driverIdx: 2,
    },
    {
      day: 20,
      customer: "Keluarga Pak Hendro",
      phone: "081444555666",
      packageId: tourBali.id,
      hotelTierId: hotelTiers.find(t => t.starRating === 5)?.id,
      paxCount: 4,
      baseRate: 18000000, // 4 pax × 4,500,000
      checkout: 6,
      checkin: 18,
      overtimeRate: 0,
      armadaIdx: 6,
      driverIdx: 3,
      hotelName: "The Laguna Resort & Spa 5*",
    },
    {
      day: 25,
      customer: "CV Sukses Makmur",
      phone: "021-3334444",
      packageId: carRental12h.id,
      baseRate: 450000,
      checkout: 10,
      checkin: 22,
      overtimeRate: 50000,
      armadaIdx: 1,
      driverIdx: 4,
    },
  ];

  for (let i = 0; i < octoberTxData.length; i++) {
    const tx = octoberTxData[i];
    const checkoutDate = new Date(`2024-10-${String(tx.day).padStart(2, "0")}T${String(tx.checkout).padStart(2, "0")}:00:00`);
    let checkinDate;
    if (tx.checkin >= 24) {
      checkinDate = new Date(checkoutDate);
      checkinDate.setDate(checkinDate.getDate() + Math.floor(tx.checkin / 24));
      checkinDate.setHours(tx.checkin % 24, 0, 0, 0);
    } else {
      checkinDate = new Date(`2024-10-${String(tx.day).padStart(2, "0")}T${String(tx.checkin).padStart(2, "0")}:00:00`);
    }

    const transaction = await prisma.transaction.create({
      data: {
        invoice_code: `INV-2024-10-${String(i + 1).padStart(3, "0")}`,
        customer_name: tx.customer,
        customer_phone: tx.phone,
        booking_date: new Date(`2024-10-${String(tx.day).padStart(2, "0")}`),
        checkout_datetime: checkoutDate,
        checkin_datetime: checkinDate,
        actual_checkin_datetime: checkinDate,
        all_in_rate: tx.baseRate,
        overtime_rate_per_hour: tx.overtimeRate,
        payment_status: "PAID",
        approval_status: "APPROVED",
        submitted_at: new Date(`2024-10-${String(tx.day).padStart(2, "0")}`),
        submitted_by_id: operatorUser.id,
        approved_at: new Date(`2024-10-${String(tx.day).padStart(2, "0")}`),
        approved_by_id: adminUser.id,
        packageId: tx.packageId,
        armadaId: armadas[tx.armadaIdx].id,
        driverId: drivers[tx.driverIdx].id,
        hotel_tier_id: tx.hotelTierId,
        hotel_name: tx.hotelName,
        pax_count: tx.paxCount,
      },
    });
    transactions.push(transaction);
  }

  // September 2024 transactions
  const septemberTxData = [
    {
      day: 8,
      customer: "Bapak Eko",
      phone: "081555666777",
      packageId: carRental12h.id,
      baseRate: 450000,
      checkout: 9,
      checkin: 21,
      overtimeRate: 50000,
      armadaIdx: 0,
      driverIdx: 0,
    },
    {
      day: 15,
      customer: "Ibu Wati",
      phone: "081666777888",
      packageId: carRental24h.id,
      baseRate: 750000,
      checkout: 8,
      checkin: 32,
      overtimeRate: 60000,
      armadaIdx: 3,
      driverIdx: 1,
    },
    {
      day: 22,
      customer: "PT Nusantara",
      phone: "021-5556666",
      packageId: fullDayPuncak.id,
      baseRate: 1200000,
      checkout: 7,
      checkin: 19,
      overtimeRate: 0,
      armadaIdx: 2,
      driverIdx: 2,
    },
  ];

  for (let i = 0; i < septemberTxData.length; i++) {
    const tx = septemberTxData[i];
    const checkoutDate = new Date(`2024-09-${String(tx.day).padStart(2, "0")}T${String(tx.checkout).padStart(2, "0")}:00:00`);
    let checkinDate;
    if (tx.checkin >= 24) {
      checkinDate = new Date(checkoutDate);
      checkinDate.setDate(checkinDate.getDate() + Math.floor(tx.checkin / 24));
      checkinDate.setHours(tx.checkin % 24, 0, 0, 0);
    } else {
      checkinDate = new Date(`2024-09-${String(tx.day).padStart(2, "0")}T${String(tx.checkin).padStart(2, "0")}:00:00`);
    }

    const transaction = await prisma.transaction.create({
      data: {
        invoice_code: `INV-2024-09-${String(i + 1).padStart(3, "0")}`,
        customer_name: tx.customer,
        customer_phone: tx.phone,
        booking_date: new Date(`2024-09-${String(tx.day).padStart(2, "0")}`),
        checkout_datetime: checkoutDate,
        checkin_datetime: checkinDate,
        actual_checkin_datetime: checkinDate,
        all_in_rate: tx.baseRate,
        overtime_rate_per_hour: tx.overtimeRate,
        payment_status: "PAID",
        approval_status: "APPROVED",
        submitted_at: new Date(`2024-09-${String(tx.day).padStart(2, "0")}`),
        submitted_by_id: operatorUser.id,
        approved_at: new Date(`2024-09-${String(tx.day).padStart(2, "0")}`),
        approved_by_id: adminUser.id,
        packageId: tx.packageId,
        armadaId: armadas[tx.armadaIdx].id,
        driverId: drivers[tx.driverIdx].id,
      },
    });
    transactions.push(transaction);
  }

  console.log(`  ✅ Created ${transactions.length} transactions`);

  // Summary
  console.log("\n📊 Seeding Summary:");
  console.log("  ✅ Users: 2 (1 Admin, 1 Operator)");
  console.log(`  ✅ Armadas: ${armadas.length}`);
  console.log(`  ✅ Drivers: ${drivers.length}`);
  console.log(`  ✅ Staff: ${staff.length}`);
  console.log("  ✅ Service Packages: 5");
  console.log(`  ✅ Expenses: ${expenses.length} (across 3 months)`);
  console.log(`  ✅ Transactions: ${transactions.length} (across 3 months)`);
  console.log("\n  November: 10 transactions");
  console.log("  October: 5 transactions");
  console.log("  September: 3 transactions");

  console.log("\n🎉 Seeding completed successfully!");
  console.log("\n📧 Login credentials:");
  console.log("  Admin: admin@rental.com / password123");
  console.log("  Operator: operator@rental.com / password123");
  console.log("\n💡 Tips for testing:");
  console.log("  - Export laporan untuk bulan November (data terlengkap)");
  console.log("  - Test filter by date range: Sept-Nov 2024");
  console.log("  - Check overtime calculations (beberapa transaksi ada overtime)");
  console.log("  - Verify TOUR_PACKAGE pricing (2-4 pax dengan tier berbeda)");
  console.log("  - Check payment status filtering (ada PAID, DOWN_PAYMENT, UNPAID)");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
