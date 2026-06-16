'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Play, Sparkles, Music, Mic, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,rgba(168,85,247,0.15),transparent_50%)]" />
      <div className="container relative pt-20 pb-16 md:pt-32 md:pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl text-center"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-xs font-medium text-purple-300">
            <Sparkles className="h-3 w-3" />
            <span>Now with realtime waveform preview</span>
          </div>
          <h1 className="text-balance text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl">
            <span className="gradient-text">Transform Audio</span>
            <br />
            Faster
          </h1>
          <p className="mt-6 text-balance text-lg text-muted-foreground md:text-xl">
            Professional audio processing platform with cloud automation. Convert, trim, normalize, and process
            audio files in seconds — no technical knowledge required.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="xl">
              <Link href="/register">
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="glass" size="xl">
              <Link href="#pricing">
                <Play className="h-4 w-4" />
                View Pricing
              </Link>
            </Button>
          </div>
          <p className="mt-6 text-xs text-muted-foreground">
            Free plan available — No credit card required
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative mx-auto mt-20 max-w-5xl"
        >
          <div className="gradient-border relative overflow-hidden rounded-2xl glass-strong p-8">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {[
                { icon: Music, label: 'Upload', value: 'audio.mp3' },
                { icon: Mic, label: 'Process', value: 'Normalize + Trim' },
                { icon: Radio, label: 'Download', value: 'audio.wav' },
              ].map((step, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] p-4"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-purple-500/20">
                    <step.icon className="h-5 w-5 text-purple-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">{step.label}</p>
                    <p className="truncate text-sm font-medium">{step.value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex h-32 items-end gap-1 overflow-hidden rounded-lg border border-white/[0.06] bg-black/40 p-2">
              {Array.from({ length: 60 }).map((_, i) => {
                const h = 20 + Math.sin(i * 0.4) * 30 + Math.random() * 40;
                return (
                  <div
                    key={i}
                    className="flex-1 rounded-sm bg-gradient-to-t from-purple-600 to-purple-400"
                    style={{ height: `${h}%` }}
                  />
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
