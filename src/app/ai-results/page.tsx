
"use client";

import { useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, CalendarPlus, AlertTriangle } from "lucide-react";
import { useRouter } from 'next/navigation';
import { ScrollArea } from '@/components/ui/scroll-area';

interface QAItem {
  Question: string;
  Answer: string;
}

export default function AiResultsPage() {
  const { aiResult, setAiResult } = useAppStore();
  const router = useRouter();

  useEffect(() => {
    // Optional: Clear result from store when component unmounts if it's single-use display
    // return () => {
    //   setAiResult(null);
    // };
  }, [setAiResult]);

  const handleDownload = () => {
    if (aiResult && aiResult.result) {
      let contentToDownload = aiResult.result;
      try {
        const parsed = JSON.parse(aiResult.result);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed.every(item => typeof item === 'object' && item !== null && 'Question' in item && 'Answer' in item)) {
          contentToDownload = parsed.map((qa: QAItem, index: number) => `Question ${index + 1}:\n${qa.Question}\n\nAnswer:\n${qa.Answer}\n\n---\n\n`).join('');
        }
      } catch (e) {
        // Not JSON or not expected format, use raw result
      }
      const blob = new Blob([contentToDownload], { type: 'text/plain;charset=utf-8' });
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
    router.push('/timetable?action=schedule_result'); 
  };

  const renderContent = () => {
    if (!aiResult || !aiResult.result) return <p className="text-muted-foreground">No result content to display.</p>;

    try {
      const parsed = JSON.parse(aiResult.result);
      if (Array.isArray(parsed) && parsed.length > 0 && 
          parsed.every(item => typeof item === 'object' && item !== null && 'Question' in item && 'Answer' in item && typeof item.Question === 'string' && typeof item.Answer === 'string')) {
        
        return (
          <div>
            {parsed.map((qa: QAItem, index: number) => (
              <div key={index} className="mb-6 pb-4 border-b border-border/50 last:border-b-0 last:pb-0 last:mb-0">
                <h3 className="text-lg font-semibold text-primary mb-1">
                  Question {index + 1}:
                </h3>
                <p className="text-foreground mb-3 whitespace-pre-wrap">{qa.Question}</p>
                <h4 className="text-md font-semibold text-accent mb-1">
                  Answer:
                </h4>
                <p className="text-foreground whitespace-pre-wrap">{qa.Answer}</p>
              </div>
            ))}
          </div>
        );
      }
    } catch (e) {
      // Not Q&A JSON, render as preformatted text
      // This can be normal for "Summary" or "Text" formats
    }

    // Fallback for non-Q&A JSON or if parsing fails (e.g. for Summary or Text results)
    return (
      <pre className="whitespace-pre-wrap text-sm text-foreground leading-relaxed">
        {aiResult.result}
      </pre>
    );
  };

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
            {renderContent()}
          </ScrollArea>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-6">
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
