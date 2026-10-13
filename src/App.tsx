import React from 'react';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { Header } from './components/layout/Header';
import { BottomNavigation, DesktopSidebar } from './components/layout/Navigation';

import { HomeScreen } from './components/screens/HomeScreen';
import { TimelineScreen } from './components/screens/TimelineScreen';
import { UploadDocumentScreen } from './components/screens/UploadDocumentScreen';
import { CareToolsScreen } from './components/screens/CareToolsScreen';
import { useAuth } from './context/AuthContext';
import { SignInScreen as AuthenticationScreen } from './components/screens/SignInScreen';
import { LoadingSkeleton } from './components/common/LoadingSkeleton';

const MainAppContent: React.FC = () => {
  const { currentScreen, seniorMode } = useLanguage();
  const { session, ready } = useAuth();

  if (!ready) {
    return <div className="min-h-screen bg-[#FAF8FF] px-4 py-12"><LoadingSkeleton type="detail" count={2} /></div>;
  }

  if (!session) return <AuthenticationScreen />;

  const renderScreen = () => {
    switch (currentScreen) {
      case 'home':
        return <HomeScreen />;
      case 'timeline':
        return <TimelineScreen />;
      case 'upload':
        return <UploadDocumentScreen />;
      case 'copilot':
        return <CareToolsScreen mode="copilot" />;
      case 'summary':
        return <CareToolsScreen mode="summary" />;
      default:
        return <HomeScreen />;
    }
  };

  return (
    <div className={`min-h-screen bg-[#FAF8FF] text-[#131B2E] flex flex-col ${seniorMode ? 'text-[1.075rem]' : ''}`}>
      {/* Top Header */}
      <Header />

      {/* Main Content Layout: Desktop Sidebar + Fluid Content Area */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto pb-24 lg:pb-8">
        {/* Desktop Sidebar (hidden on mobile) */}
        <DesktopSidebar />

        {/* Dynamic Screen Viewport */}
        <main className="flex-1 w-full min-w-0 py-2 sm:py-4">
          {renderScreen()}
        </main>
      </div>

      {/* Mobile Bottom Navigation (hidden on desktop) */}
      <BottomNavigation />

    </div>
  );
};

export default function App() {
  return (
    <LanguageProvider>
      <MainAppContent />
    </LanguageProvider>
  );
}
