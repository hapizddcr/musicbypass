'use client';

import Link from 'next/link';
import { Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const plans = [
  {
    name: 'Free',
    description: 'For trying things out',
    price: 0,
    period: 'forever',
    cta: 'Get Started',
    ctaHref: '/register',
    popular: false,
    features: [
      '5 jobs per day',
      'MP3, WAV, OGG conversion',
      'Basic audio tools',
      '1 GB storage',
      'Community support',
    ],
  },
  {
    name: 'Starter',
    description: 'For creators and freelancers',
    price: 99000,
    priceUSD: '$6',
    period: 'month',
    cta: 'Subscribe',
    ctaHref: '/billing?plan=starter',
    popular: true,
    features: [
      '100 jobs per month',
      'All audio formats',
      'Full audio toolkit',
      '10 GB storage',
      'Priority queue',
      'Email support',
    ],
  },
  {
    name: 'Pro',
    description: 'For teams and power users',
    price: 299000,
    priceUSD: '$19',
    period: 'month',
    cta: 'Subscribe',
    ctaHref: '/billing?plan=pro',
    popular: false,
    features: [
      'Unlimited jobs',
      'All audio formats',
      'Full audio toolkit',
      '100 GB storage',
      'Highest priority',
      'Dedicated support',
      'API access',
      'Custom retention',
    ],
  },
];

function formatIDR(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function Pricing() {
  return (
    <section id="pricing" className="border-t border-white/[0.06] py-20 md:py-32">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-purple-400">Pricing</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-5xl">
            Simple, <span className="gradient-text">honest pricing</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            No hidden fees, no per-minute charges. Pay for what you use.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className={cn(
                'relative flex flex-col rounded-2xl border bg-white/[0.02] p-8',
                plan.popular ? 'border-purple-500/50 bg-purple-500/[0.03]' : 'border-white/[0.06]'
              )}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 px-3 py-1 text-xs font-medium text-white">
                  Most Popular
                </div>
              )}
              <div>
                <h3 className="text-2xl font-bold">{plan.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-bold tracking-tight">
                    {plan.price === 0 ? 'Free' : formatIDR(plan.price)}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-sm text-muted-foreground">/ {plan.period}</span>
                  )}
                </div>
                {plan.priceUSD && (
                  <p className="mt-1 text-xs text-muted-foreground">≈ {plan.priceUSD}/mo</p>
                )}
              </div>

              <ul className="mt-6 flex-1 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-purple-400" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                <Button asChild className="w-full" variant={plan.popular ? 'default' : 'outline'}>
                  <Link href={plan.ctaHref}>{plan.cta}</Link>
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
