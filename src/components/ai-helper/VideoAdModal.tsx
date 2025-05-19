
"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Image from "next/image";

interface VideoAdModalProps {
  isOpen: boolean;
  onSkip: () => void;
  onClose: () => void;
}

export function VideoAdModal({ isOpen, onSkip, onClose }: VideoAdModalProps) {
  const [countdown, setCountdown] = useState(5);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isOpen && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prevCount) => prevCount - 1);
        setProgress((prevProgress) => prevProgress + 20);
      }, 1000);
    } else if (countdown === 0) {
      // Optionally auto-skip or enable skip button
    }
    return () => clearInterval(timer);
  }, [isOpen, countdown]);

  useEffect(() => {
    if (isOpen) {
      setCountdown(5);
      setProgress(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[525px] bg-card border-accent shadow-xl shadow-accent/30">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center text-accent">Advertisement</DialogTitle>
        </DialogHeader>
        <div className="my-4 p-4 rounded-lg bg-secondary/50 flex flex-col items-center">
          <p className="text-sm text-muted-foreground mb-2">Your results will be shown after this short ad.</p>
          <div className="w-full h-64 bg-muted rounded-md overflow-hidden flex items-center justify-center my-2">
            {/* Placeholder for video ad */}
            <Image src="https://placehold.co/480x320.png?text=Video+Ad+Placeholder" alt="Video Ad" width={480} height={320} className="object-cover" data-ai-hint="advertisement video" />
          </div>
          <Progress value={progress} className="w-full h-2 my-2 [&>div]:bg-accent" />
          <p className="text-sm text-muted-foreground mt-1">
            {countdown > 0 ? `You can skip in ${countdown} seconds...` : "You can skip now."}
          </p>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onSkip}
            disabled={countdown > 0}
            className="border-accent text-accent hover:bg-accent/10 hover:text-accent disabled:opacity-50"
          >
            {countdown > 0 ? `Skip Ad (${countdown})` : "Skip Ad & Continue"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
