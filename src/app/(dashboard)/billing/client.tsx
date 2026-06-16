'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Check, Loader2, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  priceMonthly: number;
  priceYearly: number | null;
  jobLimitDaily: number | null;
  jobLimitMonthly: number | null;
  features: Record<string, unknown>;
}

interface Subscription {
  id: string;
  planName: string;
  planId: string;
  endDate: string;
  autoRenew: boolean;
}

interface Payment {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  status: string;
  method: string | null;
  createdAt: string;
  paidAt: string | null;
  planName: string | null;
}

function formatIDR(amount: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
}

const statusVariant: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'destructive'> = {
  PAID: 'success',
  PENDING: 'warning',
  FAILED: 'destructive',
  EXPIRED: 'secondary',
  REFUNDED: 'secondary',
  CANCELLED: 'secondary',
};

export function BillingClient({
  plans,
  activeSubscription,
  payments,
}: {
  plans: Plan[];
  activeSubscription: Subscription | null;
  payments: Payment[];
}) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  async function handleSubscribe(planId: string) {
    setLoadingPlan(planId);
    try {
      const res = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, billingCycle }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || 'Could not start payment');
        return;
      }
      const data = await res.json();
      if (data.devMode) {
        toast.info(data.message);
        return;
      }
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        toast.success('Payment created. Check your email for instructions.');
      }
    } catch (e) {
      toast.error('Could not start payment');
    } finally {
      setLoadingPlan(null);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Billing</h1>
        <p className="mt-1 text-muted-foreground">Manage your subscription and payments</p>
      </div>

      {activeSubscription && (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>Current Plan</CardTitle>
                <CardDescription>You are on the {activeSubscription.planName} plan</CardDescription>
              </div>
              <Badge variant="success">Active</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Next billing date</p>
                <p className="text-sm font-medium">
                  {formatDistanceToNow(new Date(activeSubscription.endDate), { addSuffix: true })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="autorenew" className="text-sm">Auto-renew</Label>
                <Switch id="autorenew" checked={activeSubscription.autoRenew} disabled />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Available Plans</h2>
          <div className="flex items-center gap-2 rounded-md border border-white/[0.06] bg-white/[0.02] p-1">
            <button
              type="button"
              onClick={() => setBillingCycle('monthly')}
              className={cn(
                'rounded-sm px-3 py-1 text-xs',
                billingCycle === 'monthly' ? 'bg-purple-500/20 text-foreground' : 'text-muted-foreground'
              )}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('yearly')}
              className={cn(
                'rounded-sm px-3 py-1 text-xs',
                billingCycle === 'yearly' ? 'bg-purple-500/20 text-foreground' : 'text-muted-foreground'
              )}
            >
              Yearly
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {plans.map((plan) => {
            const amount = billingCycle === 'yearly' && plan.priceYearly ? plan.priceYearly : plan.priceMonthly;
            const isCurrent = activeSubscription?.planId === plan.id;
            return (
              <Card key={plan.id} className={cn('flex flex-col p-6', isCurrent && 'border-purple-500/50')}>
                <div>
                  <h3 className="text-xl font-bold">{plan.name}</h3>
                  {plan.description && (
                    <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
                  )}
                  <div className="mt-4">
                    <span className="text-3xl font-bold">
                      {amount === 0 ? 'Free' : formatIDR(amount)}
                    </span>
                    {amount > 0 && (
                      <span className="text-sm text-muted-foreground"> / {billingCycle === 'yearly' ? 'year' : 'month'}</span>
                    )}
                  </div>
                </div>

                <ul className="mt-4 flex-1 space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-purple-400" />
                    {plan.jobLimitDaily
                      ? `${plan.jobLimitDaily} jobs / day`
                      : 'Unlimited jobs'}
                  </li>
                  {plan.jobLimitMonthly && (
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-purple-400" />
                      {plan.jobLimitMonthly} jobs / month
                    </li>
                  )}
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-purple-400" />
                    All audio formats
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-purple-400" />
                    Full audio toolkit
                  </li>
                </ul>

                <Button
                  className="mt-6 w-full"
                  variant={isCurrent ? 'outline' : 'default'}
                  disabled={isCurrent || loadingPlan === plan.id}
                  onClick={() => handleSubscribe(plan.id)}
                >
                  {loadingPlan === plan.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isCurrent ? (
                    'Current Plan'
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4" /> Subscribe
                    </>
                  )}
                </Button>
              </Card>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-xl font-semibold">Payment History</h2>
        <Card>
          {payments.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">No payments yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-white/[0.06] text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Order ID</th>
                    <th className="px-4 py-3 font-medium">Plan</th>
                    <th className="px-4 py-3 font-medium">Amount</th>
                    <th className="px-4 py-3 font-medium">Method</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {payments.map((p) => (
                    <tr key={p.id}>
                      <td className="px-4 py-3 font-mono text-xs">{p.orderId}</td>
                      <td className="px-4 py-3">{p.planName ?? '—'}</td>
                      <td className="px-4 py-3">{formatIDR(p.amount)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{p.method ?? '—'}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(p.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={statusVariant[p.status] || 'secondary'}>{p.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
