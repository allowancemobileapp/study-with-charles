
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { processAssignmentAction, type AssignmentFormState } from '@/lib/actions';
import { useAppStore } from '@/lib/store';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle, Loader2, UploadCloud, FileText, Brain, ListChecks } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

const initialState: AssignmentFormState = {
  message: null,
  errors: {},
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity text-primary-foreground">
      {pending ? (
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

export function AssignmentForm() {
  const [formState, formAction] = useFormState(processAssignmentAction, initialState);
  const { setAiResult, isSubscribed, setShowVideoAd, isLoggedIn } = useAppStore();
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileDataUri, setFileDataUri] = useState<string | null>(null);
  const [subjectTitle, setSubjectTitle] = useState('');
  const [desiredFormat, setDesiredFormat] = useState<'Text' | 'Summary' | 'Question Answering' | undefined>();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "File Too Large",
          description: "Please upload a file smaller than 5MB.",
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
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isLoggedIn) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to use the AI Helper.",
        variant: "destructive",
      });
      return;
    }
    if (!fileDataUri || !subjectTitle || !desiredFormat) {
      toast({
        title: "Missing Information",
        description: "Please upload a file, enter a subject title, and select a desired format.",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append('fileDataUri', fileDataUri);
    formData.append('subjectTitle', subjectTitle);
    formData.append('desiredFormat', desiredFormat);
    
    formAction(formData);
  };

  useEffect(() => {
    if (formState?.message && !formState.errors) {
      toast({
        title: formState.result ? "Success!" : "Error",
        description: formState.message,
        variant: formState.result ? "default" : "destructive",
        className: formState.result ? "bg-green-500/10 border-green-500" : "bg-red-500/10 border-red-500",
        icon: formState.result ? <CheckCircle className="text-green-500" /> : <AlertCircle className="text-red-500" />,
      });
    }
    if (formState?.errors) {
       const errorMessages = Object.values(formState.errors).flat().join(' ');
       toast({
        title: "Form Error",
        description: errorMessages || "Please check your input.",
        variant: "destructive",
      });
    }

    if (formState?.result) {
      setAiResult(formState.result);
      if (!isSubscribed) {
        setShowVideoAd(true); // Show ad first
        // Navigation will be handled after ad is skipped/closed if needed, or directly if subscribed
        // For now, let's assume VideoAdModal handles the post-ad flow or the user navigates manually
        // or we navigate after a slight delay to let the modal logic run.
        // A robust way is to have a callback from VideoAdModal.
        // For simplicity now, let's navigate immediately and assume VideoAdModal is a blocking overlay.
        router.push('/ai-results');
      } else {
        router.push('/ai-results');
      }
    }
  }, [formState, setAiResult, router, isSubscribed, setShowVideoAd, toast, isLoggedIn]);


  return (
    <Card className="w-full max-w-2xl mx-auto shadow-2xl border-primary/50 bg-card/80 backdrop-blur-sm">
      <CardHeader className="text-center">
        <div className="mx-auto p-3 bg-gradient-to-br from-primary/30 to-accent/30 rounded-full w-fit mb-4 border-2 border-primary shadow-lg">
          <BotMessageSquare size={48} className="text-primary" />
        </div>
        <CardTitle className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
          AI Assignment Helper
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Upload your schoolwork (PDF, JPG, PNG) and let our AI assist you.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="file-upload" className="text-foreground flex items-center">
              <UploadCloud className="mr-2 h-5 w-5 text-primary" /> Upload File
            </Label>
            <Input
              id="file-upload"
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileChange}
              className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/20 file:text-primary hover:file:bg-primary/30 focus-visible:ring-accent"
              required
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
              onValueChange={(value: 'Text' | 'Summary' | 'Question Answering') => setDesiredFormat(value)}
              value={desiredFormat}
              required
            >
              <SelectTrigger id="desired-format" className="focus:ring-accent">
                <SelectValue placeholder="Select format..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Text">Text</SelectItem>
                <SelectItem value="Summary">Summary</SelectItem>
                <SelectItem value="Question Answering">Question Answering</SelectItem>
              </SelectContent>
            </Select>
            {formState?.errors?.desiredFormat && <p className="text-sm text-destructive">{formState.errors.desiredFormat.join(', ')}</p>}
          </div>
          
          {formState?.errors?.general && (
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
