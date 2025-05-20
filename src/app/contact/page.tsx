
"use client";

import { useState, type FormEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Send, MessageSquare, User, Building } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ContactPage() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    toast({
      title: "Message Sent!",
      description: "Thanks for reaching out. We'll get back to you soon.",
      className: "bg-green-500/10 border-green-500",
    });
    setFormData({ name: '', email: '', subject: '', message: '' }); // Reset form
  };

  return (
    <div className="container mx-auto py-12 px-4">
      <Card className="w-full max-w-3xl mx-auto shadow-2xl border-accent/50 bg-card/80 backdrop-blur-sm">
        <CardHeader className="text-center">
          {/* Image removed as per request */}
          <CardTitle className="text-4xl font-bold text-primary mt-4">
            Get In Touch
          </CardTitle>
          <CardDescription className="text-lg text-muted-foreground mt-2">
            We're here to help and answer any question you might have.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center text-foreground"><User className="mr-2 h-4 w-4 text-primary" /> Full Name</Label>
                <Input id="name" type="text" placeholder="John Doe" value={formData.name} onChange={handleChange} required className="focus-visible:ring-primary" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center text-foreground"><Mail className="mr-2 h-4 w-4 text-primary" /> Email Address</Label>
                <Input id="email" type="email" placeholder="you@example.com" value={formData.email} onChange={handleChange} required className="focus-visible:ring-primary" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject" className="flex items-center text-foreground"><MessageSquare className="mr-2 h-4 w-4 text-primary" /> Subject</Label>
              <Input id="subject" type="text" placeholder="Regarding AI Helper feature..." value={formData.subject} onChange={handleChange} required className="focus-visible:ring-primary" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message" className="flex items-center text-foreground"><Send className="mr-2 h-4 w-4 text-primary" /> Your Message</Label>
              <Textarea id="message" placeholder="Tell us more..." value={formData.message} onChange={handleChange} rows={5} required className="focus-visible:ring-primary" />
            </div>
            <Button type="submit" disabled={isSubmitting} className="w-full bg-primary hover:bg-primary/90 transition-opacity text-primary-foreground">
              {isSubmitting ? 'Sending...' : 'Send Message'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="mt-8 flex flex-col items-center text-center">
            <Building className="h-8 w-8 text-accent mb-2" />
            <p className="text-sm text-muted-foreground">Study with Charles HQ</p>
            <p className="text-xs text-muted-foreground">Planet Viltrum, in Space</p>
            <p className="text-xs text-muted-foreground">email coming soon...</p>
        </CardFooter>
      </Card>
    </div>
  );
}
