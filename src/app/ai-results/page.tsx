
"use client";

import React, { useEffect, useActionState, useState, useTransition, useRef } from 'react';
import NextImage from 'next/image'; // Renamed to avoid conflict with Genkit Image
import { useAppStore } from '@/lib/store';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, CalendarPlus, AlertTriangle, Copy, RefreshCw, Loader2, ArrowLeft, Send, Paperclip, X as XIcon, FileText, Volume2, PauseCircle, PlayCircle, StopCircle, Image as ImageIcon, Wand2 } from "lucide-react";
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { processAssignmentAction, type AssignmentFormState, processFollowUpAction, type FollowUpFormState, generateImageAction, type GenerateImageFormState } from '@/lib/actions';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


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
  followUpImageUrl: null,
};

const initialImageGenerationState: GenerateImageFormState = {
  message: null,
  errors: {},
  imageUrl: null,
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

  const [followUpFileDataUri, setFollowUpFileDataUri] = useState<string | null>(null);
  const [selectedFollowUpFile, setSelectedFollowUpFile] = useState<File | null>(null);
  const followUpFileInputRef = useRef<HTMLInputElement>(null);

  const [followUpState, submitFollowUpAction, isSubmittingFollowUp] = useActionState(processFollowUpAction, initialFollowUpState);

  // Image Generation State
  const [imagePrompt, setImagePrompt] = useState("");
  const [generatedDiagramUrl, setGeneratedDiagramUrl] = useState<string | null>(null);
  const [imageGenerationState, submitImageGenerationAction, isGeneratingImage] = useActionState(generateImageAction, initialImageGenerationState);


  // TTS State
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string | null>(null);


  useEffect(() => {
    setCurrentDisplayResult(aiResult?.result || "");
  }, [aiResult]);

  // Load and select TTS voices
  useEffect(() => {
    const populateVoiceList = () => {
      if (typeof speechSynthesis === 'undefined') {
        return;
      }
      const voices = speechSynthesis.getVoices();
      setAvailableVoices(voices);
      // console.log("Available TTS voices:", voices.map(v => ({name: v.name, lang: v.lang, local: v.localService, default: v.default})));

      if (voices.length > 0 && !selectedVoiceName) {
        let preferredVoice = voices.find(voice => voice.lang === 'en-US' && voice.localService);
        if (!preferredVoice) preferredVoice = voices.find(voice => voice.lang === 'en-GB' && voice.localService);
        if (!preferredVoice) preferredVoice = voices.find(voice => voice.lang === 'en-US');
        if (!preferredVoice) preferredVoice = voices.find(voice => voice.lang.startsWith('en-') && voice.localService);
        if (!preferredVoice) preferredVoice = voices.find(voice => voice.lang.startsWith('en-'));
        if (!preferredVoice) preferredVoice = voices.find(voice => voice.default); // Fallback to default

        if (preferredVoice) {
          setSelectedVoiceName(preferredVoice.name);
          // console.log("Selected TTS Voice:", preferredVoice.name, "(Lang:", preferredVoice.lang, "Local:", preferredVoice.localService,")");
        } else if (voices[0]) {
           setSelectedVoiceName(voices[0].name); // Fallback to the first available voice
           // console.log("Fell back to first available TTS Voice:", voices[0].name);
        }
      }
    };

    populateVoiceList();
    if (typeof speechSynthesis !== 'undefined' && speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = populateVoiceList;
    }

    return () => {
      if (typeof speechSynthesis !== 'undefined') {
        speechSynthesis.onvoiceschanged = null;
      }
    };
  }, [selectedVoiceName]);


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
        });
      }
      else if (generateMoreFormState.result && generateMoreFormState.result.result) {
        toast({
          title: "More Q&A Generated!",
          description: generateMoreFormState.message || "New Q&A has been generated.",
          variant: "default",
          className: "bg-green-500/10 border-green-500",
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
          setAiResult({ result: combinedResultString, imageUrl: aiResult?.imageUrl || generateMoreFormState.result.imageUrl });
        } else if (newQaText) { 
          setAiResult({ result: newQaText, imageUrl: aiResult?.imageUrl || generateMoreFormState.result.imageUrl });
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
        const newResultText = `${currentDisplayResult}\n\n---\n\n**Your Question/File:** ${previousFollowUpQuestionForDisplay || (selectedFollowUpFile ? selectedFollowUpFile.name : "Attached File")}\n\n**Answer:**\n${followUpState.followUpAnswer}`;
        setAiResult({ result: newResultText, imageUrl: followUpState.followUpImageUrl || aiResult?.imageUrl }); 
        setFollowUpQuestion(""); 
        setPreviousFollowUpQuestionForDisplay("");
        setSelectedFollowUpFile(null);
        setFollowUpFileDataUri(null);
        if (followUpFileInputRef.current) followUpFileInputRef.current.value = "";
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

  // Effect for Image Generation Action
  useEffect(() => {
    if (imageGenerationState) {
      if (imageGenerationState.errors && Object.keys(imageGenerationState.errors).length > 0) {
        toast({
          title: "Image Generation Error",
          description: imageGenerationState.message || "Could not generate image.",
          variant: "destructive",
        });
        setGeneratedDiagramUrl(null);
      } else if (imageGenerationState.imageUrl) {
        toast({
          title: "Image Generated!",
          description: imageGenerationState.message || "Your image is ready.",
          className: "bg-green-500/10 border-green-500",
        });
        setGeneratedDiagramUrl(imageGenerationState.imageUrl);
        if (!isSubscribed) {
          setShowVideoAd(true);
        }
      } else if (imageGenerationState.message) {
        toast({
          title: "Image Generation Info",
          description: imageGenerationState.message,
        });
         setGeneratedDiagramUrl(null);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageGenerationState]);

  // TTS Cleanup
  useEffect(() => {
    return () => {
      if (typeof speechSynthesis !== 'undefined' && speechSynthesis.speaking) {
        speechSynthesis.cancel();
      }
    };
  }, []);


  const getFormattedContent = (forPlainTextDisplay = false): string => {
    if (!currentDisplayResult) return "";

    if (lastAiInput?.desiredFormat === 'Question Answering' && isQAResult(currentDisplayResult)) {
      try {
        const parsed = JSON.parse(currentDisplayResult) as QAItem[];
        if (forPlainTextDisplay) {
            return parsed.map(qa => `Question: ${String(qa.Question ?? 'N/A')}\nAnswer: ${String(qa.Answer ?? 'N/A')}`).join('\n\n---\n\n');
        }
        return currentDisplayResult; 
      } catch (e) {
        console.error("getFormattedContent: Could not parse Q&A JSON for formatting. Error:", e);
        if (typeof e === 'object' && e !== null && 'message' in e) {
            console.error("Problematic JSON (first 100 chars):", currentDisplayResult.substring(0,100) + (currentDisplayResult.length > 100 ? "..." : ""));
        }
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
    formData.append('desiredFormat', 'Question Answering'); 

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

  const handleFollowUpFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) { // 4MB limit
        toast({
          title: "File Too Large",
          description: "Please upload a file smaller than 4MB for follow-up.",
          variant: "destructive",
        });
        setSelectedFollowUpFile(null);
        setFollowUpFileDataUri(null);
        if(followUpFileInputRef.current) followUpFileInputRef.current.value = ""; 
        return;
      }
      setSelectedFollowUpFile(file);
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        setFollowUpFileDataUri(loadEvent.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setSelectedFollowUpFile(null);
      setFollowUpFileDataUri(null);
    }
  };

  const handleRemoveFollowUpFile = () => {
    setSelectedFollowUpFile(null);
    setFollowUpFileDataUri(null);
    if (followUpFileInputRef.current) {
      followUpFileInputRef.current.value = "";
    }
  };


  const [, startFollowUpTransition] = useTransition();
  const handleFollowUpSubmit = () => {
    if (!isLoggedIn) {
      toast({ title: "Please Sign In", description: "You need to be signed in to ask follow-up questions.", variant: "destructive" });
      return;
    }
    if (!followUpQuestion.trim() && !followUpFileDataUri) {
      toast({ title: "Empty Input", description: "Please type a follow-up question or attach a file.", variant: "destructive" });
      return;
    }
    if (!currentDisplayResult || !lastAiInput || !lastAiInput.subjectTitle || !lastAiInput.desiredFormat) {
      toast({ title: "Context Missing", description: "Cannot process follow-up without original context. Please try generating a new result first.", variant: "destructive" });
      return;
    }

    setPreviousFollowUpQuestionForDisplay(followUpQuestion); 

    const formData = new FormData();
    formData.append('previousResultText', currentDisplayResult);
    formData.append('followUpQuery', followUpQuestion.trim());
    formData.append('subjectTitle', lastAiInput.subjectTitle);
    formData.append('desiredFormat', lastAiInput.desiredFormat);
    if (followUpFileDataUri) {
      formData.append('fileDataUri', followUpFileDataUri);
    }

    startFollowUpTransition(() => {
        submitFollowUpAction(formData);
    });
  };

  const [, startImageGenerationTransition] = useTransition();
  const handleGenerateImage = () => {
    if (!isLoggedIn) {
        toast({ title: "Please Sign In", description: "You need to be signed in to generate images.", variant: "destructive" });
        return;
    }
    if (!imagePrompt.trim()) {
        toast({ title: "Empty Prompt", description: "Please enter a prompt to generate an image.", variant: "destructive" });
        return;
    }
    setGeneratedDiagramUrl(null); // Clear previous image

    const formData = new FormData();
    formData.append('prompt', imagePrompt.trim());
    
    startImageGenerationTransition(() => {
        submitImageGenerationAction(formData);
    });
  };

  const handleTTS = () => {
    if (!('speechSynthesis' in window)) {
      toast({ title: "TTS Not Supported", description: "Your browser does not support text-to-speech.", variant: "destructive" });
      return;
    }

    if (isSpeaking) {
      if (isPaused) { // Resume
        speechSynthesis.resume();
        setIsPaused(false);
      } else { // Pause
        speechSynthesis.pause();
        setIsPaused(true);
      }
    } else { // Start speaking
      const textToSpeak = getFormattedContent(true);
      if (!textToSpeak.trim()) {
        toast({ title: "Nothing to read", description: "There is no content to read aloud.", variant: "default" });
        return;
      }
      
      if (speechSynthesis.speaking || speechSynthesis.pending) {
        speechSynthesis.cancel(); // This might cause an "interrupted" error, which is now handled.
      }

      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      
      const voiceToUse = availableVoices.find(v => v.name === selectedVoiceName);
      if (voiceToUse) {
        utterance.voice = voiceToUse;
        // console.log("Using voice for TTS:", voiceToUse.name);
      } else {
        // console.warn("Selected voice not found, using browser default.");
      }
      utterance.rate = 0.9; 
      utterance.pitch = 1; 

      utterance.onstart = () => {
        setIsSpeaking(true);
        setIsPaused(false);
      };
      utterance.onend = () => {
        setIsSpeaking(false);
        setIsPaused(false);
        utteranceRef.current = null;
      };
      utterance.onerror = (event) => {
        if (event.error === 'interrupted') {
          console.log("Speech synthesis was interrupted (event.error: interrupted). This is often normal (e.g., user stopped or started new speech).");
          // Don't show a user-facing error toast for intentional interruptions.
        } else {
          console.error("Speech synthesis error:", event.error);
          toast({ title: "TTS Error", description: `Could not play audio: ${event.error || 'Unknown TTS error'}`, variant: "destructive" });
        }
        setIsSpeaking(false);
        setIsPaused(false);
        utteranceRef.current = null;
      };
      utteranceRef.current = utterance;
      speechSynthesis.speak(utterance);
    }
  };

  const handleStopTTS = () => {
     if ('speechSynthesis' in window && (speechSynthesis.speaking || speechSynthesis.pending)) {
        speechSynthesis.cancel();  // This will likely trigger utterance.onerror with "interrupted"
    }
    setIsSpeaking(false);
    setIsPaused(false);
    utteranceRef.current = null;
  }


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
          </div>
        );
      } catch (e) {
        console.error("Error parsing Q&A JSON in renderContent:", e, "\nProblematic JSON (first 200 chars):", currentDisplayResult.substring(0, 200) + (currentDisplayResult.length > 200 ? "..." : ""));
        return (
             <div className="whitespace-pre-wrap text-sm text-foreground leading-relaxed p-4">
                {currentDisplayResult}
             </div>
        );
      }
    }
    return (
      <div className="whitespace-pre-wrap text-sm text-foreground leading-relaxed p-4">
        {currentDisplayResult}
      </div>
    );
  };

  if (!aiResult && !isGeneratingMore && !isSubmittingFollowUp && !isGeneratingImage) {
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
    (followUpState?.errors?.general && !isSubmittingFollowUp) ||
    (imageGenerationState?.errors?.general && !isGeneratingImage);


  if (generalActionError) {
     const errorMessage = 
        (generateMoreFormState?.errors?.general?.join(' ')) ||
        (followUpState?.errors?.general?.join(' ')) || 
        (imageGenerationState?.errors?.general?.join(' ')) || "An unexpected error occurred.";
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
  const isLoading = isLoadingMore || isSubmittingFollowUp || isGeneratingImage;


  return (
    <div className="container mx-auto py-8 px-4 pb-36 space-y-8"> 
       <Button variant="outline" onClick={() => { handleStopTTS(); router.back(); }} className="mb-4 border-primary text-primary hover:bg-primary/10">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
      
      {/* Main AI Result Card */}
      <Card className="w-full max-w-3xl mx-auto shadow-2xl border-accent/50 bg-card/80 backdrop-blur-sm relative">
        <CardHeader className="flex flex-row justify-between items-start">
          <div>
            <CardTitle className="text-3xl font-bold text-primary">
              Study Results...
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Here's the content processed by our AI.
            </CardDescription>
          </div>
           <div className="flex items-center space-x-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                   <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleTTS}
                    className="text-muted-foreground hover:text-primary p-1 h-8 w-8"
                    aria-label={isSpeaking && !isPaused ? "Pause reading" : (isSpeaking && isPaused ? "Resume reading" : "Read result aloud")}
                    title={isSpeaking && !isPaused ? "Pause reading" : (isSpeaking && isPaused ? "Resume reading" : "Read result aloud")}
                    disabled={isLoading}
                  >
                    {isSpeaking && !isPaused ? <PauseCircle className="h-5 w-5" /> : (isSpeaking && isPaused ? <PlayCircle className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />)}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isSpeaking && !isPaused ? "Pause reading" : (isSpeaking && isPaused ? "Resume reading" : "Read result aloud")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
             {isSpeaking && (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleStopTTS}
                            className="text-destructive hover:text-destructive/80 p-1 h-8 w-8"
                            aria-label="Stop reading"
                            title="Stop reading"
                        >
                            <StopCircle className="h-5 w-5" />
                        </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Stop reading</p></TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            )}
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleCopy}
                            className="text-muted-foreground hover:text-primary p-1 h-8 w-8"
                            aria-label="Copy result"
                            title="Copy result"
                            disabled={isLoading}
                        >
                            <Copy className="h-5 w-5" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Copy result</p></TooltipContent>
                </Tooltip>
            </TooltipProvider>
           </div>
        </CardHeader>
        <CardContent className="rounded-md min-h-[200px]"> 
            {isLoadingMore ? (
                <div className="flex flex-col items-center justify-center h-full"> 
                    <Loader2 className="h-12 w-12 animate-spin text-primary mb-2" />
                    <p className="text-muted-foreground">Generating more Q&A...</p>
                </div>
            ) : (
              <div className="p-1">{renderContent()}</div>
            )}
            {aiResult?.imageUrl && (
                <div className="mt-6 p-4 border-t border-border/30">
                    <NextImage src={aiResult.imageUrl} alt="AI Generated Content Image" width={300} height={300} className="rounded-md shadow-md mx-auto" data-ai-hint="abstract illustration" />
                </div>
            )}
        </CardContent>
        {lastAiInput?.desiredFormat === 'Question Answering' && (
          <CardFooter className="flex flex-col sm:flex-row justify-center items-center pt-6 space-y-3 sm:space-y-0">
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
          </CardFooter>
        )}
      </Card>

      {/* Image Generation / Diagrams Card */}
      <Card className="w-full max-w-3xl mx-auto shadow-2xl border-primary/30 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary flex items-center">
            <ImageIcon className="mr-3 h-6 w-6" /> Diagrams / Image Generation
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Type a prompt to generate a new image or diagram.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="image-prompt" className="text-foreground">Image Prompt</Label>
            <Textarea
              id="image-prompt"
              placeholder="e.g., A futuristic cityscape at dawn, A diagram of the human heart"
              value={imagePrompt}
              onChange={(e) => setImagePrompt(e.target.value)}
              className="focus-visible:ring-primary"
              rows={3}
              disabled={isGeneratingImage}
            />
             {imageGenerationState?.errors?.prompt && <p className="text-sm text-destructive mt-1">{imageGenerationState.errors.prompt.join(', ')}</p>}
          </div>
          <Button onClick={handleGenerateImage} disabled={isGeneratingImage || !imagePrompt.trim()} className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground">
            {isGeneratingImage ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Wand2 className="mr-2 h-4 w-4" />
            )}
            Generate Image
          </Button>

          {isGeneratingImage && (
            <div className="flex flex-col items-center justify-center min-h-[200px] p-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-3" />
              <p className="text-muted-foreground">Generating your image... this can take a moment.</p>
            </div>
          )}
          
          {imageGenerationState?.errors?.general && !isGeneratingImage &&(
             <Alert variant="destructive" className="mt-4">
                <AlertTriangle className="h-4 w-4"/>
                <AlertTitle>Image Generation Error</AlertTitle>
                <AlertDescription>{imageGenerationState.errors.general.join(' ')}</AlertDescription>
            </Alert>
          )}

          {generatedDiagramUrl && !isGeneratingImage && (
            <div className="mt-6 p-4 border-t border-border/30 rounded-md bg-secondary/20">
              <h3 className="text-lg font-semibold text-foreground mb-3">Generated Image:</h3>
              <NextImage
                src={generatedDiagramUrl}
                alt="AI Generated Diagram/Image"
                width={512}
                height={512}
                className="rounded-md shadow-lg mx-auto border border-border"
                data-ai-hint="diagram illustration"
              />
            </div>
          )}
           {!generatedDiagramUrl && !isGeneratingImage && !imageGenerationState?.errors?.general && (
             <div className="flex flex-col items-center justify-center min-h-[100px] p-4 text-muted-foreground">
                <ImageIcon className="h-10 w-10 mb-2 opacity-50" />
                <p>Your generated image will appear here.</p>
             </div>
           )}
        </CardContent>
      </Card>


      {/* Follow-up Bar */}
      <div className="fixed bottom-4 left-0 right-0 z-20 flex justify-center px-4 pointer-events-none">
        <div className="bg-card/95 border border-border/70 shadow-2xl p-3 backdrop-blur-sm rounded-xl flex items-center gap-2 w-full max-w-2xl pointer-events-auto">
          <Input
            type="text"
            placeholder="Ask a follow-up question or attach a file..."
            value={followUpQuestion}
            onChange={(e) => setFollowUpQuestion(e.target.value)}
            className="flex-grow focus-visible:ring-primary"
            disabled={isSubmittingFollowUp}
            onKeyDown={(e) => e.key === 'Enter' && !isSubmittingFollowUp && (followUpQuestion.trim() || followUpFileDataUri) && handleFollowUpSubmit()}
          />
           <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => followUpFileInputRef.current?.click()}
                        className="text-muted-foreground hover:text-primary p-1 h-8 w-8"
                        aria-label="Attach file for follow-up"
                        disabled={isSubmittingFollowUp}
                    >
                        <Paperclip className="h-5 w-5" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent><p>Attach file (Max 4MB)</p></TooltipContent>
            </Tooltip>
           </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" onClick={handleDownload} className="text-primary hover:bg-primary/10 border-primary" disabled={isSubmittingFollowUp}>
                        <Download className="h-5 w-5" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent><p>Download Result</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" onClick={handleSchedule} className="text-accent hover:bg-accent/10 border-accent" disabled={isSubmittingFollowUp}>
                        <CalendarPlus className="h-5 w-5" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent><p>Schedule Result</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
           <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button 
                        variant="default" 
                        size="icon" 
                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                        onClick={handleFollowUpSubmit}
                        disabled={isSubmittingFollowUp || (!followUpQuestion.trim() && !followUpFileDataUri)}
                        >
                        {isSubmittingFollowUp ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                    </Button>
                </TooltipTrigger>
                <TooltipContent><p>Send follow-up</p></TooltipContent>
            </Tooltip>
           </TooltipProvider>
        </div>
      </div>
      <input
        id="follow-up-file-upload-hidden"
        ref={followUpFileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.txt,.md,.docx"
        onChange={handleFollowUpFileChange}
        className="hidden"
      />
      {selectedFollowUpFile && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-20 bg-secondary/90 text-sm text-muted-foreground p-2 rounded-md border shadow-md flex items-center gap-2 max-w-xs pointer-events-auto">
          <FileText className="mr-1 h-4 w-4 text-primary shrink-0" />
          <span className="truncate" title={selectedFollowUpFile.name}>{selectedFollowUpFile.name}</span>
          <Button variant="ghost" size="icon" onClick={handleRemoveFollowUpFile} className="text-destructive hover:text-destructive/80 h-6 w-6 p-1 shrink-0 ml-1">
            <XIcon className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
}
