import React, { createContext, useContext, useState } from 'react';
import { ScreenId } from '../types';

interface AppContextValue {
  currentScreen: ScreenId;
  setCurrentScreen: (screen: ScreenId) => void;
  seniorMode: boolean;
  toggleSeniorMode: () => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('home');
  const [seniorMode, setSeniorMode] = useState(false);
  const toggleSeniorMode = () => setSeniorMode((value) => !value);

  return (
    <AppContext.Provider value={{ currentScreen, setCurrentScreen, seniorMode, toggleSeniorMode }}>
      {children}
    </AppContext.Provider>
  );
};

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
}
