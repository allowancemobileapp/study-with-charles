
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

  if (!mounted || storeIsSubscribed) {
    return null;
  }

  return (
    <aside
      className="hidden lg:flex fixed left-0 top-16 h-[calc(100vh-4rem)] w-[200px] flex-col items-center justify-center p-4 border-r border-border/40 bg-background/80 shadow-lg"
    >
      <div className="flex flex-col items-center space-y-4 w-full">
        {/*
          Google AdSense Integration:
          Once your AdSense account is approved and you've created an ad unit
          (e.g., a 160x600 skyscraper ad), you would replace the div below
          with the ad unit code provided by AdSense.
          It might look something like this (example, don't use directly):
          <ins class="adsbygoogle"
               style="display:inline-block;width:160px;height:600px"
               data-ad-client="ca-pub-YOUR_PUBLISHER_ID"
               data-ad-slot="YOUR_AD_SLOT_ID"></ins>
          <Script id="left-banner-adsense-init" strategy="lazyOnload">
            (adsbygoogle = window.adsbygoogle || []).push({});
          </Script>
          You would also need to add the main AdSense script to your layout's <head>.
        */}
        <div
          className="w-[160px] h-[500px] bg-muted/30 rounded-md shadow-inner flex items-center justify-center text-muted-foreground border border-dashed border-border/70"
          aria-label="Ad Slot Placeholder (e.g., 160x500)"
        >
          <span className="text-sm p-2 text-center">Ad Slot</span>
        </div>
        <p className="text-xs text-muted-foreground text-center">
          <Link href="/pricing" className="underline hover:text-primary">Subscribe</Link> to remove ads.
        </p>
      </div>
    </aside>
  );
}
