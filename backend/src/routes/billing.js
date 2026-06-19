const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get user invoices
router.get('/invoices', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where: { userId: req.user.id },
        include: { subscription: { include: { plan: true } } },
        orderBy: { createdAt: 'desc' },
        skip: parseInt(skip),
        take: parseInt(limit),
      }),
      prisma.invoice.count({ where: { userId: req.user.id } }),
    ]);

    res.json({ invoices, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch invoices' });
  }
});

// Get single invoice
router.get('/invoices/:id', authenticate, async (req, res) => {
  try {
    const invoice = await prisma.invoice.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: {
        user: { select: { email: true, name: true } },
        subscription: { include: { plan: true } },
      },
    });
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch invoice' });
  }
});

// Get billing summary
router.get('/summary', authenticate, async (req, res) => {
  try {
    const [subscription, invoices] = await Promise.all([
      prisma.subscription.findUnique({
        where: { userId: req.user.id },
        include: { plan: true },
      }),
      prisma.invoice.findMany({
        where: { userId: req.user.id, status: 'PAID' },
        select: { amount: true, paidAt: true },
      }),
    ]);

    const totalPaid = invoices.reduce((sum, inv) => sum + inv.amount, 0);
    const thisMonthPaid = invoices
      .filter(inv => {
        const invDate = new Date(inv.paidAt);
        const now = new Date();
        return invDate.getMonth() === now.getMonth() && invDate.getFullYear() === now.getFullYear();
      })
      .reduce((sum, inv) => sum + inv.amount, 0);

    res.json({
      subscription,
      billing: {
        totalPaid,
        thisMonthPaid,
        totalInvoices: invoices.length,
        nextBillingDate: subscription?.currentPeriodEnd,
        nextBillingAmount: subscription?.plan?.price,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch billing summary' });
  }
});

// Admin: Get all invoices
router.get('/admin/all', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (page - 1) * limit;
    const where = status ? { status } : {};

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          user: { select: { id: true, email: true, name: true } },
          subscription: { include: { plan: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: parseInt(skip),
        take: parseInt(limit),
      }),
      prisma.invoice.count({ where }),
    ]);

    res.json({ invoices, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch invoices' });
  }
});

// Record usage
router.post('/usage', authenticate, async (req, res) => {
  try {
    const { metric, value } = req.body;

    const log = await prisma.usageLog.create({
      data: { userId: req.user.id, metric, value },
    });

    res.status(201).json(log);
  } catch (error) {
    res.status(500).json({ message: 'Failed to record usage' });
  }
});

// Get usage for current user
router.get('/usage', authenticate, async (req, res) => {
  try {
    const { metric, startDate, endDate } = req.query;

    const where = {
      userId: req.user.id,
      ...(metric && { metric }),
      ...(startDate && { recordedAt: { gte: new Date(startDate) } }),
      ...(endDate && { recordedAt: { ...((startDate && { gte: new Date(startDate) }) || {}), lte: new Date(endDate) } }),
    };

    const usage = await prisma.usageLog.findMany({
      where,
      orderBy: { recordedAt: 'desc' },
      take: 100,
    });

    res.json(usage);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch usage' });
  }
});

module.exports = router;
