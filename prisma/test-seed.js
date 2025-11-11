const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding for test environment...');

  // Upsert the admin user to ensure it exists for tests
  const hashedPassword = await bcrypt.hash('password123', 10);
  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {
        password: hashedPassword,
        isActive: true,
    },
    create: {
      email: 'admin@example.com',
      username: 'admin',
      password: hashedPassword,
      name: 'Admin User',
      role: 'ADMIN',
      isActive: true,
    },
  });

  console.log(`Ensured admin user exists: ${adminUser.username}`);

  console.log('Test seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
