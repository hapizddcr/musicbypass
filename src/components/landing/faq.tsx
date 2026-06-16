'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

const faqs = [
  {
    question: 'What audio formats are supported?',
    answer:
      'AudioForge supports MP3, WAV, OGG, AAC, and FLAC for both input and output. We auto-detect formats and handle conversions transparently.',
  },
  {
    question: 'How fast is the processing?',
    answer:
      'Most jobs complete in under 30 seconds. Long files (1hr+) typically process in 2-5 minutes depending on the operations applied.',
  },
  {
    question: 'Is my data secure?',
    answer:
      'All files are encrypted in transit (TLS 1.3) and at rest. Files are deleted 24 hours after processing. We never train models on your data.',
  },
  {
    question: 'Can I process audio from a URL?',
    answer:
      'Yes! Paste any public HTTP(S) URL and we will fetch and process it. We support S3, GCS, R2, and any other publicly accessible storage.',
  },
  {
    question: 'Do you have an API?',
    answer:
      'Yes. Pro plans include full REST API access with webhooks for job events. Check our docs for the full reference.',
  },
  {
    question: 'What happens if processing fails?',
    answer:
      'Failed jobs are automatically retried up to 3 times. If the issue persists, you are not charged for that job, and our team is notified.',
  },
  {
    question: 'Can I cancel my subscription anytime?',
    answer:
      'Yes, cancel anytime from your settings. Your subscription remains active until the end of the current billing period.',
  },
  {
    question: 'Do you offer team/enterprise plans?',
    answer:
      'Yes. Contact us for custom enterprise plans with SLA, dedicated infrastructure, and volume discounts.',
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="border-t border-white/[0.06] py-20 md:py-32">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-purple-400">FAQ</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-5xl">
            Frequently asked <span className="gradient-text">questions</span>
          </h2>
          <p className="mt-4 text-muted-foreground">Everything you need to know. Can&apos;t find what you&apos;re looking for? Contact us.</p>
        </div>

        <div className="mx-auto mt-16 max-w-3xl space-y-2">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-lg border border-white/[0.06] bg-white/[0.02]"
            >
              <button
                type="button"
                onClick={() => setOpen(open === i ? null : i)}
                className="flex w-full items-center justify-between gap-4 p-5 text-left"
              >
                <span className="text-sm font-medium md:text-base">{faq.question}</span>
                <Plus
                  className={cn(
                    'h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform',
                    open === i && 'rotate-45 text-purple-400'
                  )}
                />
              </button>
              <AnimatePresence initial={false}>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <p className="px-5 pb-5 text-sm text-muted-foreground">{faq.answer}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
