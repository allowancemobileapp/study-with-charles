
"use client";

import React, { useState, useRef, useEffect, useActionState, useTransition } from 'react';
import { processAssignmentAction, type AssignmentFormState } from '@/lib/actions';
import { useAppStore, type DesiredFormatType } from '@/lib/store';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle as AlertCircleIconLucide, CheckCircle, Loader2, FileText, ListChecks, Paperclip, X as XIcon, Brain, PencilLine } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

const initialState: AssignmentFormState = {
  message: null,
  errors: {},
  result: null,
};

const EMOJI_LIST = ['😊', '📚', '💡', '👍', '✨', '🚀', '🧠', '🤓', '🎉', '🤖'];
const EMOJI_INTERVAL = 2500;

export function AssignmentForm() {
  const [formState, formAction, isProcessing] = useActionState(processAssignmentAction, initialState);
  const [, startTransition] = useTransition();
  
  const { setAiResult, isSubscribed, setShowVideoAd, isLoggedIn, setLastAiInput } = useAppStore();
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileDataUri, setFileDataUri] = useState<string | null>(null);
  const [subjectTitle, setSubjectTitle] = useState('');
  const [desiredFormat, setDesiredFormat] = useState<DesiredFormatType | undefined>();
  const [userTextQuery, setUserTextQuery] = useState('');
  const [currentEmojiIndex, setCurrentEmojiIndex] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentEmojiIndex((prevIndex) => (prevIndex + 1) % EMOJI_LIST.length);
    }, EMOJI_INTERVAL);

    return () => clearInterval(intervalId);
  }, []);


  function SubmitButton() {
    return (
      <Button type="submit" disabled={isProcessing} className="w-full bg-primary hover:bg-primary/90 transition-opacity text-primary-foreground">
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
          </>
        ) : (
          <>
            <Brain className="mr-2 h-4 w-4" /> Get Results
          </>
        )}
      </Button>
    );
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) { // 4MB limit
        toast({
          title: "File Too Large",
          description: "Please upload a file smaller than 4MB.",
          variant: "destructive",
        });
        setSelectedFile(null);
        setFileDataUri(null);
        if(fileInputRef.current) fileInputRef.current.value = ""; 
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        setFileDataUri(loadEvent.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setSelectedFile(null);
      setFileDataUri(null);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFileDataUri(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isLoggedIn) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to use the AI Helper.",
        variant: "destructive",
      });
      return;
    }
    if (!fileDataUri && !userTextQuery.trim()) {
      toast({
        title: "Input Required",
        description: "Please type a question or attach a file.",
        variant: "destructive",
      });
      return;
    }
     if (!subjectTitle || !desiredFormat) {
      toast({
        title: "Missing Information",
        description: "Please enter a subject title and select a desired format.",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    if (userTextQuery.trim()) {
      formData.append('userTextQuery', userTextQuery.trim());
    }
    if (fileDataUri) {
      formData.append('fileDataUri', fileDataUri);
    }
    formData.append('subjectTitle', subjectTitle);
    formData.append('desiredFormat', desiredFormat);
    
    startTransition(() => {
      formAction(formData);
    });
  };

  useEffect(() => {
    if (formState) {
      if (formState.errors && Object.keys(formState.errors).length > 0 && !formState.result) {
        const errorMessages = Object.values(formState.errors).flat().join(' ') || (formState.message || "An error occurred.");
        toast({
          title: "Error",
          description: errorMessages,
          variant: "destructive",
          icon: <AlertCircleIconLucide className="text-red-500" />,
        });
      } 
      else if (formState.result && formState.result.result) {
        toast({
          title: "Success!",
          description: formState.message || "Processing successful!",
          variant: "default",
          className: "bg-green-500/10 border-green-500",
          icon: <CheckCircle className="text-green-500" />,
        });
        setAiResult(formState.result);
        setLastAiInput({
          subjectTitle: subjectTitle,
          fileDataUri: fileDataUri,
          userTextQuery: userTextQuery,
          desiredFormat: desiredFormat || null,
        });
        if (!isSubscribed) {
          setShowVideoAd(true); 
        }
        router.push('/ai-results'); 
      } 
      else if (formState.message && !formState.result && !(formState.errors && Object.keys(formState.errors).length > 0)) {
         toast({
          title: "Info", 
          description: formState.message,
          variant: "default", 
        });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formState]);


  return (
    <Card className="w-full max-w-2xl mx-auto shadow-2xl border-primary/50 bg-card/80 backdrop-blur-sm">
      <CardHeader className="text-center">
        <div className="mx-auto w-fit mb-4 text-4xl">
          {EMOJI_LIST[currentEmojiIndex]}
        </div>
        <CardTitle className="text-3xl font-bold text-primary">
          Hi, I'm Charles. Let's study...
        </CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="user-text-query" className="text-foreground flex items-center">
              <PencilLine className="mr-2 h-5 w-5 text-primary" /> Your Question & Optional File
            </Label>
            <div className="relative">
              <Textarea
                id="user-text-query"
                placeholder="Type your question, upload/snap note or paste assignment here...."
                value={userTextQuery}
                onChange={(e) => setUserTextQuery(e.target.value)}
                className="focus-visible:ring-accent pr-10 py-2" 
                rows={4} 
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-1.5 right-1.5 text-muted-foreground hover:text-primary p-1 h-7 w-7"
                aria-label="Attach file"
                title="Attach file (Max 4MB: PDF, JPG, PNG, TXT, DOCX)"
              >
                <Paperclip className="h-5 w-5" />
              </Button>
            </div>
            {formState?.errors?.userTextQuery && <p className="text-sm text-destructive mt-1">{formState.errors.userTextQuery.join(', ')}</p>}
            
            {selectedFile && (
              <div className="text-sm text-muted-foreground mt-2 flex items-center justify-between bg-secondary/30 p-2 rounded-md border">
                <div className="flex items-center truncate min-w-0">
                  <FileText className="mr-2 h-4 w-4 text-primary shrink-0" />
                  <span className="truncate" title={selectedFile.name}>{selectedFile.name}</span>
                </div>
                <Button variant="ghost" size="icon" onClick={handleRemoveFile} className="text-destructive hover:text-destructive/80 h-7 w-7 p-1 shrink-0 ml-2">
                  <XIcon className="h-4 w-4" />
                </Button>
              </div>
            )}
            {formState?.errors?.fileDataUri && <p className="text-sm text-destructive mt-1">{formState.errors.fileDataUri.join(', ')}</p>}
            {!selectedFile && <p className="text-xs text-muted-foreground mt-1">Click the 📎 to attach a file. Max 4MB: PDF, JPG, PNG, TXT, DOCX.</p>}

            <Input
              id="file-upload-hidden"
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.txt,.md,.docx"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject-title" className="text-foreground flex items-center">
              <FileText className="mr-2 h-5 w-5 text-primary" /> Course/Subject Title
            </Label>
            <Input
              id="subject-title"
              type="text"
              placeholder="e.g., Quantum Physics, Creative Writing"
              value={subjectTitle}
              onChange={(e) => setSubjectTitle(e.target.value)}
              className="focus-visible:ring-accent"
              required
            />
            {formState?.errors?.subjectTitle && <p className="text-sm text-destructive">{formState.errors.subjectTitle.join(', ')}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="desired-format" className="text-foreground flex items-center">
              <ListChecks className="mr-2 h-5 w-5 text-primary" /> Desired Result Format
            </Label>
            <Select 
              onValueChange={(value: DesiredFormatType) => setDesiredFormat(value)}
              value={desiredFormat}
              required
            >
              <SelectTrigger id="desired-format" className="focus:ring-accent">
                <SelectValue placeholder="Select format..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Summary">Summarize</SelectItem>
                <SelectItem value="Question Answering">Generate Q&amp;A</SelectItem>
                <SelectItem value="Text">Solve my Assignment</SelectItem>
                <SelectItem value="Explain">Explain Topic/Question....</SelectItem> 
              </SelectContent>
            </Select>
            {formState?.errors?.desiredFormat && <p className="text-sm text-destructive">{formState.errors.desiredFormat.join(', ')}</p>}
          </div>
          
          {formState?.errors?.general && ! (formState?.errors?.fileDataUri || formState?.errors?.subjectTitle || formState?.errors?.desiredFormat || formState?.errors?.userTextQuery) && (
            <Alert variant="destructive" className="bg-destructive/10 border-destructive">
              <AlertCircleIconLucide className="h-4 w-4" /> {/* Ensured correct icon variable name */}
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {formState.errors.general.join(' ')}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter>
          <SubmitButton />
        </CardFooter>
      </form>
    </Card>
  );
}
    

