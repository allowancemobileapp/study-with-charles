
"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

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
    } else if (isOpen && countdown === 0) {
      // Optionally auto-skip or enable skip button actions
      // For now, just enables the skip button
    }
    return () => clearInterval(timer);
  }, [isOpen, countdown]);

  useEffect(() => {
    // Reset countdown when modal is newly opened
    if (isOpen) {
      setCountdown(5);
      setProgress(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(isNowOpen) => {
        if (!isNowOpen) { // Dialog is attempting to close (e.g., via 'X' button)
          if (countdown > 0) {
            // If countdown is active, do NOT call onClose(), effectively preventing closure.
            return;
          }
          // If countdown is 0, proceed to call the external onClose handler.
          onClose();
        }
        // If isNowOpen is true, it's being opened (already handled by isOpen prop),
        // or it's an internal state update we don't need to act on here.
      }}
    >
      <DialogContent
        className="sm:max-w-[525px] bg-card border-accent shadow-xl shadow-accent/30"
        onInteractOutside={(e) => {
          if (countdown > 0) {
            e.preventDefault(); // Prevent closing by clicking outside if countdown is active
          }
        }}
        onEscapeKeyDown={(e) => {
          if (countdown > 0) {
            e.preventDefault(); // Prevent closing by Esc key if countdown is active
          }
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl text-center text-accent">Advertisement</DialogTitle>
        </DialogHeader>
        <div className="my-4 p-4 rounded-lg bg-secondary/50 flex flex-col items-center">
          <p className="text-sm text-muted-foreground mb-2">Your results will be shown after this short ad.</p>
          {/*
            Future Video Ad Integration:
            This section would be replaced with your video ad network's player
            or integration code (e.g., Google Ad Manager, VAST/VPAID tags, etc.).
            This often involves including their SDK and configuring ad tags.
            The placeholder div below is for visual prototyping.
          */}
          <div
            className="w-full h-64 bg-muted/60 rounded-md overflow-hidden flex items-center justify-center my-2 text-muted-foreground border border-dashed border-border/70"
            aria-label="Video Ad Placeholder"
          >
            <span className="text-lg">Video Ad Content Area</span>
          </div>
          <Progress value={progress} className="w-full h-2 my-2 [&>div]:bg-accent" />
          <p className="text-sm text-muted-foreground mt-1">
            {countdown > 0 ? `You can skip in ${countdown} seconds...` : "You can skip now."}
          </p>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
                // onSkip should also trigger onClose to ensure the modal closes
                onSkip(); 
                if (countdown === 0) onClose(); // Ensure it closes if skipped after countdown
            }}
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
