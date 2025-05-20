
"use client";

import Link from "next/link";
import Image from "next/image";
import React, { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Menu, BotMessageSquare, UserCircle, LogIn, LogOut, Crown, DollarSign, Info, Mail } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { auth, googleProvider } from "@/lib/firebase"; // Import Firebase auth
import { signInWithPopup, signOut, onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";

const navLinks = [
  { href: "/", label: "Study", icon: BotMessageSquare },
  { href: "/timetable", label: "Timetable", icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg> },
  { href: "/pricing", label: "Pricing", icon: DollarSign },
  { href: "/about", label: "About Us", icon: Info },
  { href: "/contact", label: "Contact", icon: Mail },
];

export function Header() {
  const { 
    isLoggedIn, 
    currentUser, 
    setIsLoggedIn, 
    setCurrentUser, 
    isSubscribed 
  } = useAppStore();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user: FirebaseUser | null) => {
      if (user) {
        setIsLoggedIn(true);
        setCurrentUser({
          name: user.displayName || "User",
          email: user.email || "",
          avatar: user.photoURL || undefined,
        });
      } else {
        setIsLoggedIn(false);
        setCurrentUser(null);
      }
    });
    return () => unsubscribe(); // Cleanup subscription on unmount
  }, [setIsLoggedIn, setCurrentUser]);

  const handleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      toast({
        title: "Signed In Successfully!",
        description: `Welcome, ${user.displayName}!`,
        className: "bg-green-500/10 border-green-500",
      });
    } catch (error: any) {
      console.error("Error during sign in:", error);
      toast({
        title: "Sign In Failed",
        description: error.message || "Could not sign in with Google. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast({
        title: "Signed Out",
        description: "You have been successfully signed out.",
      });
    } catch (error: any) {
      console.error("Error during sign out:", error);
      toast({
        title: "Sign Out Failed",
        description: error.message || "Could not sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-md">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center space-x-2">
          <span className="font-bold text-xl text-primary">
            Study with Charles
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="transition-colors hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center space-x-3">
          {isLoggedIn && currentUser ? (
            <div className="flex items-center space-x-3">
              {currentUser.avatar ? (
                <Image src={currentUser.avatar} alt={currentUser.name || 'User Avatar'} width={32} height={32} className="rounded-full border-2 border-primary" data-ai-hint="avatar user"/>
              ) : (
                <UserCircle className="h-7 w-7 text-primary" />
              )}
              <span className="hidden sm:inline text-sm text-muted-foreground">{currentUser.name}</span>
              {isSubscribed && <Crown className="h-5 w-5 text-yellow-400" />}
              <Button variant="ghost" size="icon" onClick={handleSignOut} aria-label="Sign Out">
                <LogOut className="h-5 w-5 text-destructive" />
              </Button>
            </div>
          ) : (
            <Button onClick={handleSignIn} variant="outline" className="border-primary hover:bg-primary/10 text-primary hover:text-primary">
              <LogIn className="mr-2 h-4 w-4" /> Sign In with Gmail
            </Button>
          )}

          {/* Mobile Navigation */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-6 w-6 text-foreground" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px] bg-background p-6">
              <SheetHeader className="mb-4">
                <SheetTitle className="text-left text-xl text-primary">Navigation Menu</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col space-y-4">
                {navLinks.map((link) => {
                  const IconComponent = link.icon;
                  return (
                    <Link
                      key={link.label}
                      href={link.href}
                      className="flex items-center space-x-3 rounded-md p-2 text-lg transition-colors hover:bg-accent/10 hover:text-accent"
                    >
                      {React.isValidElement(IconComponent)
                        ? IconComponent
                        : (IconComponent && typeof IconComponent === 'function'
                            ? <IconComponent className="h-6 w-6" />
                            : null)
                      }
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
