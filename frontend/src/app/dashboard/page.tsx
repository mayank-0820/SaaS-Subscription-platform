'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CreditCard, TrendingUp, FileText, Activity, ArrowRight } from 'lucide-react';
import { analyticsApi } from '@/lib/api';
import useAuthStore from '@/lib/store';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsApi.getMy()
      .then(r => setAnalytics(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const subscription = analytics?.subscription;
  const plan = subscription?.plan;

  const stats = [
    {
      label: 'Current Plan',
      value: plan?.name || 'No plan',
      icon: CreditCard,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Total Spent',
      value: `$${(analytics?.totalSpent || 0).toFixed(2)}`,
      icon: TrendingUp,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      label: 'Billing Cycle',
      value: plan?.interval === 'MONTHLY' ? 'Monthly' : 'Annual',
      icon: Activity,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      label: 'Next Invoice',
      value: subscription
        ? `$${plan?.price?.toFixed(2)}`
        : 'N/A',
      icon: FileText,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.name?.split(' ')[0]}! 👋
        </h1>
        <p className="text-gray-600 mt-1">Here's an overview of your account.</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 ${stat.bg} rounded-lg flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
            <div className="text-sm text-gray-500">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Subscription status */}
      {subscription ? (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Subscription Details</h2>
            <Link href="/dashboard/subscription" className="text-sm text-primary-600 hover:underline flex items-center">
              Manage <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Plan</p>
              <p className="font-semibold text-gray-900">{plan?.name}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Status</p>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                subscription.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {subscription.status}
              </span>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Next billing</p>
              <p className="font-semibold text-gray-900">
                {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="card p-8 text-center">
          <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">No active subscription</h2>
          <p className="text-gray-600 mb-4">Choose a plan to get started with all features.</p>
          <Link href="/dashboard/subscription" className="btn-primary inline-flex">
            View Plans
          </Link>
        </div>
      )}

      {/* Monthly spend chart */}
      {analytics?.monthlySpend?.length > 0 && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Spend</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={analytics.monthlySpend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: any) => [`$${v.toFixed(2)}`, 'Amount']} />
              <Bar dataKey="amount" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Usage summary */}
      {analytics?.usageSummary?.length > 0 && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Usage Summary</h2>
          <div className="space-y-3">
            {analytics.usageSummary.map((usage: any) => (
              <div key={usage.metric} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <span className="text-sm text-gray-600 capitalize">{usage.metric.replace(/_/g, ' ')}</span>
                <span className="text-sm font-medium text-gray-900">
                  {usage._sum.value?.toFixed(2)} ({usage._count} records)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
