'use client';

import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    quote:
      "AudioForge replaced three different tools in my workflow. The batch processing alone saves me hours every week.",
    author: "Maya Chen",
    role: "Podcast Producer",
    company: "Waveform Studios",
  },
  {
    quote:
      "The audio quality is unmatched. Normalization is broadcast-grade, and the conversion is lightning fast.",
    author: "Daniel Park",
    role: "Sound Engineer",
    company: "Resonance Audio",
  },
  {
    quote:
      "We integrated it into our CMS in a single afternoon. The API is clean, the docs are great, support is responsive.",
    author: "Lisa Rodriguez",
    role: "Engineering Lead",
    company: "StreamCo",
  },
  {
    quote:
      "Finally a tool that handles unusual formats without complaint. The remote URL feature is exactly what I needed.",
    author: "Tom Williams",
    role: "Indie Game Dev",
    company: "Pixel Forge",
  },
  {
    quote:
      "Pricing is fair, performance is great, and the team actually listens to feedback. Highly recommended.",
    author: "Aria Patel",
    role: "Content Creator",
    company: "Self-employed",
  },
  {
    quote:
      "We process 50k+ audio clips per day for our voice cloning product. AudioForge handles the load with ease.",
    author: "James Lee",
    role: "CTO",
    company: "VoiceLab",
  },
];

export function Testimonials() {
  return (
    <section className="border-t border-white/[0.06] py-20 md:py-32">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-purple-400">Testimonials</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-5xl">
            Loved by <span className="gradient-text">audio professionals</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            From indie creators to enterprise teams — they all trust AudioForge.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="relative rounded-xl border border-white/[0.06] bg-white/[0.02] p-6"
            >
              <Quote className="absolute right-4 top-4 h-8 w-8 text-purple-500/20" />
              <div className="mb-3 flex gap-1">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-purple-400 text-purple-400" />
                ))}
              </div>
              <p className="text-sm leading-relaxed text-foreground/90">&ldquo;{t.quote}&rdquo;</p>
              <div className="mt-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-purple-700 text-sm font-semibold">
                  {t.author
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </div>
                <div>
                  <p className="text-sm font-semibold">{t.author}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.role} · {t.company}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
