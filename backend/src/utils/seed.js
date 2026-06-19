const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('Admin@123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@saasplatform.com' },
    update: {},
    create: {
      email: 'admin@saasplatform.com',
      password: adminPassword,
      name: 'Super Admin',
      role: 'SUPER_ADMIN',
    },
  });

  // Create test user
  const userPassword = await bcrypt.hash('User@1234', 12);
  const user = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      password: userPassword,
      name: 'Test User',
      role: 'USER',
    },
  });

  // Create subscription plans
  const starterPlan = await prisma.plan.upsert({
    where: { name: 'Starter' },
    update: {},
    create: {
      name: 'Starter',
      description: 'Perfect for individuals and small teams getting started.',
      price: 9.99,
      currency: 'usd',
      interval: 'MONTHLY',
      features: {
        apiCalls: 1000,
        storage: 5,
        users: 1,
        support: 'email',
        analytics: false,
        customDomain: false,
      },
      maxUsers: 1,
      maxStorage: 5,
      maxApiCalls: 1000,
    },
  });

  const proPlan = await prisma.plan.upsert({
    where: { name: 'Professional' },
    update: {},
    create: {
      name: 'Professional',
      description: 'For growing businesses that need more power and flexibility.',
      price: 29.99,
      currency: 'usd',
      interval: 'MONTHLY',
      features: {
        apiCalls: 10000,
        storage: 50,
        users: 10,
        support: 'priority',
        analytics: true,
        customDomain: true,
      },
      maxUsers: 10,
      maxStorage: 50,
      maxApiCalls: 10000,
    },
  });

  const enterprisePlan = await prisma.plan.upsert({
    where: { name: 'Enterprise' },
    update: {},
    create: {
      name: 'Enterprise',
      description: 'For large organizations with advanced needs and compliance requirements.',
      price: 99.99,
      currency: 'usd',
      interval: 'MONTHLY',
      features: {
        apiCalls: -1,
        storage: -1,
        users: -1,
        support: 'dedicated',
        analytics: true,
        customDomain: true,
        sla: '99.9%',
        sso: true,
      },
      maxUsers: null,
      maxStorage: null,
      maxApiCalls: null,
    },
  });

  // Create test subscription for user
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  const subscription = await prisma.subscription.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      planId: proPlan.id,
      status: 'ACTIVE',
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
    },
  });

  // Create sample invoices
  for (let i = 5; i >= 0; i--) {
    const invoiceDate = new Date();
    invoiceDate.setMonth(invoiceDate.getMonth() - i);
    await prisma.invoice.create({
      data: {
        userId: user.id,
        subscriptionId: subscription.id,
        amount: 29.99,
        currency: 'usd',
        status: 'PAID',
        dueDate: invoiceDate,
        paidAt: invoiceDate,
        description: 'Monthly subscription - Professional Plan',
      },
    });
  }

  // Create sample usage logs
  const metrics = ['api_calls', 'storage_gb', 'active_users'];
  for (const metric of metrics) {
    for (let i = 0; i < 10; i++) {
      await prisma.usageLog.create({
        data: {
          userId: user.id,
          metric,
          value: Math.random() * 100,
        },
      });
    }
  }

  console.log('✅ Seeding complete!');
  console.log('');
  console.log('Admin credentials:');
  console.log('  Email: admin@saasplatform.com');
  console.log('  Password: Admin@123');
  console.log('');
  console.log('User credentials:');
  console.log('  Email: user@example.com');
  console.log('  Password: User@1234');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
