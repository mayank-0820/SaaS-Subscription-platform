'use client';
import { useEffect, useState } from 'react';
import { FileText, DollarSign, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';
import { billingApi } from '@/lib/api';

const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    PAID: 'bg-green-100 text-green-700',
    PENDING: 'bg-yellow-100 text-yellow-700',
    FAILED: 'bg-red-100 text-red-700',
    REFUNDED: 'bg-gray-100 text-gray-700',
  };
  const icons: Record<string, any> = {
    PAID: CheckCircle,
    PENDING: Clock,
    FAILED: XCircle,
    REFUNDED: DollarSign,
  };
  const Icon = icons[status] || Clock;
  return (
    <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
      <Icon className="w-3 h-3" />
      <span>{status}</span>
    </span>
  );
};

export default function BillingPage() {
  const [summary, setSummary] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchData = async () => {
    try {
      const [summaryRes, invoicesRes] = await Promise.all([
        billingApi.getSummary(),
        billingApi.getInvoices({ page, limit: 10 }),
      ]);
      setSummary(summaryRes.data);
      setInvoices(invoicesRes.data.invoices);
      setTotalPages(invoicesRes.data.pages);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [page]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
        <p className="text-gray-600 mt-1">Manage your invoices and billing history.</p>
      </div>

      {/* Billing summary */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Paid', value: `$${summary.billing.totalPaid?.toFixed(2)}`, icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'This Month', value: `$${summary.billing.thisMonthPaid?.toFixed(2)}`, icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Total Invoices', value: summary.billing.totalInvoices, icon: FileText, color: 'text-purple-600', bg: 'bg-purple-50' },
            { label: 'Next Invoice', value: summary.billing.nextBillingAmount ? `$${summary.billing.nextBillingAmount?.toFixed(2)}` : 'N/A', icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
          ].map((stat) => (
            <div key={stat.label} className="card p-5">
              <div className={`w-10 h-10 ${stat.bg} rounded-lg flex items-center justify-center mb-3`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-sm text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Next billing info */}
      {summary?.billing.nextBillingDate && (
        <div className="card p-4 flex items-center space-x-3 bg-blue-50 border-blue-100">
          <Calendar className="w-5 h-5 text-blue-600" />
          <span className="text-sm text-blue-800">
            Next billing on{' '}
            <strong>{new Date(summary.billing.nextBillingDate).toLocaleDateString()}</strong>
            {' '}for{' '}
            <strong>${summary.billing.nextBillingAmount?.toFixed(2)}</strong>
          </span>
        </div>
      )}

      {/* Invoice table */}
      <div className="card overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Invoice History</h2>
        </div>
        {invoices.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p>No invoices yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {['Invoice', 'Description', 'Date', 'Amount', 'Status'].map(h => (
                    <th key={h} className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-mono text-gray-500">
                      #{invoice.id.slice(0, 8)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {invoice.description || invoice.subscription?.plan?.name + ' Plan'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(invoice.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      ${invoice.amount.toFixed(2)} {invoice.currency.toUpperCase()}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={invoice.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-200 flex items-center justify-between">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-secondary text-sm disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn-secondary text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
