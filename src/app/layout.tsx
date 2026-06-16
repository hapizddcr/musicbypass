import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { Toaster } from 'sonner';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    default: 'AudioForge — Transform Audio Faster',
    template: '%s | AudioForge',
  },
  description:
    'Professional audio processing platform with cloud automation. Convert, trim, normalize, and process audio files in seconds.',
  keywords: ['audio', 'processing', 'converter', 'mp3', 'wav', 'saas', 'cloud'],
  authors: [{ name: 'AudioForge' }],
  creator: 'AudioForge',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: 'AudioForge',
    title: 'AudioForge — Transform Audio Faster',
    description: 'Professional audio processing platform with cloud automation.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AudioForge',
    description: 'Professional audio processing platform with cloud automation.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>
          <div className="relative isolate min-h-screen">
            <div className="pointer-events-none absolute inset-0 -z-10 grid-bg opacity-30" />
            {children}
          </div>
          <Toaster
            theme="dark"
            position="top-right"
            toastOptions={{
              style: {
                background: 'rgba(20, 20, 25, 0.9)',
                border: '1px solid rgba(168, 85, 247, 0.2)',
                color: 'white',
                backdropFilter: 'blur(12px)',
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
