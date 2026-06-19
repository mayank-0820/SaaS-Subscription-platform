'use client';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Check, Loader2, Crown } from 'lucide-react';
import { plansApi, subscriptionsApi } from '@/lib/api';

export default function SubscriptionPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');

  const fetchData = async () => {
    try {
      const [plansRes, subRes] = await Promise.all([
        plansApi.getAll(),
        subscriptionsApi.getMy(),
      ]);
      setPlans(plansRes.data);
      setSubscription(subRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubscribe = async (planId: string) => {
    setActionLoading(planId);
    try {
      await subscriptionsApi.subscribe({ planId });
      toast.success('Subscribed successfully!');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Subscription failed');
    } finally {
      setActionLoading('');
    }
  };

  const handleUpgrade = async (planId: string) => {
    setActionLoading(planId);
    try {
      await subscriptionsApi.upgrade(planId);
      toast.success('Plan changed successfully!');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to change plan');
    } finally {
      setActionLoading('');
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel your subscription?')) return;
    setActionLoading('cancel');
    try {
      await subscriptionsApi.cancel();
      toast.success('Subscription will be cancelled at end of billing period');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Cancellation failed');
    } finally {
      setActionLoading('');
    }
  };

  const handleReactivate = async () => {
    setActionLoading('reactivate');
    try {
      await subscriptionsApi.reactivate();
      toast.success('Subscription reactivated!');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Reactivation failed');
    } finally {
      setActionLoading('');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Subscription</h1>
        <p className="text-gray-600 mt-1">Manage your plan and billing preferences.</p>
      </div>

      {/* Current subscription */}
      {subscription && (
        <div className="card p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <Crown className="w-5 h-5 text-yellow-500" />
                <h2 className="text-lg font-semibold text-gray-900">
                  {subscription.plan?.name} Plan
                </h2>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  subscription.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                  subscription.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {subscription.status}
                </span>
              </div>
              <p className="text-gray-600 text-sm mt-1">
                ${subscription.plan?.price}/month · Renews {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
              </p>
              {subscription.cancelAtPeriodEnd && (
                <p className="text-red-600 text-sm mt-1">
                  ⚠️ Cancels on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </p>
              )}
            </div>
            <div className="flex space-x-2">
              {subscription.cancelAtPeriodEnd ? (
                <button
                  onClick={handleReactivate}
                  disabled={actionLoading === 'reactivate'}
                  className="btn-primary"
                >
                  {actionLoading === 'reactivate' ? 'Processing...' : 'Reactivate'}
                </button>
              ) : (
                <button
                  onClick={handleCancel}
                  disabled={actionLoading === 'cancel'}
                  className="btn-secondary text-red-600 border-red-200 hover:bg-red-50"
                >
                  {actionLoading === 'cancel' ? 'Processing...' : 'Cancel plan'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Plans */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {subscription ? 'Change plan' : 'Choose a plan'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isCurrent = subscription?.planId === plan.id;
            const features = typeof plan.features === 'object' ? plan.features : {};

            return (
              <div
                key={plan.id}
                className={`card p-6 relative ${isCurrent ? 'border-primary-500 border-2' : ''}`}
              >
                {isCurrent && (
                  <div className="absolute -top-3 left-4 bg-primary-600 text-white text-xs font-medium px-3 py-1 rounded-full">
                    Current plan
                  </div>
                )}
                <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                <p className="text-gray-500 text-sm mt-1 mb-4">{plan.description}</p>
                <div className="text-3xl font-bold text-gray-900 mb-4">
                  ${plan.price}
                  <span className="text-base font-normal text-gray-500">/mo</span>
                </div>

                <ul className="space-y-2 mb-6">
                  {Object.entries(features).map(([key, value]) => (
                    <li key={key} className="flex items-center space-x-2 text-sm text-gray-600">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}: {String(value) === '-1' ? 'Unlimited' : String(value)}
                      </span>
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <button disabled className="w-full btn-secondary opacity-50 cursor-not-allowed">
                    Current plan
                  </button>
                ) : (
                  <button
                    onClick={() => subscription ? handleUpgrade(plan.id) : handleSubscribe(plan.id)}
                    disabled={!!actionLoading}
                    className="w-full btn-primary"
                  >
                    {actionLoading === plan.id ? 'Processing...' : subscription ? 'Switch to this plan' : 'Get started'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
