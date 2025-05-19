"use client";

import { useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, CalendarPlus, AlertTriangle, Copy } from "lucide-react"; // Added Copy
import { useRouter } from 'next/navigation';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from "@/hooks/use-toast"; // Added useToast

interface QAItem {
  Question: string;
  Answer: string;
}

export default function AiResultsPage() {
  const { aiResult, setAiResult } = useAppStore();
  const router = useRouter();
  const { toast } = useToast(); // Initialize toast

  useEffect(() => {
    // Optional: Clear result from store when component unmounts if it's single-use display
    // return () => {
    //   setAiResult(null);
    // };
  }, [setAiResult]);

  const getFormattedContent = (): string => {
    if (!aiResult || !aiResult.result) return "";
    try {
      const parsed = JSON.parse(aiResult.result);
      // Check if it's an array and the first item has 'Question' and 'Answer' keys
      if (Array.isArray(parsed) && parsed.length > 0 &&
          typeof parsed[0] === 'object' && parsed[0] !== null &&
          'Question' in parsed[0] && 'Answer' in parsed[0]) {
        
        // Double check all items are as expected if we want to be very strict
        const allItemsAreQA = parsed.every(
            (item: any) => typeof item === 'object' && item !== null &&
                           'Question' in item && typeof item.Question === 'string' &&
                           'Answer' in item && typeof item.Answer === 'string'
        );
        if (allItemsAreQA) {
            return (parsed as QAItem[]).map((qa: QAItem, index: number) =>
                `Question ${index + 1}:\n${String(qa.Question)}\n\nAnswer:\n${String(qa.Answer)}\n\n---\n\n`
            ).join('');
        }
      }
    } catch (e) {
      // Not JSON or not expected format, return raw result
    }
    return aiResult.result;
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

    try {
      const parsed = JSON.parse(aiResult.result);

      // Check if it's an array and the first item has 'Question' and 'Answer' keys
      if (Array.isArray(parsed) && parsed.length > 0 &&
          typeof parsed[0] === 'object' && parsed[0] !== null &&
          'Question' in parsed[0] && 'Answer' in parsed[0]) {

        // More robust check to ensure all items in the array fit the QAItem structure
        const allItemsAreValidQA = parsed.every(
          (item: any): item is QAItem =>
            typeof item === 'object' &&
            item !== null &&
            'Question' in item &&
            typeof item.Question === 'string' &&
            'Answer' in item &&
            typeof item.Answer === 'string'
        );

        if (allItemsAreValidQA) {
          return (
            <div>
              {(parsed as QAItem[]).map((qa, index) => (
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
      }
    } catch (e) {
      // If JSON.parse fails or structure is not as expected, fall through to render as pre.
      // console.warn("AIResultsPage: Could not parse result as Q&A JSON or structure mismatch. Rendering as raw text. Error:", e);
    }

    // Fallback for non-JSON, non-Q&A JSON, or if parsing/validation fails
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
