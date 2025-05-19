
"use client";

import { useAppStore } from "@/lib/store";
import Image from "next/image";
import Link from "next/link";

export function LeftBannerAd() {
  const { isSubscribed } = useAppStore();

  if (isSubscribed) {
    return null;
  }

  return (
    <aside className="hidden lg:flex fixed left-0 top-16 h-[calc(100vh-4rem)] w-48_ flex-col items-center justify-center p-4 border-r border-border/40 bg-background/80 shadow-lg" style={{width: '200px'}}>
      <div className="flex flex-col items-center space-y-4">
        <p className="text-sm font-semibold text-center text-foreground">Advertisement</p>
        <Link href="/pricing" className="w-full">
          <Image
            src="https://placehold.co/160x500.png?text=Your+Ad+Here"
            alt="Banner Ad"
            width={160}
            height={500}
            className="rounded-md shadow-md hover:opacity-80 transition-opacity"
            data-ai-hint="advertisement banner"
          />
        </Link>
        <p className="text-xs text-muted-foreground text-center">
          <Link href="/pricing" className="underline hover:text-primary">Subscribe</Link> to remove ads.
        </p>
      </div>
    </aside>
  );
}
