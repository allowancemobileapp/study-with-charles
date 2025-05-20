
"use client";

import type React from 'react';
import { Header } from "./Header";
import { Footer } from "./Footer";
import { LeftBannerAd } from "@/components/layout/LeftBannerAd";
import { useAppStore } from "@/lib/store";
import { VideoAdModal } from '@/components/ai-helper/VideoAdModal';
import ErrorBoundary from './ErrorBoundary'; // Add this import

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { showVideoAd, setShowVideoAd, isSubscribed } = useAppStore();

  const handleAdSkipped = () => {
    setShowVideoAd(false);
    // Potentially trigger result display or navigation here
  };
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="flex flex-1">
        <LeftBannerAd />
        <main className="flex-1 lg:ml-[200px] p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <ErrorBoundary 
            fallback={
              <div style={{ padding: '20px', textAlign: 'center' }}>
                <h2>An error occurred loading this page content.</h2>
                <p>Please try refreshing.</p>
              </div>
            }
          >
            {children}
          </ErrorBoundary>
        </main>
      </div>
      <Footer />
      {!isSubscribed && <VideoAdModal isOpen={showVideoAd} onSkip={handleAdSkipped} onClose={() => setShowVideoAd(false)} />}
    </div>
  );
}
