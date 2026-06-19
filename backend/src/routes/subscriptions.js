const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireRole } = require('../middleware/auth');
const stripeService = require('../services/stripe');

const router = express.Router();
const prisma = new PrismaClient();

// Get current user's subscription
router.get('/my', authenticate, async (req, res) => {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { userId: req.user.id },
      include: { plan: true },
    });
    res.json(subscription);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch subscription' });
  }
});

// Subscribe to a plan
router.post('/subscribe', authenticate, async (req, res) => {
  try {
    const { planId, paymentMethodId } = req.body;

    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan || !plan.isActive) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    const existingSubscription = await prisma.subscription.findUnique({
      where: { userId: req.user.id },
    });

    if (existingSubscription && existingSubscription.status === 'ACTIVE') {
      return res.status(409).json({ message: 'Already have an active subscription. Use upgrade endpoint.' });
    }

    // Create or get Stripe customer
    let user = await prisma.user.findUnique({ where: { id: req.user.id } });
    let stripeCustomerId = user.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await stripeService.createCustomer(user.email, user.name);
      stripeCustomerId = customer.id;
      await prisma.user.update({
        where: { id: req.user.id },
        data: { stripeCustomerId },
      });
    }

    // Attach payment method and create subscription
    if (paymentMethodId) {
      await stripeService.attachPaymentMethod(paymentMethodId, stripeCustomerId);
    }

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + (plan.interval === 'YEARLY' ? 12 : 1));

    const subscription = await prisma.subscription.upsert({
      where: { userId: req.user.id },
      create: {
        userId: req.user.id,
        planId,
        status: 'ACTIVE',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
      update: {
        planId,
        status: 'ACTIVE',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
      },
      include: { plan: true },
    });

    // Create invoice record
    await prisma.invoice.create({
      data: {
        userId: req.user.id,
        subscriptionId: subscription.id,
        amount: plan.price,
        currency: plan.currency,
        status: 'PAID',
        dueDate: now,
        paidAt: now,
        description: `Subscription to ${plan.name} plan`,
      },
    });

    res.status(201).json({ subscription, message: 'Subscribed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create subscription' });
  }
});

// Upgrade/downgrade subscription
router.put('/upgrade', authenticate, async (req, res) => {
  try {
    const { planId } = req.body;

    const [plan, subscription] = await Promise.all([
      prisma.plan.findUnique({ where: { id: planId } }),
      prisma.subscription.findUnique({ where: { userId: req.user.id }, include: { plan: true } }),
    ]);

    if (!plan || !plan.isActive) {
      return res.status(404).json({ message: 'Plan not found' });
    }
    if (!subscription) {
      return res.status(404).json({ message: 'No active subscription found' });
    }

    const updated = await prisma.subscription.update({
      where: { userId: req.user.id },
      data: { planId },
      include: { plan: true },
    });

    res.json({ subscription: updated, message: `Plan changed to ${plan.name}` });
  } catch (error) {
    res.status(500).json({ message: 'Failed to upgrade subscription' });
  }
});

// Cancel subscription
router.post('/cancel', authenticate, async (req, res) => {
  try {
    const { immediately = false } = req.body;

    const subscription = await prisma.subscription.findUnique({
      where: { userId: req.user.id },
    });

    if (!subscription) {
      return res.status(404).json({ message: 'No subscription found' });
    }

    const updated = await prisma.subscription.update({
      where: { userId: req.user.id },
      data: {
        status: immediately ? 'CANCELLED' : subscription.status,
        cancelAtPeriodEnd: !immediately,
      },
      include: { plan: true },
    });

    res.json({
      subscription: updated,
      message: immediately
        ? 'Subscription cancelled immediately'
        : 'Subscription will be cancelled at the end of the billing period',
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to cancel subscription' });
  }
});

// Reactivate subscription
router.post('/reactivate', authenticate, async (req, res) => {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { userId: req.user.id },
    });

    if (!subscription) {
      return res.status(404).json({ message: 'No subscription found' });
    }

    const updated = await prisma.subscription.update({
      where: { userId: req.user.id },
      data: { status: 'ACTIVE', cancelAtPeriodEnd: false },
      include: { plan: true },
    });

    res.json({ subscription: updated, message: 'Subscription reactivated' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to reactivate subscription' });
  }
});

// Admin: Get all subscriptions
router.get('/', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (page - 1) * limit;

    const where = status ? { status } : {};

    const [subscriptions, total] = await Promise.all([
      prisma.subscription.findMany({
        where,
        include: { user: { select: { id: true, email: true, name: true } }, plan: true },
        orderBy: { createdAt: 'desc' },
        skip: parseInt(skip),
        take: parseInt(limit),
      }),
      prisma.subscription.count({ where }),
    ]);

    res.json({ subscriptions, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch subscriptions' });
  }
});

module.exports = router;
