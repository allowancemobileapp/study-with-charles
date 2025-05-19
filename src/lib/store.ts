
import type { SummarizeContentInput, SummarizeContentOutput } from '@/ai/flows/summarize-content';
import { create } from 'zustand';

// Add 'Explain' to the possible desired formats
type DesiredFormatType = 'Text' | 'Summary' | 'Question Answering' | 'Explain';

interface AppState {
  isLoggedIn: boolean;
  setIsLoggedIn: (isLoggedIn: boolean) => void;
  isSubscribed: boolean;
  setIsSubscribed: (isSubscribed: boolean) => void;
  currentUser: { name: string; email: string; avatar?: string } | null;
  setCurrentUser: (user: { name: string; email: string; avatar?: string } | null) => void;

  aiResult: SummarizeContentOutput | null;
  setAiResult: (result: SummarizeContentOutput | null) => void;

  lastAiInput: {
    subjectTitle: string | null;
    fileDataUri: string | null;
    userTextQuery: string | null;
    desiredFormat: DesiredFormatType | null; // Added desiredFormat
  } | null;
  setLastAiInput: (input: { 
    subjectTitle: string | null; 
    fileDataUri: string | null; 
    userTextQuery: string | null;
    desiredFormat: DesiredFormatType | null; // Added desiredFormat
  } | null) => void;

  showVideoAd: boolean;
  setShowVideoAd: (show: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isLoggedIn: false,
  setIsLoggedIn: (isLoggedIn) => set({ isLoggedIn }),
  isSubscribed: false,
  setIsSubscribed: (isSubscribed) => set({ isSubscribed }),
  currentUser: null,
  setCurrentUser: (user) => set({ currentUser: user }),
  
  aiResult: null,
  setAiResult: (result) => set({ aiResult: result }),

  lastAiInput: null,
  setLastAiInput: (input) => set({ lastAiInput: input }),

  showVideoAd: false,
  setShowVideoAd: (show) => set((state) => ({ ...state, showVideoAd: show })),
}));

// Export the type for use in other files if needed
export type { DesiredFormatType };
