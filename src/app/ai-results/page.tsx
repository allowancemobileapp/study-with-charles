
"use client";

import React, { useEffect, useActionState, useState, useTransition } from 'react';
import Image from 'next/image';
import { useAppStore } from '@/lib/store';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, CalendarPlus, AlertTriangle, Copy, RefreshCw, Loader2, CheckCircle, AlertCircle as AlertCircleIcon, ArrowLeft, Send } from "lucide-react";
import { useRouter } from 'next/navigation';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from "@/hooks/use-toast";
import { processAssignmentAction, type AssignmentFormState, processFollowUpAction, type FollowUpFormState } from '@/lib/actions';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface QAItem {
  Question: string | null | undefined;
  Answer: string | null | undefined;
}

const initialGenerateMoreState: AssignmentFormState = {
  message: null,
  errors: {},
  result: null,
};

const initialFollowUpState: FollowUpFormState = {
  message: null,
  errors: {},
  followUpAnswer: null,
};


export default function AiResultsPage() {
  const {
    aiResult,
    lastAiInput,
    setAiResult,
    isSubscribed,
    setShowVideoAd,
    isLoggedIn
  } = useAppStore();
  const router = useRouter();
  const { toast } = useToast();

  const [generateMoreFormState, generateMoreAction, isGeneratingMore] = useActionState(processAssignmentAction, initialGenerateMoreState);
  const [currentDisplayResult, setCurrentDisplayResult] = useState(aiResult?.result || "");
  const [followUpQuestion, setFollowUpQuestion] = useState("");
  const [previousFollowUpQuestionForDisplay, setPreviousFollowUpQuestionForDisplay] = useState("");


  // Action state for follow-up questions
  const [followUpState, submitFollowUpAction, isSubmittingFollowUp] = useActionState(processFollowUpAction, initialFollowUpState);

  useEffect(() => {
    setCurrentDisplayResult(aiResult?.result || "");
  }, [aiResult]);


  const isQAResult = (text: string): boolean => {
    if (!text) return false;
    try {
      const parsed = JSON.parse(text);
      return Array.isArray(parsed) && parsed.length > 0 &&
             parsed[0] && typeof parsed[0] === 'object' &&
             'Question' in parsed[0] && 'Answer' in parsed[0];
    } catch (e) {
      return false;
    }
  };

  useEffect(() => {
    if (generateMoreFormState) {
      if (generateMoreFormState.errors && Object.keys(generateMoreFormState.errors).length > 0 && !generateMoreFormState.result) {
        const errorMessages = Object.values(generateMoreFormState.errors).flat().join(' ') || (generateMoreFormState.message || "An error occurred while generating more Q&A.");
        toast({
          title: "Error Generating More",
          description: errorMessages,
          variant: "destructive",
          icon: <AlertCircleIcon className="text-red-500" />,
        });
      }
      else if (generateMoreFormState.result && generateMoreFormState.result.result) {
        toast({
          title: "More Q&A Generated!",
          description: generateMoreFormState.message || "New Q&A has been generated.",
          variant: "default",
          className: "bg-green-500/10 border-green-500",
          icon: <CheckCircle className="text-green-500" />,
        });

        const newQaText = generateMoreFormState.result.result;
        let combinedQaArray: QAItem[] = [];

        const currentStoredQaText = useAppStore.getState().aiResult?.result;

        if (currentStoredQaText && isQAResult(currentStoredQaText)) {
          try {
            combinedQaArray = combinedQaArray.concat(JSON.parse(currentStoredQaText));
          } catch (e) {
            console.error("Error parsing current stored Q&A for appending:", e);
          }
        }

        if (isQAResult(newQaText)) {
          try {
            combinedQaArray = combinedQaArray.concat(JSON.parse(newQaText));
          } catch (e) {
            console.error("Error parsing new Q&A for appending:", e);
          }
        }

        const uniqueQaMap = new Map<string, QAItem>();
        combinedQaArray.forEach(item => {
          if (item.Question) {
            uniqueQaMap.set(item.Question, item);
          } else if (item.Answer) {
             uniqueQaMap.set(`answer_only_${uniqueQaMap.size}`, item);
          }
        });
        const uniqueCombinedQaArray = Array.from(uniqueQaMap.values());

        if (uniqueCombinedQaArray.length > 0) {
          const combinedResultString = JSON.stringify(uniqueCombinedQaArray);
          setAiResult({ result: combinedResultString, imageUrl: aiResult?.imageUrl });
        } else if (newQaText) { 
          setAiResult({ result: newQaText, imageUrl: aiResult?.imageUrl });
        }


        if (!isSubscribed) {
          setShowVideoAd(true);
        }
      }
      else if (generateMoreFormState.message && !generateMoreFormState.result && !(generateMoreFormState.errors && Object.keys(generateMoreFormState.errors).length > 0)) {
         toast({
          title: "Info",
          description: generateMoreFormState.message,
          variant: "default",
        });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generateMoreFormState]);

  // Effect for handling follow-up action state
  useEffect(() => {
    if (followUpState) {
      if (followUpState.errors && Object.keys(followUpState.errors).length > 0) {
        toast({
          title: "Follow-up Error",
          description: followUpState.message || "Could not process follow-up.",
          variant: "destructive",
        });
      } else if (followUpState.followUpAnswer) {
        toast({
          title: "Follow-up Processed!",
          description: "Here's the response to your follow-up.",
          className: "bg-green-500/10 border-green-500",
        });
        const newResultText = `${currentDisplayResult}\n\n---\n\n**Your Question:** ${previousFollowUpQuestionForDisplay}\n\n**Answer:**\n${followUpState.followUpAnswer}`;
        setAiResult({ result: newResultText, imageUrl: aiResult?.imageUrl });
        setFollowUpQuestion(""); // Clear input
        setPreviousFollowUpQuestionForDisplay("");
         if (!isSubscribed) {
          setShowVideoAd(true);
        }
      } else if (followUpState.message) {
         toast({
          title: "Info",
          description: followUpState.message,
         });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [followUpState]);


  const getFormattedContent = (forPlainTextDisplay = false): string => {
    if (!currentDisplayResult) return "";

    if (lastAiInput?.desiredFormat === 'Question Answering' && isQAResult(currentDisplayResult)) {
      try {
        const parsed = JSON.parse(currentDisplayResult) as QAItem[];
        return parsed.map((qa, index) =>
            `Question:\n${String(qa.Question ?? 'N/A')}\n\nAnswer:\n${String(qa.Answer ?? 'N/A')}`
          ).join('\n\n---\n\n');
      } catch (e) {
        console.error("getFormattedContent: Could not parse Q&A JSON for formatting. Error:", e, "Problematic JSON:", currentDisplayResult.substring(0,100));
        return currentDisplayResult; 
      }
    }
    return currentDisplayResult;
  };

  const handleCopy = async () => {
    const contentToCopy = getFormattedContent(true);
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

  const [, startGenerateMoreTransition] = useTransition();
  const handleGenerateMore = () => {
    if (!isLoggedIn) {
      toast({ title: "Please Sign In", description: "You need to be signed in to generate more results.", variant: "destructive" });
      return;
    }
    if (!lastAiInput || !lastAiInput.subjectTitle) {
      toast({ title: "Cannot Generate More", description: "Original query details not found. Please try a new query from the Study page.", variant: "destructive" });
      return;
    }

    const formData = new FormData();
    if (lastAiInput.fileDataUri) {
      formData.append('fileDataUri', lastAiInput.fileDataUri);
    }
    if (lastAiInput.userTextQuery) {
      formData.append('userTextQuery', lastAiInput.userTextQuery);
    }
    formData.append('subjectTitle', lastAiInput.subjectTitle);
    formData.append('desiredFormat', 'Question Answering'); // Always Q&A for "generate more"

    startGenerateMoreTransition(() => {
      generateMoreAction(formData);
    });
  };

  const handleDownload = () => {
    const contentToDownload = getFormattedContent(true);
    if (contentToDownload) {
      const blob = new Blob([contentToDownload], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'study-result.txt';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast({
        title: "Download Started",
        description: "Your result is being downloaded.",
        className: "bg-blue-500/10 border-blue-500",
      });
    } else {
      toast({
        title: "Download Failed",
        description: "No content to download.",
        variant: "destructive",
      });
    }
  };

  const [, startFollowUpTransition] = useTransition();
  const handleFollowUpSubmit = () => {
    if (!isLoggedIn) {
      toast({ title: "Please Sign In", description: "You need to be signed in to ask follow-up questions.", variant: "destructive" });
      return;
    }
    if (!followUpQuestion.trim()) {
      toast({ title: "Empty Question", description: "Please type your follow-up question.", variant: "destructive" });
      return;
    }
    if (!currentDisplayResult || !lastAiInput || !lastAiInput.subjectTitle || !lastAiInput.desiredFormat) {
      toast({ title: "Context Missing", description: "Cannot process follow-up without original context. Please try generating a new result first.", variant: "destructive" });
      return;
    }

    setPreviousFollowUpQuestionForDisplay(followUpQuestion); // Store for display after AI response

    const formData = new FormData();
    formData.append('previousResultText', currentDisplayResult);
    formData.append('followUpQuery', followUpQuestion.trim());
    formData.append('subjectTitle', lastAiInput.subjectTitle);
    formData.append('desiredFormat', lastAiInput.desiredFormat);

    startFollowUpTransition(() => {
        submitFollowUpAction(formData);
    });
  };


  const renderContent = () => {
    if (!currentDisplayResult) return <p className="text-muted-foreground">No result content to display.</p>;

    if (lastAiInput?.desiredFormat === 'Question Answering' && isQAResult(currentDisplayResult)) {
      try {
        const parsedResult = JSON.parse(currentDisplayResult) as QAItem[];
        return (
          <div>
            {parsedResult.map((qa, index) => (
              <div key={index} className="mb-8 pb-6 border-b border-border/50 last:border-b-0 last:pb-0 last:mb-0">
                <h4 className="text-lg font-semibold text-primary mb-1">Question:</h4>
                <p className="text-foreground whitespace-pre-wrap">{String(qa.Question ?? 'N/A')}</p>
                <h4 className="text-lg font-semibold text-accent mt-3 mb-1">Answer:</h4>
                <p className="text-foreground whitespace-pre-wrap">{String(qa.Answer ?? 'N/A')}</p>
              </div>
            ))}
            {aiResult?.imageUrl && (
              <div className="mt-6">
                <Image src={aiResult.imageUrl} alt="AI Generated Image" width={300} height={300} className="rounded-md shadow-md" data-ai-hint="abstract illustration" />
              </div>
            )}
          </div>
        );
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Unknown error";
        console.error("Error parsing Q&A JSON in renderContent:", errorMessage, "\nProblematic JSON (first 200 chars):", currentDisplayResult.substring(0, 200) + (currentDisplayResult.length > 200 ? "..." : ""));
        return (
             <div className="whitespace-pre-wrap text-sm text-foreground leading-relaxed">
                {currentDisplayResult}
             </div>
        );
      }
    }

    return (
      <div>
        <div className="whitespace-pre-wrap text-sm text-foreground leading-relaxed">
          {currentDisplayResult}
        </div>
        {aiResult?.imageUrl && (
          <div className="mt-6">
             <Image src={aiResult.imageUrl} alt="AI Generated Image" width={300} height={300} className="rounded-md shadow-md" data-ai-hint="abstract illustration"/>
          </div>
        )}
      </div>
    );
  };

  if (!aiResult && !isGeneratingMore && !isSubmittingFollowUp) {
    return (
      <div className="container mx-auto py-8 px-4 flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <Button variant="outline" onClick={() => router.back()} className="absolute top-20 left-4 sm:left-8 border-primary text-primary hover:bg-primary/10 self-start">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Card className="w-full max-w-md text-center bg-card/70 border-destructive/50 shadow-lg mt-16 sm:mt-0">
          <CardHeader>
            <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
            <CardTitle className="text-2xl text-destructive">No Result Found</CardTitle>
            <CardDescription className="text-muted-foreground mt-2">
              It seems there's no study results to display. Please try generating one first.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => router.push('/')} className="w-full bg-primary text-primary-foreground">
              Go to Study
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const generalActionError = 
    (generateMoreFormState?.errors?.general && !isGeneratingMore) || 
    (followUpState?.errors?.general && !isSubmittingFollowUp);

  if (generalActionError) {
     const errorMessage = 
        (generateMoreFormState?.errors?.general?.join(' ')) ||
        (followUpState?.errors?.general?.join(' ')) || "An unexpected error occurred.";
     return (
      <div className="container mx-auto py-8 px-4 flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
         <Button variant="outline" onClick={() => router.back()} className="absolute top-20 left-4 sm:left-8 border-primary text-primary hover:bg-primary/10 self-start">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Alert variant="destructive" className="max-w-md mt-16 sm:mt-0">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Processing Request</AlertTitle>
          <AlertDescription>
            {errorMessage}
             <Button onClick={() => router.push('/')} className="w-full mt-4 bg-primary text-primary-foreground">
              Go to Study
            </Button>
          </AlertDescription>
        </Alert>
      </div>
     )
  }

  const isLoadingMore = isGeneratingMore && (!currentDisplayResult || (currentDisplayResult && isQAResult(currentDisplayResult) && generateMoreFormState.result === null));
  const isLoading = isLoadingMore || isSubmittingFollowUp;


  return (
    <div className="container mx-auto py-8 px-4 pb-28"> 
       <Button variant="outline" onClick={() => router.back()} className="mb-4 border-primary text-primary hover:bg-primary/10">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
      <Card className="w-full max-w-3xl mx-auto shadow-2xl border-accent/50 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-primary">
            Study Results...
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Here's the content processed by our AI based on your request.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative w-full">
            <ScrollArea className="h-[400px] w-full rounded-md border border-border p-4 bg-secondary/30">
              {isLoadingMore ?
                <div className="flex flex-col items-center justify-center h-full">
                   <Loader2 className="h-12 w-12 animate-spin text-primary mb-2" />
                   <p className="text-muted-foreground">Generating more Q&A...</p>
                </div>
               : renderContent()}
            </ScrollArea>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCopy}
              className="absolute top-2 right-2 text-muted-foreground hover:text-primary p-1 h-8 w-8 z-10"
              aria-label="Copy result"
              title="Copy result"
            >
              <Copy className="h-5 w-5" />
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-center items-center pt-6 space-y-3 sm:space-y-0">
            {lastAiInput?.desiredFormat === 'Question Answering' && (
              <Button
                onClick={handleGenerateMore}
                disabled={isLoading}
                variant="outline"
                className="flex-grow sm:flex-grow-0 border-accent text-accent hover:bg-accent/10"
              >
                {isLoadingMore ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Generate More Q&amp;A
              </Button>
            )}
        </CardFooter>
      </Card>

      {/* Stationary Follow-up Bar */}
      <div className="fixed bottom-4 left-0 right-0 z-20 flex justify-center px-4 pointer-events-none">
        <div className="bg-card/95 border border-border/70 shadow-2xl p-3 backdrop-blur-sm rounded-xl flex items-center gap-2 w-full max-w-2xl pointer-events-auto">
          <Input
            type="text"
            placeholder="Ask a follow-up question..."
            value={followUpQuestion}
            onChange={(e) => setFollowUpQuestion(e.target.value)}
            className="flex-grow focus-visible:ring-primary"
            disabled={isSubmittingFollowUp}
          />
          <Button variant="outline" size="icon" onClick={handleDownload} title="Download Result" className="text-primary hover:bg-primary/10 border-primary" disabled={isSubmittingFollowUp}>
            <Download className="h-5 w-5" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleSchedule} title="Schedule Result" className="text-accent hover:bg-accent/10 border-accent" disabled={isSubmittingFollowUp}>
            <CalendarPlus className="h-5 w-5" />
          </Button>
           <Button 
            variant="default" 
            size="icon" 
            title="Send follow-up" 
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={handleFollowUpSubmit}
            disabled={isSubmittingFollowUp || !followUpQuestion.trim()}
            >
            {isSubmittingFollowUp ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
    

    