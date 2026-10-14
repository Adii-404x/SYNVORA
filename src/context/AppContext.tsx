import React, { createContext, useContext } from 'react';
import { ScreenId } from '../types';
import { LanguageProvider, useLanguage } from './LanguageContext';

interface AppContextValue {
  currentScreen: ScreenId;
  setCurrentScreen: (screen: ScreenId) => void;
  seniorMode: boolean;
  toggleSeniorMode: () => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

const AppContentBridge: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentScreen, setCurrentScreen, seniorMode, toggleSeniorMode } = useLanguage();

  return (
    <AppContext.Provider value={{ currentScreen, setCurrentScreen, seniorMode, toggleSeniorMode }}>
      {children}
    </AppContext.Provider>
  );
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <LanguageProvider>
      <AppContentBridge>{children}</AppContentBridge>
    </LanguageProvider>
  );
};

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
}

