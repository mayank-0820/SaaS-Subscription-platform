const express = require('express');
const { PrismaClient } = require('@prisma/client');
const stripeService = require('../services/stripe');

const router = express.Router();
const prisma = new PrismaClient();

router.post('/stripe', async (req, res) => {
  const signature = req.headers['stripe-signature'];

  let event;
  try {
    event = stripeService.constructWebhookEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ message: 'Invalid webhook signature' });
  }

  try {
    switch (event.type) {
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        const user = await prisma.user.findUnique({
          where: { stripeCustomerId: invoice.customer },
        });
        if (user) {
          await prisma.invoice.create({
            data: {
              userId: user.id,
              amount: invoice.amount_paid / 100,
              currency: invoice.currency,
              status: 'PAID',
              dueDate: new Date(invoice.due_date * 1000),
              paidAt: new Date(invoice.status_transitions.paid_at * 1000),
              stripeInvoiceId: invoice.id,
              description: invoice.description || 'Stripe invoice payment',
            },
          });
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const user = await prisma.user.findUnique({
          where: { stripeCustomerId: invoice.customer },
        });
        if (user) {
          await prisma.subscription.updateMany({
            where: { userId: user.id },
            data: { status: 'PAST_DUE' },
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const user = await prisma.user.findUnique({
          where: { stripeCustomerId: subscription.customer },
        });
        if (user) {
          await prisma.subscription.updateMany({
            where: { userId: user.id, stripeSubscriptionId: subscription.id },
            data: { status: 'CANCELLED' },
          });
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const user = await prisma.user.findUnique({
          where: { stripeCustomerId: subscription.customer },
        });
        if (user) {
          await prisma.subscription.updateMany({
            where: { userId: user.id, stripeSubscriptionId: subscription.id },
            data: {
              status: subscription.status.toUpperCase(),
              currentPeriodStart: new Date(subscription.current_period_start * 1000),
              currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            },
          });
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ message: 'Webhook processing failed' });
  }
});

module.exports = router;
