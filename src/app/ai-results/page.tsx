
"use client";

import { useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, CalendarPlus, AlertTriangle } from "lucide-react";
import { useRouter } from 'next/navigation';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function AiResultsPage() {
  const { aiResult, setAiResult } = useAppStore();
  const router = useRouter();

  useEffect(() => {
    // Optional: Clear result from store when component unmounts if it's single-use display
    // return () => {
    //   setAiResult(null);
    // };
  }, [setAiResult]);

  if (!aiResult) {
    return (
      <div className="container mx-auto py-8 px-4 flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <Card className="w-full max-w-md text-center bg-card/70 border-destructive/50 shadow-lg">
          <CardHeader>
            <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
            <CardTitle className="text-2xl text-destructive">No Result Found</CardTitle>
            <CardDescription className="text-muted-foreground">
              It seems there's no AI result to display. Please try generating one first.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => router.push('/')} className="w-full bg-primary text-primary-foreground">
              Go to AI Helper
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const handleDownload = () => {
    if (aiResult && aiResult.result) {
      const blob = new Blob([aiResult.result], { type: 'text/plain;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'ai_result.txt';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    }
  };

  const handleSchedule = () => {
    // Navigate to timetable, potentially passing result data or ID
    // For now, just navigate. Data passing can be done via Zustand or query params if small.
    router.push('/timetable?action=schedule_result'); 
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="w-full max-w-3xl mx-auto shadow-2xl border-accent/50 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-primary">
            AI Generated Result
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Here's the content processed by our AI based on your request.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] w-full rounded-md border border-border p-4 bg-secondary/30">
            <pre className="whitespace-pre-wrap text-sm text-foreground leading-relaxed">
              {aiResult.result}
            </pre>
          </ScrollArea>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
          <Button variant="outline" onClick={handleDownload} className="w-full sm:w-auto border-primary text-primary hover:bg-primary/10">
            <Download className="mr-2 h-4 w-4" /> Download Result
          </Button>
          <Button onClick={handleSchedule} className="w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90">
            <CalendarPlus className="mr-2 h-4 w-4" /> Schedule Result
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
