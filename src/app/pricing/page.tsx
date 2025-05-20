
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Zap, ShieldCheck, XCircle } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase"; // For checking if user is signed in

const features = {
  free: [
    { text: "Basic AI Helper Access", included: true },
    { text: "Timetable & Scheduling", included: true },
    { text: "Contains Ads (Banner & Video)", included: false, type: 'negative' },
    { text: "Limited Support", included: true },
  ],
  premium: [
    { text: "Full AI Helper Access", included: true },
    { text: "Advanced Timetable Features (Email Notifications)", included: true },
    { text: "Ad-Free Experience", included: true },
    { text: "Priority Email Support", included: true },
    { text: "Automatic Email Submission (Coming Soon)", included: true },
  ],
};

export default function PricingPage() {
  const { isSubscribed, setIsSubscribed } = useAppStore();
  const { toast } = useToast();

  const handleSubscribe = () => {
    if (!auth.currentUser) { // Check Firebase auth state
      toast({ title: "Please Sign In", description: "You need to be signed in to subscribe.", variant: "destructive" });
      return;
    }
    // Simulate subscription process - In a real app, this would involve Stripe/payment gateway.
    setIsSubscribed(true);
    toast({
      title: "Subscription Activated!",
      description: "Welcome to Study with Charles Premium! (Simulated)",
      className: "bg-green-500/10 border-green-500",
    });
  };
  
  const handleCancelSubscription = () => {
    setIsSubscribed(false);
    toast({
      title: "Subscription Cancelled",
      description: "Your Study with Charles Premium subscription has been cancelled. (Simulated)",
      variant: "destructive"
    });
  };

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-extrabold tracking-tight text-primary mb-4">
          Unlock Your Potential
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Choose the plan that supercharges your studies. Go ad-free and get the full power of Study with Charles.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* Free Plan Card */}
        <Card className="border-border/50 bg-card/70 backdrop-blur-sm shadow-lg flex flex-col">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 rounded-full border-4 border-muted shadow-md h-28 w-28 flex items-center justify-center text-6xl bg-muted/20">
              😊
            </div>
            <CardTitle className="text-3xl font-semibold text-muted-foreground">Free Tier</CardTitle>
            <CardDescription className="text-lg text-muted-foreground">Get Started</CardDescription>
            <p className="text-4xl font-bold text-foreground mt-2">N0 <span className="text-sm font-normal text-muted-foreground">/ month</span></p>
          </CardHeader>
          <CardContent className="flex-grow">
            <ul className="space-y-3">
              {features.free.map((feature, index) => (
                <li key={index} className="flex items-center text-foreground">
                  {feature.type === 'negative' ? <XCircle className="h-5 w-5 text-destructive mr-3" /> : <CheckCircle className="h-5 w-5 text-primary mr-3" />}
                  {feature.text}
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full border-primary text-primary hover:bg-primary/10" disabled>
              Currently Active
            </Button>
          </CardFooter>
        </Card>

        {/* Premium Plan Card */}
        <Card className="border-2 border-primary shadow-2xl shadow-primary/30 bg-card/90 backdrop-blur-md flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-xs font-semibold rounded-bl-lg shadow-md transform translate-x-1 -translate-y-0 rotate-0">
            BEST VALUE
          </div>
           <CardHeader className="text-center">
            <div className="mx-auto mb-4 rounded-full border-4 border-primary shadow-primary/50 shadow-md h-28 w-28 flex items-center justify-center text-6xl bg-primary/10">
              🤩
            </div>
            <CardTitle className="text-3xl font-semibold text-primary">Premium Plan</CardTitle>
            <CardDescription className="text-lg text-primary/80">Full Power</CardDescription>
            <p className="text-4xl font-bold text-foreground mt-2">N1000 <span className="text-sm font-normal text-muted-foreground">/ month</span></p>
          </CardHeader>
          <CardContent className="flex-grow">
            <ul className="space-y-3">
              {features.premium.map((feature, index) => (
                <li key={index} className="flex items-center text-foreground">
                  <ShieldCheck className="h-5 w-5 text-primary mr-3" />
                  {feature.text}
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            {/* This is where real payment integration like Stripe would go.
                For now, it simulates the subscription state change. */}
            {isSubscribed ? (
               <Button onClick={handleCancelSubscription} variant="destructive" className="w-full">
                Cancel Subscription (Simulated)
              </Button>
            ) : (
              <Button onClick={handleSubscribe} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                <Zap className="mr-2 h-4 w-4" /> Subscribe Now (Simulated)
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
       <p className="text-center text-muted-foreground mt-12 text-sm">
        All payments are processed securely. You can cancel your subscription at any time.
      </p>
       <p className="text-center text-muted-foreground mt-2 text-xs">
        (Note: Payment and subscription system is currently simulated for demonstration.)
      </p>
    </div>
  );
}
