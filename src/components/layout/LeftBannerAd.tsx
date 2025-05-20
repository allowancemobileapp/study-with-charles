
"use client";

import { useState, useEffect } from 'react';
import { useAppStore } from "@/lib/store";
import Link from "next/link";

export function LeftBannerAd() {
  const storeIsSubscribed = useAppStore(state => state.isSubscribed);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (mounted && storeIsSubscribed) {
    return null;
  }

  return (
    <aside
      className="hidden lg:flex fixed left-0 top-16 h-[calc(100vh-4rem)] w-[200px] flex-col items-center justify-center p-4 border-r border-border/40 bg-background/80 shadow-lg"
    >
      <div className="flex flex-col items-center space-y-4 w-full">
        <p className="text-sm font-semibold text-center text-foreground">Advertisement</p>
        <div 
          className="w-[160px] h-[500px] bg-muted/50 rounded-md shadow-md flex items-center justify-center text-muted-foreground border border-dashed border-border"
          aria-label="Ad Slot"
        >
          <span className="text-sm p-2 text-center">Banner Ad Slot (160x500)</span>
        </div>
        <p className="text-xs text-muted-foreground text-center">
          <Link href="/pricing" className="underline hover:text-primary">Subscribe</Link> to remove ads.
        </p>
      </div>
    </aside>
  );
}
