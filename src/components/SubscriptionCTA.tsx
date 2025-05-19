
"use client";

import { useAppStore } from "@/lib/store";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";

export function SubscriptionCTA() {
  const { isSubscribed, isLoggedIn } = useAppStore();

  if (isSubscribed || !isLoggedIn) {
    return null;
  }

  return (
    <div className="bg-primary/10 p-4 rounded-lg shadow-lg my-6 text-center">
      <h3 className="text-lg font-semibold text-foreground mb-2">Tired of Ads? Go Premium!</h3>
      <p className="text-sm text-muted-foreground mb-3">
        Unlock an Ad-Free Experience and support Study with Charles for just N1000/month.
      </p>
      <Button asChild variant="default" className="bg-primary hover:bg-primary/90 text-primary-foreground">
        <Link href="/pricing">
          <Zap className="mr-2 h-4 w-4" /> Upgrade Now
        </Link>
      </Button>
    </div>
  );
}
