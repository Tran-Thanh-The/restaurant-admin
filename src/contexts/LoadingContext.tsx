'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

interface LoadingContextType {
  isLoading: boolean;
  startLoading: (message?: string) => void;
  stopLoading: () => void;
  withLoading: <T>(promise: Promise<T>, message?: string) => Promise<T>;
  message?: string;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [loadingCount, setLoadingCount] = useState(0);
  const [message, setMessage] = useState<string | undefined>(undefined);

  const startLoading = useCallback((msg?: string) => {
    if (msg) setMessage(msg);
    setLoadingCount((c) => c + 1);
  }, []);

  const stopLoading = useCallback(() => {
    setLoadingCount((c) => {
      const next = Math.max(0, c - 1);
      if (next === 0) setMessage(undefined);
      return next;
    });
  }, []);

  const withLoading = useCallback(
    async <T,>(promise: Promise<T>, msg?: string): Promise<T> => {
      startLoading(msg);
      try {
        const result = await promise;
        return result;
      } finally {
        stopLoading();
      }
    },
    [startLoading, stopLoading]
  );

  const isLoading = loadingCount > 0;

  return (
    <LoadingContext.Provider value={{ isLoading, startLoading, stopLoading, withLoading, message }}>
      {children}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
}
