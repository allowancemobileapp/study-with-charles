
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, BotMessageSquare, UserCircle, LogIn, LogOut, Crown, DollarSign, Info, Mail } from "lucide-react";
import { useAppStore } from "@/lib/store";
import Image from "next/image";

const navLinks = [
  { href: "/", label: "AI Helper", icon: BotMessageSquare },
  { href: "/timetable", label: "Timetable", icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg> },
  { href: "/pricing", label: "Pricing", icon: DollarSign },
  { href: "/about", label: "About Us", icon: Info },
  { href: "/contact", label: "Contact", icon: Mail },
];

export function Header() {
  const { isLoggedIn, currentUser, setIsLoggedIn, setCurrentUser, isSubscribed } = useAppStore();

  const handleSignIn = () => {
    setIsLoggedIn(true);
    setCurrentUser({ name: "Demo User", email: "demo@example.com", avatar: "https://placehold.co/40x40.png" });
  };

  const handleSignOut = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-md">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center space-x-2">
          {/* Neon-like SVG logo */}
          <svg width="32" height="32" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="neonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{stopColor: "hsl(var(--primary))", stopOpacity:1}} />
                <stop offset="100%" style={{stopColor: "hsl(var(--accent))", stopOpacity:1}} />
              </linearGradient>
              <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3.5" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            <path d="M20 80 L50 20 L80 80 Z M30 70 L70 70" stroke="url(#neonGradient)" strokeWidth="8" fill="none" filter="url(#neonGlow)" strokeLinejoin="round" strokeLinecap="round" />
            <path d="M50 45 L50 70" stroke="url(#neonGradient)" strokeWidth="6" fill="none" filter="url(#neonGlow)" strokeLinecap="round" />
          </svg>
          <span className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
            PlanB: CyberGrade
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
          {isLoggedIn ? (
            <div className="flex items-center space-x-3">
              {currentUser?.avatar && (
                <Image src={currentUser.avatar} alt={currentUser.name} width={32} height={32} className="rounded-full border-2 border-primary" data-ai-hint="avatar user" />
              )}
              <span className="hidden sm:inline text-sm text-muted-foreground">{currentUser?.name}</span>
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
              <nav className="flex flex-col space-y-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="flex items-center space-x-3 rounded-md p-2 text-lg transition-colors hover:bg-accent/10 hover:text-accent"
                  >
                    {typeof link.icon === "string" ? <BotMessageSquare className="h-6 w-6" /> : link.icon} 
                    <span>{link.label}</span>
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
