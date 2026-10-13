import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, ScreenId, ScreenState } from '../types';
import { t } from '../translations';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  translations: typeof t['en'];
  seniorMode: boolean;
  toggleSeniorMode: () => void;
  currentScreen: ScreenId;
  setCurrentScreen: (screen: ScreenId) => void;
  screenState: ScreenState;
  setScreenState: (state: ScreenState) => void;
  autoLockEnabled: boolean;
  setAutoLockEnabled: (enabled: boolean) => void;
  biometricsEnabled: boolean;
  setBiometricsEnabled: (enabled: boolean) => void;
  maskSensitiveByDefault: boolean;
  setMaskSensitiveByDefault: (enabled: boolean) => void;
  isSessionLocked: boolean;
  setIsSessionLocked: (locked: boolean) => void;
  autoLockCountdown: number;
  triggerAutoLock: () => void;
  unlockSession: () => void;
  onboardingCompleted: boolean;
  setOnboardingCompleted: (completed: boolean) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<Language>('en');
  const [seniorMode, setSeniorMode] = useState<boolean>(false);
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('home');
  const [screenState, setScreenState] = useState<ScreenState>('normal');
  const [autoLockEnabled, setAutoLockEnabled] = useState<boolean>(true);
  const [biometricsEnabled, setBiometricsEnabled] = useState<boolean>(true);
  const [maskSensitiveByDefault, setMaskSensitiveByDefault] = useState<boolean>(true);
  const [isSessionLocked, setIsSessionLocked] = useState<boolean>(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean>(true);
  const [autoLockCountdown, setAutoLockCountdown] = useState<number>(120); // 2 minutes = 120s

  const toggleSeniorMode = () => setSeniorMode(prev => !prev);

  const triggerAutoLock = () => {
    setIsSessionLocked(true);
    setCurrentScreen('session_expired');
  };

  const unlockSession = () => {
    setIsSessionLocked(false);
    setAutoLockCountdown(120);
    setCurrentScreen('home');
  };

  // Live countdown timer for 2-minute auto lock when enabled
  useEffect(() => {
    if (!autoLockEnabled || isSessionLocked) return;

    const timer = setInterval(() => {
      setAutoLockCountdown(prev => {
        if (prev <= 1) {
          setIsSessionLocked(true);
          setCurrentScreen('session_expired');
          return 120;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [autoLockEnabled, isSessionLocked]);

  // Reset countdown on user interaction
  useEffect(() => {
    const handleInteraction = () => {
      if (!isSessionLocked) {
        setAutoLockCountdown(120);
      }
    };

    window.addEventListener('pointerdown', handleInteraction);
    window.addEventListener('keydown', handleInteraction);

    return () => {
      window.removeEventListener('pointerdown', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };
  }, [isSessionLocked]);

  const value: LanguageContextType = {
    lang,
    setLang,
    translations: t[lang],
    seniorMode,
    toggleSeniorMode,
    currentScreen,
    setCurrentScreen,
    screenState,
    setScreenState,
    autoLockEnabled,
    setAutoLockEnabled,
    biometricsEnabled,
    setBiometricsEnabled,
    maskSensitiveByDefault,
    setMaskSensitiveByDefault,
    isSessionLocked,
    setIsSessionLocked,
    autoLockCountdown,
    triggerAutoLock,
    unlockSession,
    onboardingCompleted,
    setOnboardingCompleted
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
