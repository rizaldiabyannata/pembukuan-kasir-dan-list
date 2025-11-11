const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("Cleaning related tables...");

  // Clean dependent tables first to avoid FK constraint issues.
  // Some environments may not have run migrations yet; handle missing tables gracefully.
  async function safeDeleteMany(name, fn) {
    try {
      await fn();
      console.log(`Cleared ${name}`);
    } catch (e) {
      // Prisma error when table doesn't exist is P2021
      if (e && e.code === "P2021") {
        console.warn(`Table for model ${name} not found — skipping delete.`);
      } else {
        throw e;
      }
    }
  }

  await safeDeleteMany("ItineraryDay", () => prisma.itineraryDay.deleteMany());
  await safeDeleteMany("HotelPriceRange", () =>
    prisma.hotelPriceRange.deleteMany()
  );
  await safeDeleteMany("Hotel", () => prisma.hotel.deleteMany());
  await safeDeleteMany("HotelTier", () => prisma.hotelTier.deleteMany());
  await safeDeleteMany("ServicePackage", () =>
    prisma.servicePackage.deleteMany()
  );
  // Clean operational tables (transactions, expenses, armada, drivers)
  await safeDeleteMany("Transaction", () => prisma.transaction.deleteMany());
  await safeDeleteMany("Expense", () => prisma.expense.deleteMany());
  await safeDeleteMany("Driver", () => prisma.driver.deleteMany());
  await safeDeleteMany("Armada", () => prisma.armada.deleteMany());

  console.log("Creating admin user for testing...");
  // Create admin user for Playwright tests
  const bcrypt = require("bcryptjs");
  await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      name: "Admin User",
      username: "admin",
      email: "admin@example.com",
      password: await bcrypt.hash("password123", 10),
      role: "ADMIN",
    },
  });

  console.log("Creating sample service packages...");

  // CAR RENTAL example
  await prisma.servicePackage.create({
    data: {
      name: "Sewa Avanza Harian",
      type: "CAR_RENTAL",
      description: "Paket sewa mobil Avanza inklusif sopir untuk 24 jam.",
      includes: ["Sopir", "BBM dasar", "Asuransi dasar"],
      excludes: ["Parkir", "Tiket masuk objek wisata"],
      isCustomizable: true,
      customizableItems: ["Waktu", "Penjemputan", "Tambahan sopir"],
      price: 350000,
      durationHours: 24,
      overtimeRate: 50000,
    },
  });

  // TOUR PACKAGE example with hotel tiers, hotels and price ranges + itineraries
  await prisma.servicePackage.create({
    data: {
      name: "Paket Wisata Bali 3 Hari",
      type: "TOUR_PACKAGE",
      description: "Paket wisata 3 hari 2 malam ke destinasi populer di Bali.",
      includes: [
        "Transportasi selama tour",
        "Penginapan sesuai tier",
        "Guide lokal",
        "Makan 6x",
      ],
      excludes: ["Tiket pesawat", "Pengeluaran pribadi"],
      isCustomizable: false,
      customizableItems: [],
      durationDays: 3,
      durationNights: 2,
      hotelTiers: {
        create: [
          {
            starRating: 3,
            pricePerPax: 0,
            hotels: {
              create: [
                { name: "Hotel Melati 3*" },
                { name: "Hotel Kembang 3*" },
              ],
            },
            priceRanges: {
              create: [
                { minPax: 2, maxPax: 3, price: 1000000 },
                { minPax: 4, maxPax: 5, price: 900000 },
              ],
            },
          },
          {
            starRating: 4,
            pricePerPax: 0,
            hotels: {
              create: [
                { name: "Hotel Bahari 4*" },
                { name: "Hotel Samudra 4*" },
              ],
            },
            priceRanges: {
              create: [
                { minPax: 2, maxPax: 3, price: 1500000 },
                { minPax: 4, maxPax: 6, price: 1300000 },
              ],
            },
          },
        ],
      },
      itineraries: {
        create: [
          {
            day: 1,
            title: "Tiba & Santai",
            description:
              "Penjemputan di bandara, makan siang, dan santai di hotel.",
          },
          {
            day: 2,
            title: "Tour Utama",
            description: "Kunjungan ke Pura, Tegalalang, dan pantai.",
          },
          {
            day: 3,
            title: "Check-out & Pulang",
            description: "Sarapan, check-out, dan antar ke bandara.",
          },
        ],
      },
    },
  });

  // FULL_DAY_TRIP example
  await prisma.servicePackage.create({
    data: {
      name: "Paket Trip Uluwatu Full Day",
      type: "FULL_DAY_TRIP",
      description:
        "Trip sehari ke kawasan Uluwatu, cocok untuk keluarga dan grup kecil.",
      includes: ["Transportasi PP", "Tiket masuk 2 lokasi", "Makan siang"],
      excludes: ["Pengeluaran pribadi"],
      isCustomizable: false,
      customizableItems: [],
      price: 800000,
    },
  });

  console.log("Seeding selesai.");

  // Create sample armada and driver data
  console.log("Creating sample armadas and drivers...");
  const armadas = await Promise.all([
    prisma.armada.create({
      data: {
        license_plate: "B 1234 XYZ",
        brand: "Toyota",
        model: "Avanza",
        status: "READY",
      },
    }),
    prisma.armada.create({
      data: {
        license_plate: "B 5678 ABC",
        brand: "Daihatsu",
        model: "Xenia",
        status: "READY",
      },
    }),
    prisma.armada.create({
      data: {
        license_plate: "B 9012 QWE",
        brand: "Toyota",
        model: "Innova",
        status: "BOOKED",
      },
    }),
    prisma.armada.create({
      data: {
        license_plate: "B 4567 DEF",
        brand: "Mitsubishi",
        model: "Pajero Sport",
        status: "ON_TRIP",
      },
    }),
    prisma.armada.create({
      data: {
        license_plate: "B 8901 GHI",
        brand: "Toyota",
        model: "Fortuner",
        status: "READY",
      },
    }),
    prisma.armada.create({
      data: {
        license_plate: "B 2345 JKL",
        brand: "Honda",
        model: "CR-V",
        status: "MAINTENANCE",
      },
    }),
    prisma.armada.create({
      data: {
        license_plate: "B 6789 MNO",
        brand: "Toyota",
        model: "Hiace",
        status: "READY",
      },
    }),
  ]);

  const drivers = await Promise.all([
    prisma.driver.create({
      data: {
        driver_name: "Gunawan",
        nik: "3172010101010001",
        phone_number: "081234567890",
        address: "Jakarta",
        status: "READY",
      },
    }),
    prisma.driver.create({
      data: {
        driver_name: "Siti Aminah",
        nik: "3172010202020002",
        phone_number: "081298765432",
        address: "Jakarta",
        status: "OFF_DUTY",
      },
    }),
    prisma.driver.create({
      data: {
        driver_name: "Budi Santoso",
        nik: "3172010303030003",
        phone_number: "081233344455",
        address: "Bogor",
        status: "ON_TRIP",
      },
    }),
    prisma.driver.create({
      data: {
        driver_name: "Ahmad Wijaya",
        nik: "3172010404040004",
        phone_number: "081277788899",
        address: "Bekasi",
        status: "READY",
      },
    }),
    prisma.driver.create({
      data: {
        driver_name: "Rudi Hermawan",
        nik: "3172010505050005",
        phone_number: "081266677788",
        address: "Tangerang",
        status: "READY",
      },
    }),
  ]);

  // Get service packages for transactions
  const packages = await prisma.servicePackage.findMany();
  const carRentalPackage = packages.find((p) => p.type === "CAR_RENTAL");
  const fullDayPackage = packages.find((p) => p.type === "FULL_DAY_TRIP");

  // Create expenses
  console.log("Creating expenses...");
  const now = new Date();
  await Promise.all([
    // Servis armada
    prisma.expense.create({
      data: {
        date: new Date(2025, 10, 5),
        category: "Servis",
        description: "Servis rutin dan ganti oli",
        amount: 850000,
        armadaId: armadas[5].id, // CR-V yang MAINTENANCE
      },
    }),
    prisma.expense.create({
      data: {
        date: new Date(2025, 10, 12),
        category: "Servis",
        description: "Ganti ban dan balancing",
        amount: 2500000,
        armadaId: armadas[0].id,
      },
    }),
    // Biaya kantor
    prisma.expense.create({
      data: {
        date: new Date(2025, 10, 1),
        category: "Biaya Kantor",
        description: "Sewa kantor bulan November",
        amount: 5000000,
      },
    }),
    prisma.expense.create({
      data: {
        date: new Date(2025, 10, 3),
        category: "Biaya Kantor",
        description: "Listrik dan air",
        amount: 1200000,
      },
    }),
    prisma.expense.create({
      data: {
        date: new Date(2025, 10, 7),
        category: "Biaya Kantor",
        description: "ATK dan perlengkapan kantor",
        amount: 750000,
      },
    }),
    // Gaji admin
    prisma.expense.create({
      data: {
        date: new Date(2025, 10, 1),
        category: "Gaji Admin",
        description: "Gaji admin bulan November",
        amount: 4500000,
      },
    }),
    // Expenses bulan Oktober
    prisma.expense.create({
      data: {
        date: new Date(2025, 9, 1),
        category: "Biaya Kantor",
        description: "Sewa kantor bulan Oktober",
        amount: 5000000,
      },
    }),
    prisma.expense.create({
      data: {
        date: new Date(2025, 9, 1),
        category: "Gaji Admin",
        description: "Gaji admin bulan Oktober",
        amount: 4500000,
      },
    }),
  ]);

  // Create transactions for November 2025
  console.log("Creating transactions for November 2025...");
  const novemberTransactions = [
    {
      day: 1,
      customer: "PT. Maju Jaya",
      phone: "021-55551234",
      rate: 900000,
      fuel: 150000,
      driverFee: 200000,
      armadaIdx: 0,
      driverIdx: 0,
      packageId: carRentalPackage?.id,
    },
    {
      day: 2,
      customer: "Dewi Lestari",
      phone: "081298765432",
      rate: 1200000,
      fuel: 200000,
      driverFee: 250000,
      armadaIdx: 1,
      driverIdx: 1,
      packageId: fullDayPackage?.id,
    },
    {
      day: 5,
      customer: "Rudi Hermawan",
      phone: "081387654321",
      rate: 850000,
      fuel: 160000,
      driverFee: 200000,
      armadaIdx: 2,
      driverIdx: 2,
      packageId: null,
    },
    {
      day: 7,
      customer: "CV. Sejahtera",
      phone: "021-77778888",
      rate: 1050000,
      fuel: 180000,
      driverFee: 250000,
      armadaIdx: 3,
      driverIdx: 3,
      packageId: carRentalPackage?.id,
    },
    {
      day: 10,
      customer: "Siti Nurhaliza",
      phone: "081234567899",
      rate: 1300000,
      fuel: 220000,
      driverFee: 250000,
      armadaIdx: 4,
      driverIdx: 0,
      packageId: fullDayPackage?.id,
      status: "DOWN_PAYMENT",
    },
    {
      day: 12,
      customer: "Bambang Wijaya",
      phone: "081345678901",
      rate: 950000,
      fuel: 170000,
      driverFee: 200000,
      armadaIdx: 0,
      driverIdx: 1,
      packageId: null,
    },
    {
      day: 15,
      customer: "PT. Sukses Bersama",
      phone: "021-99998888",
      rate: 1100000,
      fuel: 190000,
      driverFee: 250000,
      armadaIdx: 6,
      driverIdx: 2,
      packageId: fullDayPackage?.id,
    },
    {
      day: 18,
      customer: "Agus Salim",
      phone: "081456789012",
      rate: 920000,
      fuel: 165000,
      driverFee: 200000,
      armadaIdx: 1,
      driverIdx: 3,
      packageId: carRentalPackage?.id,
    },
    {
      day: 20,
      customer: "Linda Kusuma",
      phone: "081567890123",
      rate: 800000,
      fuel: 140000,
      driverFee: 200000,
      armadaIdx: 2,
      driverIdx: 0,
      packageId: null,
    },
    {
      day: 22,
      customer: "CV. Mitra Usaha",
      phone: "021-44443333",
      rate: 1250000,
      fuel: 210000,
      driverFee: 250000,
      armadaIdx: 4,
      driverIdx: 1,
      packageId: fullDayPackage?.id,
    },
    {
      day: 25,
      customer: "Hendra Gunawan",
      phone: "081678901234",
      rate: 980000,
      fuel: 175000,
      driverFee: 200000,
      armadaIdx: 0,
      driverIdx: 2,
      packageId: carRentalPackage?.id,
      status: "UNPAID",
    },
    {
      day: 27,
      customer: "Yuni Astuti",
      phone: "081789012345",
      rate: 1150000,
      fuel: 195000,
      driverFee: 250000,
      armadaIdx: 6,
      driverIdx: 3,
      packageId: null,
    },
  ];

  for (let i = 0; i < novemberTransactions.length; i++) {
    const tx = novemberTransactions[i];
    await prisma.transaction.create({
      data: {
        invoice_code: `INV-2025-11-${String(i + 1).padStart(3, "0")}`,
        customer_name: tx.customer,
        customer_phone: tx.phone,
        booking_date: new Date(2025, 10, tx.day),
        checkout_datetime: new Date(2025, 10, tx.day, 8, 0),
        checkin_datetime: new Date(2025, 10, tx.day, 20, 0),
        all_in_rate: tx.rate,
        overtime_rate_per_hour: 75000,
        payment_status: tx.status || "PAID",
        armadaId: armadas[tx.armadaIdx].id,
        driverId: drivers[tx.driverIdx].id,
        packageId: tx.packageId,
      },
    });
  }

  // Create transactions for October 2025
  console.log("Creating transactions for October 2025...");
  const octoberTransactions = [
    {
      day: 3,
      customer: "PT. Global Mandiri",
      phone: "021-11112222",
      rate: 880000,
      fuel: 155000,
      driverFee: 200000,
      armadaIdx: 0,
      driverIdx: 0,
      packageId: carRentalPackage?.id,
    },
    {
      day: 7,
      customer: "Maria Angelina",
      phone: "081223344556",
      rate: 1180000,
      fuel: 205000,
      driverFee: 250000,
      armadaIdx: 3,
      driverIdx: 1,
      packageId: fullDayPackage?.id,
    },
    {
      day: 10,
      customer: "Tono Sugiarto",
      phone: "081334455667",
      rate: 870000,
      fuel: 160000,
      driverFee: 200000,
      armadaIdx: 1,
      driverIdx: 2,
      packageId: null,
    },
    {
      day: 13,
      customer: "CV. Karya Bersama",
      phone: "021-22223333",
      rate: 1050000,
      fuel: 185000,
      driverFee: 250000,
      armadaIdx: 6,
      driverIdx: 3,
      packageId: fullDayPackage?.id,
    },
    {
      day: 16,
      customer: "Rina Susanti",
      phone: "081445566778",
      rate: 950000,
      fuel: 170000,
      driverFee: 200000,
      armadaIdx: 2,
      driverIdx: 0,
      packageId: carRentalPackage?.id,
    },
    {
      day: 20,
      customer: "PT. Jaya Abadi",
      phone: "021-33334444",
      rate: 1100000,
      fuel: 190000,
      driverFee: 250000,
      armadaIdx: 4,
      driverIdx: 1,
      packageId: fullDayPackage?.id,
    },
    {
      day: 23,
      customer: "Dian Sastro",
      phone: "081556677889",
      rate: 890000,
      fuel: 165000,
      driverFee: 200000,
      armadaIdx: 0,
      driverIdx: 2,
      packageId: null,
    },
    {
      day: 27,
      customer: "Indra Wijaya",
      phone: "081667788990",
      rate: 1200000,
      fuel: 200000,
      driverFee: 250000,
      armadaIdx: 6,
      driverIdx: 3,
      packageId: fullDayPackage?.id,
    },
  ];

  for (let i = 0; i < octoberTransactions.length; i++) {
    const tx = octoberTransactions[i];
    await prisma.transaction.create({
      data: {
        invoice_code: `INV-2025-10-${String(i + 1).padStart(3, "0")}`,
        customer_name: tx.customer,
        customer_phone: tx.phone,
        booking_date: new Date(2025, 9, tx.day),
        checkout_datetime: new Date(2025, 9, tx.day, 8, 0),
        checkin_datetime: new Date(2025, 9, tx.day, 20, 0),
        all_in_rate: tx.rate,
        overtime_rate_per_hour: 75000,
        payment_status: "PAID",
        armadaId: armadas[tx.armadaIdx].id,
        driverId: drivers[tx.driverIdx].id,
        packageId: tx.packageId,
      },
    });
  }

  // Create transactions for September 2025
  console.log("Creating transactions for September 2025...");
  const septemberTransactions = [
    {
      day: 5,
      customer: "PT. Nusantara Jaya",
      phone: "021-55556666",
      rate: 920000,
      fuel: 160000,
      driverFee: 200000,
      armadaIdx: 0,
      driverIdx: 0,
      packageId: carRentalPackage?.id,
    },
    {
      day: 10,
      customer: "Wati Suryani",
      phone: "081778899001",
      rate: 1150000,
      fuel: 195000,
      driverFee: 250000,
      armadaIdx: 6,
      driverIdx: 1,
      packageId: fullDayPackage?.id,
    },
    {
      day: 15,
      customer: "Eko Prabowo",
      phone: "081889900112",
      rate: 1000000,
      fuel: 175000,
      driverFee: 200000,
      armadaIdx: 2,
      driverIdx: 2,
      packageId: null,
    },
    {
      day: 20,
      customer: "CV. Harapan Jaya",
      phone: "021-66667777",
      rate: 1100000,
      fuel: 190000,
      driverFee: 250000,
      armadaIdx: 3,
      driverIdx: 3,
      packageId: fullDayPackage?.id,
    },
    {
      day: 25,
      customer: "Sari Dewi",
      phone: "081990011223",
      rate: 960000,
      fuel: 170000,
      driverFee: 200000,
      armadaIdx: 4,
      driverIdx: 0,
      packageId: carRentalPackage?.id,
    },
  ];

  for (let i = 0; i < septemberTransactions.length; i++) {
    const tx = septemberTransactions[i];
    await prisma.transaction.create({
      data: {
        invoice_code: `INV-2025-09-${String(i + 1).padStart(3, "0")}`,
        customer_name: tx.customer,
        customer_phone: tx.phone,
        booking_date: new Date(2025, 8, tx.day),
        checkout_datetime: new Date(2025, 8, tx.day, 8, 0),
        checkin_datetime: new Date(2025, 8, tx.day, 20, 0),
        all_in_rate: tx.rate,
        overtime_rate_per_hour: 75000,
        payment_status: "PAID",
        armadaId: armadas[tx.armadaIdx].id,
        driverId: drivers[tx.driverIdx].id,
        packageId: tx.packageId,
      },
    });
  }

  console.log("Transaction seeding completed!");

  // Log counts for verification
  try {
    const counts = {
      servicePackages: await prisma.servicePackage.count(),
      hotelTiers: await prisma.hotelTier.count(),
      hotels: await prisma.hotel.count(),
      hotelPriceRanges: await prisma.hotelPriceRange.count(),
      itineraryDays: await prisma.itineraryDay.count(),
      armadas: await prisma.armada.count(),
      drivers: await prisma.driver.count(),
      transactions: await prisma.transaction.count(),
      expenses: await prisma.expense.count(),
    };
    console.log("Counts after seed:", counts);

    const packages = await prisma.servicePackage.findMany({
      include: {
        hotelTiers: { include: { hotels: true, priceRanges: true } },
        itineraries: true,
      },
      take: 5,
    });
    console.log("Sample packages:", JSON.stringify(packages, null, 2));

    const armadas = await prisma.armada.findMany({ take: 5 });
    const drivers = await prisma.driver.findMany({ take: 5 });
    console.log("Sample armadas:", JSON.stringify(armadas, null, 2));
    console.log("Sample drivers:", JSON.stringify(drivers, null, 2));
  } catch (e) {
    console.warn(
      "Failed to read back counts or sample packages:",
      e.message || e
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
