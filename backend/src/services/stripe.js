const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const stripeService = {
  async createCustomer(email, name) {
    return stripe.customers.create({ email, name });
  },

  async attachPaymentMethod(paymentMethodId, customerId) {
    await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });
    await stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });
  },

  async createSubscription(customerId, priceId) {
    return stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
    });
  },

  async cancelSubscription(stripeSubscriptionId) {
    return stripe.subscriptions.cancel(stripeSubscriptionId);
  },

  async createPaymentIntent(amount, currency, customerId) {
    return stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency,
      customer: customerId,
    });
  },

  async createInvoice(customerId, amount, description) {
    const invoiceItem = await stripe.invoiceItems.create({
      customer: customerId,
      amount: Math.round(amount * 100),
      currency: 'usd',
      description,
    });
    return stripe.invoices.create({ customer: customerId });
  },

  constructWebhookEvent(body, signature, secret) {
    return stripe.webhooks.constructEvent(body, signature, secret);
  },
};

module.exports = stripeService;
