import Link from 'next/link';
import { Check, Zap, Shield, BarChart3, ArrowRight } from 'lucide-react';

const plans = [
  {
    name: 'Starter',
    price: '$9.99',
    description: 'Perfect for individuals and small teams',
    features: ['1,000 API calls/month', '5 GB Storage', '1 User', 'Email support', 'Basic analytics'],
    cta: 'Get started',
    highlighted: false,
  },
  {
    name: 'Professional',
    price: '$29.99',
    description: 'For growing businesses that need more power',
    features: ['10,000 API calls/month', '50 GB Storage', 'Up to 10 users', 'Priority support', 'Advanced analytics', 'Custom domain'],
    cta: 'Start free trial',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: '$99.99',
    description: 'For large organizations with advanced needs',
    features: ['Unlimited API calls', 'Unlimited storage', 'Unlimited users', 'Dedicated support', 'Advanced analytics', 'Custom domain', 'SLA 99.9%', 'SSO'],
    cta: 'Contact sales',
    highlighted: false,
  },
];

const features = [
  {
    icon: Zap,
    title: 'Automated Billing',
    description: 'Set up recurring billing with automatic invoice generation and payment processing via Stripe.',
  },
  {
    icon: BarChart3,
    title: 'Usage Analytics',
    description: 'Track API usage, storage consumption, and user activity with real-time dashboards.',
  },
  {
    icon: Shield,
    title: 'Role-Based Access',
    description: 'Control who can access what with granular permission management and admin panels.',
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl text-gray-900">SubsManager</span>
        </div>
        <div className="flex items-center space-x-4">
          <Link href="/auth/login" className="text-gray-600 hover:text-gray-900 font-medium">
            Sign in
          </Link>
          <Link href="/auth/register" className="btn-primary">
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center bg-primary-50 text-primary-700 text-sm font-medium px-4 py-2 rounded-full mb-6">
          <Zap className="w-4 h-4 mr-2" />
          Subscription management made simple
        </div>
        <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
          Manage SaaS subscriptions<br />
          <span className="text-primary-600">at any scale</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Everything you need to manage subscriptions, automate billing, track usage, 
          and grow your SaaS business — all in one platform.
        </p>
        <div className="flex items-center justify-center space-x-4">
          <Link href="/auth/register" className="btn-primary flex items-center space-x-2 text-lg px-6 py-3">
            <span>Start free trial</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link href="/auth/login" className="btn-secondary text-lg px-6 py-3">
            View demo
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Everything you need</h2>
          <p className="text-gray-600 max-w-xl mx-auto">
            Powerful features to help you manage subscriptions and grow your business.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div key={feature.title} className="card p-6">
              <div className="w-12 h-12 bg-primary-50 rounded-lg flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-7xl mx-auto px-6 py-16 bg-gray-50 rounded-3xl mx-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Simple, transparent pricing</h2>
          <p className="text-gray-600">No hidden fees. Cancel anytime.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`card p-8 relative ${plan.highlighted ? 'border-primary-500 border-2 shadow-lg' : ''}`}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary-600 text-white text-sm font-medium px-4 py-1 rounded-full">
                  Most popular
                </div>
              )}
              <h3 className="text-xl font-bold text-gray-900 mb-1">{plan.name}</h3>
              <p className="text-gray-500 text-sm mb-4">{plan.description}</p>
              <div className="text-4xl font-bold text-gray-900 mb-1">{plan.price}</div>
              <div className="text-gray-500 text-sm mb-6">/month</div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center space-x-2 text-sm text-gray-700">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/auth/register"
                className={`w-full block text-center py-2 px-4 rounded-lg font-medium transition-colors ${
                  plan.highlighted
                    ? 'bg-primary-600 text-white hover:bg-primary-700'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-gray-200 mt-16">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-primary-600 rounded flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900">SubsManager</span>
          </div>
          <p className="text-gray-500 text-sm">© 2024 SubsManager. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
