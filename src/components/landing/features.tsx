'use client';

import { motion } from 'framer-motion';
import { Music, Scissors, Volume2, Gauge, Wand2, Headphones, Zap, Shield, Globe } from 'lucide-react';

const features = [
  {
    icon: Music,
    title: 'Multi-format Conversion',
    description: 'Convert between MP3, WAV, OGG, AAC, and FLAC with high quality output.',
  },
  {
    icon: Scissors,
    title: 'Precision Trimming',
    description: 'Cut, fade in, fade out, and trim your audio with frame-level precision.',
  },
  {
    icon: Volume2,
    title: 'Audio Normalization',
    description: 'Auto-balance volume to broadcast standards with EBU R128 loudness normalization.',
  },
  {
    icon: Gauge,
    title: 'Speed Control',
    description: 'Change playback speed from 0.25x to 4x without affecting pitch quality.',
  },
  {
    icon: Wand2,
    title: 'Audio Effects',
    description: 'Amplify, normalize, fade, and apply real-time effects with one click.',
  },
  {
    icon: Headphones,
    title: 'Live Preview',
    description: 'Waveform visualization with built-in player. Seek, scrub, and listen in real-time.',
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Distributed cloud processing delivers results in seconds, not minutes.',
  },
  {
    icon: Shield,
    title: 'Secure & Private',
    description: 'Files are encrypted in transit and at rest. You own your data, always.',
  },
  {
    icon: Globe,
    title: 'Remote Sources',
    description: 'Process audio directly from any HTTP(S) URL. No upload required.',
  },
];

export function Features() {
  return (
    <section id="features" className="border-t border-white/[0.06] py-20 md:py-32">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-purple-400">Features</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-5xl">
            Everything you need to <span className="gradient-text">master audio</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            A complete toolkit for audio professionals and creators. Built for scale, designed for clarity.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="group relative overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 transition-colors hover:border-purple-500/30 hover:bg-white/[0.04]"
            >
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400 transition-colors group-hover:bg-purple-500/20">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
