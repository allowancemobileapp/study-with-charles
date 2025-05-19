
"use client";

import type React from 'react';

// This provider can be expanded later if needed for contexts not covered by Zustand
// For now, Zustand is handling global state, so this provider is minimal.
// It could be used for theme providers or other global context setups if ShadCN/NextUI doesn't handle them automatically.

export function AppProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
