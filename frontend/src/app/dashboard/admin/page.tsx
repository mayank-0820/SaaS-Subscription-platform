'use client';
import { useEffect, useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, DollarSign, TrendingUp, Activity, ArrowUp, ArrowDown } from 'lucide-react';
import { analyticsApi } from '@/lib/api';

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444'];

export default function AdminOverviewPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsApi.getAdminOverview()
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    </div>
  );
  if (!data) return null;

  const kpiCards = [
    {
      label: 'Total Users',
      value: data.users.total,
      sub: `+${data.users.newThisMonth} this month`,
      positive: data.users.growth >= 0,
      growth: data.users.growth,
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Active Subscriptions',
      value: data.subscriptions.active,
      sub: `${data.subscriptions.churnedThisMonth} churned this month`,
      icon: Activity,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      label: 'Total Revenue',
      value: `$${data.revenue.total?.toFixed(2)}`,
      sub: `$${data.revenue.thisMonth?.toFixed(2)} this month`,
      positive: data.revenue.growth >= 0,
      growth: data.revenue.growth,
      icon: DollarSign,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      label: 'MoM Revenue Growth',
      value: `${data.revenue.growth?.toFixed(1)}%`,
      sub: `vs last month`,
      positive: data.revenue.growth >= 0,
      icon: TrendingUp,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">Platform-wide analytics and metrics.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card) => (
          <div key={card.label} className="card p-5">
            <div className={`w-10 h-10 ${card.bg} rounded-lg flex items-center justify-center mb-3`}>
              <card.icon className={`w-5 h-5 ${card.color}`} />
            </div>
            <div className="text-2xl font-bold text-gray-900">{card.value}</div>
            <div className="text-sm text-gray-500 mt-1">{card.label}</div>
            <div className={`flex items-center text-xs mt-1 ${card.positive !== undefined ? (card.positive ? 'text-green-600' : 'text-red-600') : 'text-gray-500'}`}>
              {card.positive !== undefined && (card.positive ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
              <span className="ml-1">{card.sub}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue chart */}
        <div className="card p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Revenue</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: any) => [`$${v.toFixed(2)}`, 'Revenue']} />
              <Bar dataKey="revenue" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Plan distribution */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Plan Distribution</h2>
          {data.planDistribution.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={data.planDistribution}
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    dataKey="_count"
                    nameKey="plan.name"
                  >
                    {data.planDistribution.map((_: any, index: number) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-4">
                {data.planDistribution.map((item: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-gray-600">{item.plan?.name}</span>
                    </div>
                    <span className="font-medium text-gray-900">{item._count}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-gray-500 text-sm text-center py-8">No subscription data yet</p>
          )}
        </div>
      </div>

      {/* Recent invoices */}
      <div className="card overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Payments</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {['Customer', 'Amount', 'Date', 'Status'].map(h => (
                  <th key={h} className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.recentInvoices.map((inv: any) => (
                <tr key={inv.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{inv.user?.name}</div>
                    <div className="text-xs text-gray-500">{inv.user?.email}</div>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                    ${inv.amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(inv.paidAt || inv.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                      {inv.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
