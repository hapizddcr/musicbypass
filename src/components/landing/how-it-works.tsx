'use client';

import { motion } from 'framer-motion';
import { Upload, Settings, Download } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: Upload,
    title: 'Upload your audio',
    description: 'Drag & drop files or paste a remote URL. We support MP3, WAV, OGG, AAC, FLAC.',
  },
  {
    number: '02',
    icon: Settings,
    title: 'Configure processing',
    description: 'Choose conversion format, trim points, fade, normalize, and other effects via our visual editor.',
  },
  {
    number: '03',
    icon: Download,
    title: 'Download & integrate',
    description: 'Get your processed file in seconds. Stream it via CDN or download to your device.',
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-t border-white/[0.06] py-20 md:py-32">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-purple-400">How it works</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-5xl">
            Three steps. <span className="gradient-text">Zero hassle.</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            From upload to processed file in under a minute.
          </p>
        </div>

        <div className="relative mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="absolute left-0 right-0 top-1/2 hidden h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent md:block" />

          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.15 }}
              className="relative"
            >
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-8 text-center">
                <div className="mb-4 text-5xl font-bold gradient-text">{step.number}</div>
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/20 text-purple-300">
                  <step.icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
