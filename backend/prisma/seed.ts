import { PrismaClient, Role, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  // 1. Clean existing data (optional, use with caution)
  // await prisma.user.deleteMany();

  // 0. Create a Branch first (User needs a branchId, not a string)
  const branch = await prisma.branch.upsert({
    where: { id: 'vi-branch-001' },
    update: {},
    create: {
      id: 'vi-branch-001',
      name: 'Victoria Island',
      location: 'Lagos',
    },
  });
  console.log('Branch created');

  // 2. Create Admin User
  const adminEmail = 'agindotanfamily@gmail.com';
  const hashedPassword = await bcrypt.hash('Admin@2024', 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash: hashedPassword,
      name: 'Agindotan Emmanuel',
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
    },
  });

  console.log(` Admin user created/verified: ${admin.email}`);

  // 3. Create a sample Branch Manager
  const managerEmail = 'manager@fredvivoil.com';
  await prisma.user.upsert({
    where: { email: managerEmail },
    update: {},
    create: {
      email: managerEmail,
      passwordHash: hashedPassword,
      name: 'John Branch',
      role: Role.MANAGER,
      status: UserStatus.ACTIVE,
      branchId: branch.id,
    },
  });

  console.log('Sample manager created');
  console.log('Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
