const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding E2E test data...");

  // 1. Ensure Service Package exists
  const packageName = "Sewa Mobil 12 Jam";
  let pkg = await prisma.servicePackage.findFirst({
    where: { name: packageName },
  });

  if (!pkg) {
    console.log(`Creating package: ${packageName}`);
    pkg = await prisma.servicePackage.create({
      data: {
        name: packageName,
        type: "CAR_RENTAL",
        price: 500000,
        durationHours: 12,
        overtimeRate: 50000,
        includes: ["BBM", "Sopir"],
        excludes: ["Tol", "Parkir"],
      },
    });
  } else {
    console.log(`Package exists: ${packageName}`);
  }

  // 2. Ensure Armada exists and is READY
  const licensePlate = "B 1234 ABC";
  let armada = await prisma.armada.findUnique({
    where: { license_plate: licensePlate },
  });

  if (!armada) {
    console.log(`Creating armada: ${licensePlate}`);
    armada = await prisma.armada.create({
      data: {
        license_plate: licensePlate,
        brand: "Toyota",
        model: "Innova Reborn",
        status: "READY",
      },
    });
  } else {
    console.log(`Armada exists: ${licensePlate}`);
    if (armada.status !== "READY") {
      console.log(`Updating armada status to READY`);
      armada = await prisma.armada.update({
        where: { id: armada.id },
        data: { status: "READY" },
      });
    }
  }

  // 3. Ensure Driver exists and is READY
  const driverName = "Budi Santoso";
  let driver = await prisma.driver.findFirst({
    where: { driver_name: driverName },
  });

  if (!driver) {
    console.log(`Creating driver: ${driverName}`);
    driver = await prisma.driver.create({
      data: {
        driver_name: driverName,
        phone_number: "08129876543",
        status: "READY",
      },
    });
  } else {
    console.log(`Driver exists: ${driverName}`);
    if (driver.status !== "READY" || driver.phone_number !== "08129876543") {
      console.log(`Updating driver status/phone`);
      driver = await prisma.driver.update({
        where: { id: driver.id },
        data: { 
          status: "READY",
          phone_number: "08129876543"
        },
      });
    }
  }

  console.log("✅ E2E Data Seeding Completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
