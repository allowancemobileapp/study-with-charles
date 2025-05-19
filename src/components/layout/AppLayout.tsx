
"use client";

import type React from 'react';
import { Header } from "./Header";
import { Footer } from "./Footer";
import { LeftBannerAd } from "./LeftBannerAd";
import { useAppStore } from "@/lib/store";
import { VideoAdModal } from '@/components/ai-helper/VideoAdModal'; // Ensure this path is correct

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
          {/* Adjust lg:ml-[200px] to match LeftBannerAd width */}
           {/* If LeftBannerAd is hidden on smaller screens, this margin might not be needed or needs to be conditional */}
          {children}
        </main>
      </div>
      <Footer />
      {!isSubscribed && <VideoAdModal isOpen={showVideoAd} onSkip={handleAdSkipped} onClose={() => setShowVideoAd(false)} />}
    </div>
  );
}
