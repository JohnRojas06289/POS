import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('🌱 Seeding database...');

  // Create plans
  const plans = await Promise.all([
    prisma.plan.upsert({
      where: { slug: 'lite' },
      update: {},
      create: {
        name: 'Lite',
        slug: 'lite',
        price: 149,
        billingCycle: 'lifetime',
        maxBranches: 1,
        maxUsers: 3,
        features: { offline: true, dian: false, ai: false, erp: false },
      },
    }),
    prisma.plan.upsert({
      where: { slug: 'starter' },
      update: {},
      create: {
        name: 'Starter',
        slug: 'starter',
        price: 19,
        billingCycle: 'monthly',
        maxBranches: 1,
        maxUsers: 5,
        features: { offline: true, dian: true, ai: false, erp: false },
      },
    }),
    prisma.plan.upsert({
      where: { slug: 'pro' },
      update: {},
      create: {
        name: 'Pro',
        slug: 'pro',
        price: 39,
        billingCycle: 'monthly',
        maxBranches: -1,
        maxUsers: -1,
        features: { offline: true, dian: true, ai: true, erp: true, aiCredits: 500 },
      },
    }),
    prisma.plan.upsert({
      where: { slug: 'enterprise' },
      update: {},
      create: {
        name: 'Enterprise',
        slug: 'enterprise',
        price: 89,
        billingCycle: 'monthly',
        maxBranches: -1,
        maxUsers: -1,
        features: { offline: true, dian: true, ai: true, erp: true, api: true, sla: '4h' },
      },
    }),
  ]);

  console.log(`✅ Created ${plans.length} plans`);

  // Create business templates
  const templates = await Promise.all([
    prisma.businessTemplate.upsert({
      where: { slug: 'retail_clothing' },
      update: {},
      create: {
        slug: 'retail_clothing',
        name: 'Retail / Ropa',
        description: 'Tienda de ropa con tallas y colores',
        config: {
          modules: ['pos', 'inventory', 'customers'],
          productAttributes: ['size', 'color'],
          taxRate: 0.19,
          paymentMethods: ['cash', 'card', 'transfer'],
        },
      },
    }),
    prisma.businessTemplate.upsert({
      where: { slug: 'restaurant' },
      update: {},
      create: {
        slug: 'restaurant',
        name: 'Restaurante',
        description: 'Restaurante con mesas y combos',
        config: {
          modules: ['pos', 'inventory', 'cash'],
          productAttributes: ['size', 'extras'],
          taxRate: 0.08,
          paymentMethods: ['cash', 'card'],
        },
      },
    }),
    prisma.businessTemplate.upsert({
      where: { slug: 'grocery' },
      update: {},
      create: {
        slug: 'grocery',
        name: 'Supermercado / Abarrotes',
        description: 'Tienda de víveres y abarrotes',
        config: {
          modules: ['pos', 'inventory', 'suppliers', 'customers'],
          productAttributes: ['weight', 'expiry'],
          taxRate: 0,
          paymentMethods: ['cash', 'card', 'transfer'],
        },
      },
    }),
    prisma.businessTemplate.upsert({
      where: { slug: 'services' },
      update: {},
      create: {
        slug: 'services',
        name: 'Servicios',
        description: 'Empresa de servicios y consultoría',
        config: {
          modules: ['pos', 'customers', 'billing'],
          productAttributes: [],
          taxRate: 0.19,
          paymentMethods: ['cash', 'card', 'transfer', 'credit'],
        },
      },
    }),
  ]);

  console.log(`✅ Created ${templates.length} business templates`);

  // Create demo tenant
  const demoTenant = await prisma.tenant.upsert({
    where: { slug: 'demo' },
    update: {},
    create: {
      name: 'Demo Store',
      slug: 'demo',
      schemaName: 'tenant_demo',
      email: 'demo@nexus.com',
      country: 'CO',
      timezone: 'America/Bogota',
      currency: 'COP',
      businessType: 'retail_clothing',
    },
  });

  const starterPlan = plans.find((p) => p.slug === 'starter')!;
  await prisma.subscription.upsert({
    where: { id: `demo-subscription` },
    update: {},
    create: {
      id: 'demo-subscription',
      tenantId: demoTenant.id,
      planId: starterPlan.id,
      status: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  console.log(`✅ Created demo tenant: ${demoTenant.schemaName}`);
  console.log('\n🎉 Seed completed!');
  console.log('Demo credentials: demo@nexus.com / demo1234');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
