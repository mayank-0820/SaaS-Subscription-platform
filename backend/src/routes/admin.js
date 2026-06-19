const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(requireRole('ADMIN', 'SUPER_ADMIN'));

// Get all users
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role } = req.query;
    const skip = (page - 1) * limit;

    const where = {
      ...(role && { role }),
      ...(search && {
        OR: [
          { email: { contains: search, mode: 'insensitive' } },
          { name: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true, email: true, name: true, role: true, createdAt: true,
          subscription: { include: { plan: true } },
          _count: { select: { invoices: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: parseInt(skip),
        take: parseInt(limit),
      }),
      prisma.user.count({ where }),
    ]);

    res.json({ users, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// Update user role
router.put('/users/:id/role', requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const { role } = req.body;
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { role },
      select: { id: true, email: true, name: true, role: true },
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update user role' });
  }
});

// Delete user
router.delete('/users/:id', requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

// Get audit logs
router.get('/audit-logs', async (req, res) => {
  try {
    const { page = 1, limit = 50, userId, action } = req.query;
    const skip = (page - 1) * limit;

    const where = {
      ...(userId && { userId }),
      ...(action && { action: { contains: action, mode: 'insensitive' } }),
    };

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: { user: { select: { email: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        skip: parseInt(skip),
        take: parseInt(limit),
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({ logs, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch audit logs' });
  }
});

// Create manual invoice
router.post('/invoices', async (req, res) => {
  try {
    const { userId, amount, currency, description, dueDate } = req.body;

    const invoice = await prisma.invoice.create({
      data: {
        userId, amount, currency: currency || 'usd',
        description, dueDate: new Date(dueDate),
        status: 'PENDING',
      },
      include: { user: { select: { email: true, name: true } } },
    });

    res.status(201).json(invoice);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create invoice' });
  }
});

// Update invoice status
router.put('/invoices/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const invoice = await prisma.invoice.update({
      where: { id: req.params.id },
      data: { status, ...(status === 'PAID' && { paidAt: new Date() }) },
    });
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update invoice' });
  }
});

module.exports = router;
