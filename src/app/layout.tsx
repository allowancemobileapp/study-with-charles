
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { AppProvider } from '@/providers/AppProvider';
import { Toaster } from "@/components/ui/toaster";
import { AppLayout } from '@/components/layout/AppLayout';
import Script from 'next/script'; // Import next/script

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Study with Charles',
  description: 'AI-powered schoolwork assistance and scheduling.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3263315632914230"
          crossOrigin="anonymous"
          strategy="afterInteractive" // Ensures it loads without blocking initial page render
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AppProvider>
          <AppLayout>
            {children}
          </AppLayout>
          <Toaster />
        </AppProvider>
      </body>
    </html>
  );
}
