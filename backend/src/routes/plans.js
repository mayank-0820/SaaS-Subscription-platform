const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get all active plans (public)
router.get('/', async (req, res) => {
  try {
    const plans = await prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
    });
    res.json(plans);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch plans' });
  }
});

// Get a single plan
router.get('/:id', async (req, res) => {
  try {
    const plan = await prisma.plan.findUnique({ where: { id: req.params.id } });
    if (!plan) return res.status(404).json({ message: 'Plan not found' });
    res.json(plan);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch plan' });
  }
});

// Create plan (Admin only)
router.post('/', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), [
  body('name').trim().notEmpty(),
  body('description').trim().notEmpty(),
  body('price').isFloat({ min: 0 }),
  body('features').isObject(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, description, price, currency, interval, features, maxUsers, maxStorage, maxApiCalls, stripePriceId } = req.body;

    const plan = await prisma.plan.create({
      data: { name, description, price, currency, interval, features, maxUsers, maxStorage, maxApiCalls, stripePriceId },
    });

    res.status(201).json(plan);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'Plan name already exists' });
    }
    res.status(500).json({ message: 'Failed to create plan' });
  }
});

// Update plan (Admin only)
router.put('/:id', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), async (req, res) => {
  try {
    const plan = await prisma.plan.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(plan);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update plan' });
  }
});

// Delete/deactivate plan (Admin only)
router.delete('/:id', authenticate, requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    await prisma.plan.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });
    res.json({ message: 'Plan deactivated' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to deactivate plan' });
  }
});

module.exports = router;
