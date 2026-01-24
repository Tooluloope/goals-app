'use client';

import { Target } from 'lucide-react';
import { Spinner } from './spinner';

interface AppLoadingProps {
  message?: string;
}

export function AppLoading({ message = 'Loading...' }: AppLoadingProps) {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-6">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <Target className="h-7 w-7 text-primary-foreground" />
          </div>
          <span className="text-2xl font-bold">Alignia</span>
        </div>

        {/* Spinner */}
        <Spinner size="lg" />

        {/* Message */}
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
