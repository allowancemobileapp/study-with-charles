
"use client";

import React, { useState, useRef, useEffect, useActionState, useTransition } from 'react';
import { processAssignmentAction, type AssignmentFormState } from '@/lib/actions';
import { useAppStore, type DesiredFormatType } from '@/lib/store';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle, Loader2, UploadCloud, FileText, Brain, ListChecks, BotMessageSquare, Pilcrow, SearchCheck } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

const initialState: AssignmentFormState = {
  message: null,
  errors: {},
  result: null,
};

export function AssignmentForm() {
  const [formState, formAction, isPending] = useActionState(processAssignmentAction, initialState);
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

  function SubmitButton() {
    return (
      <Button type="submit" disabled={isPending} className="w-full bg-primary hover:bg-primary/90 transition-opacity text-primary-foreground">
        {isPending ? (
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
        description: "Please upload a file or enter a text query.",
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
          icon: <AlertCircle className="text-red-500" />,
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
  }, [formState, router, isSubscribed, setAiResult, setShowVideoAd, toast, isLoggedIn, setLastAiInput, subjectTitle, fileDataUri, userTextQuery, desiredFormat]);


  return (
    <Card className="w-full max-w-2xl mx-auto shadow-2xl border-primary/50 bg-card/80 backdrop-blur-sm">
      <CardHeader className="text-center">
        <div className="mx-auto p-3 bg-primary/20 rounded-full w-fit mb-4 border-2 border-primary shadow-lg">
          <BotMessageSquare size={48} className="text-primary" />
        </div>
        <CardTitle className="text-3xl font-bold text-primary">
          AI Helper
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Type a question, upload schoolwork (PDF, JPG, PNG, TXT, DOCX - Max 4MB), or both!
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="user-text-query" className="text-foreground flex items-center">
              <Pilcrow className="mr-2 h-5 w-5 text-primary" /> Type Your Question/Text (Optional)
            </Label>
            <Textarea
              id="user-text-query"
              placeholder="e.g., Explain the theory of relativity, or paste assignment questions here..."
              value={userTextQuery}
              onChange={(e) => setUserTextQuery(e.target.value)}
              className="focus-visible:ring-accent"
              rows={4}
            />
            {formState?.errors?.userTextQuery && <p className="text-sm text-destructive">{formState.errors.userTextQuery.join(', ')}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="file-upload" className="text-foreground flex items-center">
              <UploadCloud className="mr-2 h-5 w-5 text-primary" /> Or Upload File (Optional, Max 4MB)
            </Label>
            <Input
              id="file-upload"
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.txt,.md,.docx"
              onChange={handleFileChange}
              className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/20 file:text-primary hover:file:bg-primary/30 focus-visible:ring-accent"
            />
            {selectedFile && <p className="text-sm text-muted-foreground">Selected: {selectedFile.name}</p>}
             {formState?.errors?.fileDataUri && <p className="text-sm text-destructive">{formState.errors.fileDataUri.join(', ')}</p>}
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
                <SelectItem value="Text">Text Extraction / Assignment Solver</SelectItem>
                <SelectItem value="Summary">Summary</SelectItem>
                <SelectItem value="Question Answering">Generate Q&amp;A</SelectItem>
                <SelectItem value="Explain">Explain Topic/Question</SelectItem> 
              </SelectContent>
            </Select>
            {formState?.errors?.desiredFormat && <p className="text-sm text-destructive">{formState.errors.desiredFormat.join(', ')}</p>}
          </div>
          
          {formState?.errors?.general && ! (formState?.errors?.fileDataUri || formState?.errors?.subjectTitle || formState?.errors?.desiredFormat || formState?.errors?.userTextQuery) && (
            <Alert variant="destructive" className="bg-destructive/10 border-destructive">
              <AlertCircle className="h-4 w-4" />
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
