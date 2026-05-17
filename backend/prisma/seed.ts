import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL,
    },
  },
});

async function main() {
  const passwordHash = await bcrypt.hash('FredAdmin1234$', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'agindotanfamily@gmail.com' },
    update: {},
    create: {
      name: 'Fredviv Admin',
      email: 'agindotanfamily@gmail.com',
      passwordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });

  console.log('Admin user created:', admin.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
