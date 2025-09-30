'use client';

import React, { createContext, useContext } from 'react';
import { useKayakData } from './hooks';

// Infer the return type of useKayakData
type KayakDataContextType = ReturnType<typeof useKayakData>;

// Create the context with a default value
const KayakDataContext = createContext<KayakDataContextType | null>(null);

// Create a provider component
export const KayakDataProvider = ({ children }: { children: React.ReactNode }) => {
  const kayakData = useKayakData();
  return (
    <KayakDataContext.Provider value={kayakData}>
      {children}
    </KayakDataContext.Provider>
  );
};

// Create a custom hook to use the context
export const useKayakContext = () => {
  const context = useContext(KayakDataContext);
  if (!context) {
    throw new Error('useKayakContext must be used within a KayakDataProvider');
  }
  return context;
};