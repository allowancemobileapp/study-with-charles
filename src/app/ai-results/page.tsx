
"use client";

import { useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, CalendarPlus, AlertTriangle, Copy } from "lucide-react";
import { useRouter } from 'next/navigation';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from "@/hooks/use-toast";

interface QAItem {
  Question: string | null | undefined;
  Answer: string | null | undefined;
}

export default function AiResultsPage() {
  const { aiResult } = useAppStore();
  const router = useRouter();
  const { toast } = useToast();

  const getFormattedContent = (): string => {
    if (!aiResult || !aiResult.result) return "";
    const resultText = aiResult.result;

    try {
      // Check if it's likely Q&A JSON
      if (resultText.trim().startsWith('[') && resultText.includes('"Question":') && resultText.includes('"Answer":')) {
        const parsed = JSON.parse(resultText) as QAItem[];
        if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'object' && parsed[0] !== null && 'Question' in parsed[0] && 'Answer' in parsed[0]) {
          return parsed.map((qa: QAItem, index: number) =>
              `Question ${index + 1}:\n${String(qa.Question ?? 'N/A')}\n\nAnswer:\n${String(qa.Answer ?? 'N/A')}\n\n---\n\n`
          ).join('');
        }
      }
    } catch (e) {
      // Not valid Q&A JSON, fall through to return raw text
      console.warn("getFormattedContent: Could not parse result as Q&A JSON. Error:", e);
    }
    return resultText; // Fallback for non-Q&A or if parsing failed
  };

  const handleDownload = () => {
    const contentToDownload = getFormattedContent();
    if (contentToDownload) {
      const blob = new Blob([contentToDownload], { type: 'text/plain;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'ai_result.txt';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      toast({
        title: "Download Started",
        description: "Your AI result is downloading.",
        className: "bg-primary/10 border-primary",
      });
    }
  };

  const handleCopy = async () => {
    const contentToCopy = getFormattedContent();
    if (contentToCopy) {
      try {
        await navigator.clipboard.writeText(contentToCopy);
        toast({
          title: "Copied to clipboard!",
          description: "The AI result has been copied.",
          className: "bg-green-500/10 border-green-500",
        });
      } catch (err) {
        console.error('Failed to copy: ', err);
        toast({
          title: "Copy Failed",
          description: "Could not copy the result to clipboard.",
          variant: "destructive",
        });
      }
    }
  };

  const handleSchedule = () => {
    router.push('/timetable?action=schedule_result');
  };

  const renderContent = () => {
    if (!aiResult || !aiResult.result) return <p className="text-muted-foreground">No result content to display.</p>;

    const resultText = aiResult.result;
    let isLikelyQnAJson = false;

    // Heuristic to check if it *might* be Q&A JSON before attempting to parse
    if (resultText.trim().startsWith('[') && resultText.includes('"Question":') && resultText.includes('"Answer":')) {
      isLikelyQnAJson = true;
    }

    if (isLikelyQnAJson) {
      try {
        const parsedResult = JSON.parse(resultText) as QAItem[];
        // Further validation that it is indeed an array of QA items
        if (Array.isArray(parsedResult) && parsedResult.length > 0 && typeof parsedResult[0] === 'object' && parsedResult[0] !== null && 'Question' in parsedResult[0] && 'Answer' in parsedResult[0]) {
          return (
            <div>
              {parsedResult.map((qa, index) => (
                <div key={index} className="mb-8 pb-6 border-b border-border/50 last:border-b-0 last:pb-0 last:mb-0">
                  <p className="text-lg font-semibold text-primary">Question:</p>
                  <p className="text-foreground mb-3 whitespace-pre-wrap">{String(qa.Question ?? 'N/A')}</p>
                  <p className="text-lg font-semibold text-accent">Answer:</p>
                  <p className="text-foreground whitespace-pre-wrap">{String(qa.Answer ?? 'N/A')}</p>
                </div>
              ))}
            </div>
          );
        }
      } catch (e) {
        // JSON.parse failed or structure was not as expected after all.
        // The console error you saw is from this catch block. It's okay, we'll fall back.
        console.error("AIResultsPage: Could not parse result as Q&A JSON. Error:", e, "Displaying raw text.");
      }
    }

    // Fallback for non-Q&A JSON, plain text, or if parsing/validation above fails
    return (
      <pre className="whitespace-pre-wrap text-sm text-foreground leading-relaxed">
        {resultText}
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
          <Button variant="outline" onClick={handleCopy} className="w-full sm:w-auto border-primary text-primary hover:bg-primary/10">
            <Copy className="mr-2 h-4 w-4" /> Copy Result
          </Button>
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

    