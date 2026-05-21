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

  // ─── Business Templates ────────────────────────────────────────────────────
  const templateData = [
    {
      slug: 'retail_clothing',
      name: 'Tienda de Ropa / Boutique',
      description: 'Para almacenes de ropa, calzado y accesorios. Gestiona tallas, colores y variantes de producto con facilidad.',
      config: {
        icon: '🛍️',
        posMode: 'retail',
        variantAttributes: ['talla', 'color'],
        defaultSizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL'],
        weightBased: false,
        defaultTaxRate: 0,
        paymentMethods: ['cash', 'nequi', 'daviplata', 'card'],
        modules: ['pos', 'inventory', 'customers', 'returns'],
        categories: [
          { name: 'Camisas y Blusas', taxRate: 0 },
          { name: 'Pantalones y Jeans', taxRate: 0 },
          { name: 'Vestidos y Faldas', taxRate: 0 },
          { name: 'Calzado', taxRate: 0 },
          { name: 'Accesorios', taxRate: 0 },
          { name: 'Ropa Interior', taxRate: 0 },
          { name: 'Deportiva', taxRate: 0 },
          { name: 'Abrigos y Chaquetas', taxRate: 0 },
        ],
        features: [
          'Variantes de talla (XS → 3XL) y color por producto',
          'Categorías preconfiguradas: Camisas, Pantalones, Vestidos, Calzado...',
          'IVA 0% en ropa básica (exenta en Colombia)',
          'Fidelización de clientes y manejo de crédito',
          'Control de devoluciones e intercambios',
          'Pagos: efectivo, Nequi, Daviplata, tarjeta',
        ],
      },
    },
    {
      slug: 'grocery',
      name: 'Supermercado / Tienda de Abarrotes',
      description: 'Para tiendas de barrio, minimercados y supermercados. Venta por peso, escáner de barras y control de stock masivo.',
      config: {
        icon: '🛒',
        posMode: 'grocery',
        variantAttributes: [],
        defaultSizes: [],
        weightBased: true,
        weightUnits: ['kg', 'g', 'lb', 'unidad', 'litro'],
        defaultTaxRate: 0,
        paymentMethods: ['cash', 'nequi', 'daviplata', 'card'],
        modules: ['pos', 'inventory', 'suppliers', 'customers'],
        categories: [
          { name: 'Frutas y Verduras', taxRate: 0 },
          { name: 'Carnes y Pescados', taxRate: 0 },
          { name: 'Lácteos y Huevos', taxRate: 0 },
          { name: 'Granos y Cereales', taxRate: 0 },
          { name: 'Panadería', taxRate: 0 },
          { name: 'Bebidas', taxRate: 0.19 },
          { name: 'Aseo del Hogar', taxRate: 0.19 },
          { name: 'Snacks y Dulces', taxRate: 0.19 },
        ],
        features: [
          'Venta por peso (kg, gramos, libras) y por unidad',
          'Escáner de código de barras como método principal',
          'IVA mixto: 0% alimentos básicos, 19% procesados y bebidas',
          'Categorías preconfiguradas: Frutas, Carnes, Lácteos, Granos...',
          'Control de stock mínimo y alertas de bajo inventario',
          'Gestión de múltiples proveedores',
        ],
      },
    },
    {
      slug: 'restaurant',
      name: 'Restaurante / Cafetería',
      description: 'Para restaurantes, cafeterías, sodas y negocios de comida. Gestión de mesas, combos y comandas.',
      config: {
        icon: '🍽️',
        posMode: 'restaurant',
        variantAttributes: [],
        defaultSizes: [],
        weightBased: false,
        defaultTaxRate: 0.19,
        paymentMethods: ['cash', 'nequi', 'daviplata', 'card'],
        modules: ['pos', 'inventory', 'tables', 'kitchen'],
        categories: [
          { name: 'Entradas', taxRate: 0.19 },
          { name: 'Platos Fuertes', taxRate: 0.19 },
          { name: 'Sopas y Caldos', taxRate: 0.19 },
          { name: 'Vegetariano / Vegano', taxRate: 0.19 },
          { name: 'Bebidas Frías', taxRate: 0.19 },
          { name: 'Bebidas Calientes', taxRate: 0.19 },
          { name: 'Postres', taxRate: 0.19 },
          { name: 'Combos del Día', taxRate: 0.19 },
        ],
        features: [
          'Gestión de mesas y asignación de comandas',
          'Categorías: Entradas, Platos Fuertes, Bebidas, Postres, Combos',
          'IVA 19% en servicios de alimentación',
          'Pantalla de cocina (KDS) para preparación',
          'Cierre de caja diario y cuadre de turnos',
          'Combos y platos del día con precio especial',
        ],
      },
    },
    {
      slug: 'pharmacy',
      name: 'Farmacia / Droguería',
      description: 'Para droguerías, farmacias y tiendas de salud. Control de vencimientos, registro INVIMA y categorías de medicamentos.',
      config: {
        icon: '💊',
        posMode: 'retail',
        variantAttributes: ['presentación'],
        defaultSizes: [],
        weightBased: false,
        defaultTaxRate: 0,
        paymentMethods: ['cash', 'nequi', 'daviplata', 'card'],
        modules: ['pos', 'inventory', 'customers', 'expiry'],
        categories: [
          { name: 'Medicamentos Genéricos', taxRate: 0 },
          { name: 'Medicamentos de Marca', taxRate: 0 },
          { name: 'Vitaminas y Suplementos', taxRate: 0 },
          { name: 'Cosméticos y Cuidado Personal', taxRate: 0.19 },
          { name: 'Dispositivos Médicos', taxRate: 0 },
          { name: 'Bebés y Maternidad', taxRate: 0 },
          { name: 'Naturales y Homeopáticos', taxRate: 0 },
        ],
        features: [
          'Control de fechas de vencimiento con alertas automáticas',
          'Atributo de presentación (tabletas, jarabe, cápsulas, crema...)',
          'IVA 0% medicamentos, 19% cosméticos y cuidado personal',
          'Categorías: Genéricos, Marca, Vitaminas, Cosméticos...',
          'Historial de compras por cliente (fórmulas frecuentes)',
          'Registro de laboratorio fabricante por producto',
        ],
      },
    },
    {
      slug: 'hardware_store',
      name: 'Ferretería / Materiales',
      description: 'Para ferreterías, depósitos de materiales y tiendas de construcción. Unidades mixtas y control de bodega.',
      config: {
        icon: '🔩',
        posMode: 'retail',
        variantAttributes: ['medida', 'material'],
        defaultSizes: [],
        weightBased: false,
        weightUnits: ['unidad', 'metro', 'm²', 'litro', 'galón', 'caja', 'rollo', 'bulto'],
        defaultTaxRate: 0.19,
        paymentMethods: ['cash', 'nequi', 'daviplata', 'card', 'credit'],
        modules: ['pos', 'inventory', 'suppliers', 'purchases'],
        categories: [
          { name: 'Eléctrico', taxRate: 0.19 },
          { name: 'Plomería', taxRate: 0.19 },
          { name: 'Herramientas', taxRate: 0.19 },
          { name: 'Pintura y Acabados', taxRate: 0.19 },
          { name: 'Construcción y Cemento', taxRate: 0.19 },
          { name: 'Cerrajería y Seguridad', taxRate: 0.19 },
          { name: 'Jardín y Exterior', taxRate: 0.19 },
          { name: 'Tornillería y Fijaciones', taxRate: 0.19 },
        ],
        features: [
          'Unidades mixtas: metro, m², litro, galón, caja, rollo, bulto',
          'Variantes por medida y material por producto',
          'IVA 19% en todos los productos',
          'Categorías: Eléctrico, Plomería, Herramientas, Pintura...',
          'Órdenes de compra a proveedores',
          'Crédito a clientes frecuentes (constructoras, maestros)',
        ],
      },
    },
    {
      slug: 'beauty_salon',
      name: 'Salón de Belleza / Spa',
      description: 'Para salones, barberías, spas y centros de estética. Combina servicios y productos con asignación de estilista.',
      config: {
        icon: '💅',
        posMode: 'services',
        variantAttributes: [],
        defaultSizes: [],
        weightBased: false,
        defaultTaxRate: 0.19,
        paymentMethods: ['cash', 'nequi', 'daviplata', 'card'],
        modules: ['pos', 'inventory', 'customers', 'employees', 'appointments'],
        categories: [
          { name: 'Cortes y Peinados', taxRate: 0.19 },
          { name: 'Colorimetría y Tintes', taxRate: 0.19 },
          { name: 'Tratamientos Capilares', taxRate: 0.19 },
          { name: 'Manicure y Pedicure', taxRate: 0.19 },
          { name: 'Depilación', taxRate: 0.19 },
          { name: 'Faciales y Estética', taxRate: 0.19 },
          { name: 'Productos para Reventa', taxRate: 0.19 },
        ],
        features: [
          'Mezcla de servicios (con duración) y productos para reventa',
          'Asignación de cada servicio a un estilista o empleado',
          'Comisiones automáticas por empleado sobre ventas',
          'Historial completo de servicios por cliente',
          'Categorías: Cortes, Colorimetría, Manicure, Faciales...',
          'IVA 19% en servicios y productos de belleza',
        ],
      },
    },
    {
      slug: 'stationery',
      name: 'Papelería / Miscelánea',
      description: 'Para papelerías, misceláneas, licorerías y tiendas de variedades. Amplio catálogo con IVA diferenciado.',
      config: {
        icon: '📚',
        posMode: 'retail',
        variantAttributes: ['tamaño', 'color'],
        defaultSizes: [],
        weightBased: false,
        defaultTaxRate: 0.19,
        paymentMethods: ['cash', 'nequi', 'daviplata'],
        modules: ['pos', 'inventory', 'customers'],
        categories: [
          { name: 'Útiles Escolares', taxRate: 0 },
          { name: 'Papelería de Oficina', taxRate: 0.19 },
          { name: 'Impresión y Copias', taxRate: 0.19 },
          { name: 'Tecnología y Accesorios', taxRate: 0.19 },
          { name: 'Regalos y Detalles', taxRate: 0.19 },
          { name: 'Juguetería', taxRate: 0.19 },
          { name: 'Licores y Cigarrillos', taxRate: 0.19 },
        ],
        features: [
          'Variantes por tamaño y color para cuadernos, carpetas, etc.',
          'IVA diferenciado: 0% útiles básicos, 19% tecnología y licores',
          'Categorías: Escolares, Oficina, Impresión, Tecnología, Regalos...',
          'Ideal para impresión y copias como servicio adicional',
          'Gestión de clientes frecuentes y descuentos por volumen',
          'Pagos: efectivo, Nequi y Daviplata',
        ],
      },
    },
  ];

  const templates = await Promise.all(
    templateData.map((t) =>
      prisma.businessTemplate.upsert({
        where: { slug: t.slug },
        update: { name: t.name, description: t.description, config: t.config },
        create: t,
      }),
    ),
  );

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
      attributes: { talla: 'S', color: 'Negro' },
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
      attributes: { talla: 'M', color: 'Blanco' },
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
      attributes: { talla: '32', color: 'Índigo' },
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
