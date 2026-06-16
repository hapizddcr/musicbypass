import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/password';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Plans
  const plans = [
    {
      name: 'Free',
      slug: 'free',
      description: 'Get started with the basics',
      priceMonthly: 0,
      priceYearly: 0,
      jobLimitDaily: 5,
      jobLimitMonthly: 50,
      features: {
        maxStorageGb: 1,
        formats: ['mp3', 'wav', 'ogg'],
        support: 'community',
      },
      isActive: true,
      sortOrder: 1,
    },
    {
      name: 'Starter',
      slug: 'starter',
      description: 'For creators and freelancers',
      priceMonthly: 99000,
      priceYearly: 990000,
      jobLimitDaily: null,
      jobLimitMonthly: 100,
      features: {
        maxStorageGb: 10,
        formats: ['mp3', 'wav', 'ogg', 'aac', 'flac'],
        support: 'email',
        priority: true,
      },
      isActive: true,
      sortOrder: 2,
    },
    {
      name: 'Pro',
      slug: 'pro',
      description: 'For teams and power users',
      priceMonthly: 299000,
      priceYearly: 2990000,
      jobLimitDaily: null,
      jobLimitMonthly: null,
      features: {
        maxStorageGb: 100,
        formats: ['mp3', 'wav', 'ogg', 'aac', 'flac'],
        support: 'priority',
        priority: true,
        api: true,
      },
      isActive: true,
      sortOrder: 3,
    },
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { slug: plan.slug },
      update: plan,
      create: plan,
    });
  }

  console.log(`✅ Seeded ${plans.length} plans`);

  // Create a super admin user
  const adminEmail = 'admin@audioforge.app';
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    const passwordHash = await hashPassword('Admin123456');
    await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'Admin',
        username: 'admin',
        passwordHash,
        role: 'SUPER_ADMIN',
        emailVerified: new Date(),
      },
    });
    console.log(`✅ Created super admin: ${adminEmail} / Admin123456`);
  }

  console.log('🎉 Seeding complete');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
