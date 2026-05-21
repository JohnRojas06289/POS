import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

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

  // Provision tenant_demo schema and demo user
  await prisma.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS "tenant_demo"`);
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "tenant_demo"."User" (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "branchId" UUID,
      email TEXT UNIQUE NOT NULL,
      "passwordHash" TEXT NOT NULL,
      pin TEXT,
      name TEXT NOT NULL DEFAULT '',
      role TEXT NOT NULL DEFAULT 'cashier',
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      "lastLoginAt" TIMESTAMPTZ,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
  const demoPasswordHash = await bcrypt.hash('demo1234', 12);
  await prisma.$executeRawUnsafe(
    `INSERT INTO "tenant_demo"."User" (id, email, "passwordHash", name, role, "isActive")
     VALUES (gen_random_uuid(), $1, $2, 'Demo Owner', 'owner', true)
     ON CONFLICT (email) DO NOTHING`,
    'demo@nexus.com',
    demoPasswordHash,
  );
  console.log('✅ Provisioned tenant_demo schema with demo user');

  // ─── Demo data in the static `tenant` schema (used by Prisma ORM) ───────────

  // Branch
  const branch = await prisma.branch.upsert({
    where: { id: 'aaaaaaaa-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: 'aaaaaaaa-0000-0000-0000-000000000001',
      name: 'Sede Principal',
      address: 'Calle 100 #15-20, Bogotá',
      phone: '601-555-0100',
      isActive: true,
    },
  });

  // Products & variants
  const shirt = await prisma.product.upsert({
    where: { sku: 'SHIRT-001' },
    update: {},
    create: {
      sku: 'SHIRT-001',
      name: 'Camiseta Básica',
      description: 'Camiseta de algodón 100%',
      unitCost: 25000,
      unitPrice: 59900,
      taxRate: 0,
      isActive: true,
      hasVariants: true,
    },
  });

  const shirtS = await prisma.productVariant.upsert({
    where: { sku: 'SHIRT-001-S-BLK' },
    update: {},
    create: {
      sku: 'SHIRT-001-S-BLK',
      productId: shirt.id,
      name: 'S / Negro',
      attributes: { size: 'S', color: 'Negro' },
      unitCost: 25000,
      unitPrice: 59900,
      stock: 24,
      minStock: 5,
    },
  });

  const shirtM = await prisma.productVariant.upsert({
    where: { sku: 'SHIRT-001-M-WHT' },
    update: {},
    create: {
      sku: 'SHIRT-001-M-WHT',
      productId: shirt.id,
      name: 'M / Blanco',
      attributes: { size: 'M', color: 'Blanco' },
      unitCost: 25000,
      unitPrice: 59900,
      stock: 18,
      minStock: 5,
    },
  });

  const jean = await prisma.product.upsert({
    where: { sku: 'JEAN-001' },
    update: {},
    create: {
      sku: 'JEAN-001',
      name: 'Jean Slim Fit',
      description: 'Jean de corte slim 98% algodón 2% elastano',
      unitCost: 45000,
      unitPrice: 119900,
      taxRate: 0,
      isActive: true,
      hasVariants: true,
    },
  });

  const jeanM = await prisma.productVariant.upsert({
    where: { sku: 'JEAN-001-32-IND' },
    update: {},
    create: {
      sku: 'JEAN-001-32-IND',
      productId: jean.id,
      name: '32 / Índigo',
      attributes: { size: '32', color: 'Índigo' },
      unitCost: 45000,
      unitPrice: 119900,
      stock: 12,
      minStock: 3,
    },
  });

  console.log('✅ Created demo products');

  // Customers
  const customer1 = await prisma.customer.upsert({
    where: { id: 'cccccccc-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: 'cccccccc-0000-0000-0000-000000000001',
      name: 'María García',
      email: 'maria@ejemplo.com',
      phone: '300-555-0001',
      documentType: 'CC',
      documentNum: '1023456789',
      creditLimit: 500000,
      creditBalance: 0,
      isActive: true,
    },
  });

  const customer2 = await prisma.customer.upsert({
    where: { id: 'cccccccc-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: 'cccccccc-0000-0000-0000-000000000002',
      name: 'Carlos Rodríguez',
      email: 'carlos@ejemplo.com',
      phone: '310-555-0002',
      documentType: 'CC',
      documentNum: '98765432',
      creditLimit: 300000,
      creditBalance: 89900,
      isActive: true,
    },
  });

  console.log('✅ Created demo customers');

  // Demo orders spread over the last 7 days
  const demoUserId = 'aaaaaaaa-0000-0000-0000-000000000099';
  const now = Date.now();

  const ordersData = [
    { id: 'eeeeeeee-0000-0000-0001', daysAgo: 0, variantId: shirtS.id, qty: 2, unitPrice: 59900, method: 'cash', customerId: customer1.id },
    { id: 'eeeeeeee-0000-0000-0002', daysAgo: 0, variantId: jeanM.id, qty: 1, unitPrice: 119900, method: 'card', customerId: null },
    { id: 'eeeeeeee-0000-0000-0003', daysAgo: 1, variantId: shirtM.id, qty: 3, unitPrice: 59900, method: 'cash', customerId: customer2.id },
    { id: 'eeeeeeee-0000-0000-0004', daysAgo: 1, variantId: jeanM.id, qty: 1, unitPrice: 119900, method: 'transfer', customerId: null },
    { id: 'eeeeeeee-0000-0000-0005', daysAgo: 2, variantId: shirtS.id, qty: 1, unitPrice: 59900, method: 'cash', customerId: customer1.id },
    { id: 'eeeeeeee-0000-0000-0006', daysAgo: 3, variantId: shirtM.id, qty: 2, unitPrice: 59900, method: 'card', customerId: null },
    { id: 'eeeeeeee-0000-0000-0007', daysAgo: 4, variantId: jeanM.id, qty: 2, unitPrice: 119900, method: 'cash', customerId: customer2.id },
    { id: 'eeeeeeee-0000-0000-0008', daysAgo: 5, variantId: shirtS.id, qty: 4, unitPrice: 59900, method: 'card', customerId: null },
    { id: 'eeeeeeee-0000-0000-0009', daysAgo: 6, variantId: jeanM.id, qty: 1, unitPrice: 119900, method: 'cash', customerId: customer1.id },
    { id: 'eeeeeeee-0000-0000-0010', daysAgo: 6, variantId: shirtM.id, qty: 2, unitPrice: 59900, method: 'transfer', customerId: null },
  ];

  for (const o of ordersData) {
    const total = o.qty * o.unitPrice;
    const createdAt = new Date(now - o.daysAgo * 86400000 - Math.random() * 28800000);
    await prisma.order.upsert({
      where: { id: o.id },
      update: {},
      create: {
        id: o.id,
        branchId: branch.id,
        cashierId: demoUserId,
        customerId: o.customerId,
        status: 'completed',
        subtotal: total,
        discountTotal: 0,
        taxTotal: 0,
        total,
        createdAt,
        updatedAt: createdAt,
        items: {
          create: [{
            variantId: o.variantId,
            quantity: o.qty,
            unitPrice: o.unitPrice,
            unitCost: o.unitPrice * 0.42,
            discount: 0,
            taxRate: 0,
            total,
          }],
        },
        payments: {
          create: [{ method: o.method, amount: total }],
        },
      },
    });
  }

  console.log('✅ Created demo orders (last 7 days)');

  console.log('\n🎉 Seed completed!');
  console.log('Demo credentials:');
  console.log('  Tenant email: demo@nexus.com');
  console.log('  User email:   demo@nexus.com');
  console.log('  Password:     demo1234');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
