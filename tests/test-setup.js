const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function ensureTestData() {
  const armada = await prisma.armada.upsert({
    where: { license_plate: "B 1234 TST" },
    update: {},
    create: {
      license_plate: "B 1234 TST",
      brand: "Test Armada Brand",
      model: "Test Armada Model",
    },
  });

  // Driver doesn't have unique phone_number, so find or create
  let driver = await prisma.driver.findFirst({
    where: { phone_number: "089988776655" },
  });

  if (!driver) {
    driver = await prisma.driver.create({
      data: {
        driver_name: "Test Driver",
        phone_number: "089988776655",
      },
    });
  }

  return { armada, driver };
}

async function createTransactionForTest() {
  const { armada, driver } = await ensureTestData();

  const transaction = await prisma.transaction.create({
    data: {
      invoice_code: `INV-${Date.now()}`,
      customer_name: "Laporan Customer",
      customer_phone: "081234567891",
      booking_date: new Date(),
      checkout_datetime: new Date(),
      checkin_datetime: new Date(new Date().getTime() + 24 * 60 * 60 * 1000), // 1 day later
      all_in_rate: 600000,
      overtime_rate_per_hour: 50000,
      payment_status: "UNPAID",
      armadaId: armada.id,
      driverId: driver.id,
    },
  });
  return transaction;
}

module.exports = { ensureTestData, createTransactionForTest };
