const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// User's own analytics dashboard
router.get('/my', authenticate, async (req, res) => {
  try {
    const [subscription, invoices, usage] = await Promise.all([
      prisma.subscription.findUnique({
        where: { userId: req.user.id },
        include: { plan: true },
      }),
      prisma.invoice.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'asc' },
        take: 12,
      }),
      prisma.usageLog.groupBy({
        by: ['metric'],
        where: { userId: req.user.id },
        _sum: { value: true },
        _count: true,
      }),
    ]);

    const monthlySpend = invoices
      .filter(inv => inv.status === 'PAID')
      .map(inv => ({
        month: new Date(inv.createdAt).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        amount: inv.amount,
      }));

    res.json({
      subscription,
      monthlySpend,
      usageSummary: usage,
      totalSpent: invoices.filter(i => i.status === 'PAID').reduce((s, i) => s + i.amount, 0),
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch analytics' });
  }
});

// Admin: Platform-wide analytics
router.get('/admin/overview', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), async (req, res) => {
  try {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [
      totalUsers, newUsersThisMonth, newUsersLastMonth,
      activeSubscriptions, churnedThisMonth,
      totalRevenue, revenueThisMonth, revenueLastMonth,
      planDistribution, recentInvoices,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: thisMonthStart } } }),
      prisma.user.count({ where: { createdAt: { gte: lastMonthStart, lt: thisMonthStart } } }),
      prisma.subscription.count({ where: { status: 'ACTIVE' } }),
      prisma.subscription.count({ where: { status: 'CANCELLED', updatedAt: { gte: thisMonthStart } } }),
      prisma.invoice.aggregate({ where: { status: 'PAID' }, _sum: { amount: true } }),
      prisma.invoice.aggregate({ where: { status: 'PAID', paidAt: { gte: thisMonthStart } }, _sum: { amount: true } }),
      prisma.invoice.aggregate({ where: { status: 'PAID', paidAt: { gte: lastMonthStart, lt: thisMonthStart } }, _sum: { amount: true } }),
      prisma.subscription.groupBy({
        by: ['planId'],
        where: { status: 'ACTIVE' },
        _count: true,
      }),
      prisma.invoice.findMany({
        where: { status: 'PAID' },
        orderBy: { paidAt: 'desc' },
        take: 10,
        include: { user: { select: { email: true, name: true } } },
      }),
    ]);

    // Enrich plan distribution with names
    const planIds = planDistribution.map(p => p.planId);
    const plans = await prisma.plan.findMany({ where: { id: { in: planIds } } });
    const planMap = Object.fromEntries(plans.map(p => [p.id, p]));

    const enrichedPlanDistribution = planDistribution.map(p => ({
      ...p,
      plan: planMap[p.planId],
    }));

    // Monthly revenue trend (last 6 months)
    const monthlyRevenue = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const result = await prisma.invoice.aggregate({
        where: { status: 'PAID', paidAt: { gte: monthStart, lt: monthEnd } },
        _sum: { amount: true },
      });
      monthlyRevenue.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        revenue: result._sum.amount || 0,
      });
    }

    res.json({
      users: {
        total: totalUsers,
        newThisMonth: newUsersThisMonth,
        growth: newUsersLastMonth > 0 ? ((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth) * 100 : 0,
      },
      subscriptions: {
        active: activeSubscriptions,
        churnedThisMonth,
        churnRate: activeSubscriptions > 0 ? (churnedThisMonth / activeSubscriptions) * 100 : 0,
      },
      revenue: {
        total: totalRevenue._sum.amount || 0,
        thisMonth: revenueThisMonth._sum.amount || 0,
        lastMonth: revenueLastMonth._sum.amount || 0,
        growth: revenueLastMonth._sum.amount > 0
          ? (((revenueThisMonth._sum.amount || 0) - revenueLastMonth._sum.amount) / revenueLastMonth._sum.amount) * 100
          : 0,
      },
      planDistribution: enrichedPlanDistribution,
      monthlyRevenue,
      recentInvoices,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch analytics' });
  }
});

module.exports = router;
