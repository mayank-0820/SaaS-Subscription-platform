'use client';
import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { BarChart3, TrendingUp } from 'lucide-react';
import { analyticsApi } from '@/lib/api';

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsApi.getMy()
      .then(r => setAnalytics(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600 mt-1">Your usage and spending insights.</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card p-5">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <span className="text-sm text-gray-600">Total Spent</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            ${(analytics?.totalSpent || 0).toFixed(2)}
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center space-x-2 mb-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <span className="text-sm text-gray-600">Billing Months</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {analytics?.monthlySpend?.length || 0}
          </div>
        </div>
      </div>

      {/* Spend over time */}
      {analytics?.monthlySpend?.length > 0 && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Spend Over Time</h2>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={analytics.monthlySpend}>
              <defs>
                <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: any) => [`$${v.toFixed(2)}`, 'Amount']} />
              <Area type="monotone" dataKey="amount" stroke="#0ea5e9" fill="url(#spendGradient)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Usage metrics */}
      {analytics?.usageSummary?.length > 0 && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Usage by Metric</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={analytics.usageSummary.map((u: any) => ({
              name: u.metric.replace(/_/g, ' '),
              total: u._sum.value?.toFixed(2),
              count: u._count,
            }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="total" fill="#10b981" radius={[4, 4, 0, 0]} name="Total" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {!analytics?.monthlySpend?.length && !analytics?.usageSummary?.length && (
        <div className="card p-12 text-center text-gray-500">
          <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="font-medium">No analytics data yet</p>
          <p className="text-sm mt-1">Subscribe to a plan to start tracking usage and spending.</p>
        </div>
      )}
    </div>
  );
}
