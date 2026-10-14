import React, { useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/layout/Header';
import { BottomNavigation, DesktopSidebar } from './components/layout/Navigation';

import { HomeScreen } from './components/screens/HomeScreen';
import { TimelineScreen } from './components/screens/TimelineScreen';
import { UploadDocumentScreen } from './components/screens/UploadDocumentScreen';
import { CareToolsScreen } from './components/screens/CareToolsScreen';
import { ConsentScreen } from './components/screens/ConsentScreen';
import { PrivacyHubScreen } from './components/screens/PrivacyHubScreen';
import { ActivityLogScreen } from './components/screens/ActivityLogScreen';
import { DoctorShareScreen } from './components/screens/DoctorShareScreen';
import { FamilyAccessScreen } from './components/screens/FamilyAccessScreen';
import { DataManagementScreen } from './components/screens/DataManagementScreen';
import { SessionExpiredScreen } from './components/screens/SessionExpiredScreen';
import { ReportBreakdownScreen } from './components/screens/ReportBreakdownScreen';
import { GlobalSwitcher } from './components/layout/GlobalSwitcher';
import { useLanguage } from './context/LanguageContext';
import { useAuth } from './context/AuthContext';
import { SignInScreen as AuthenticationScreen } from './components/screens/SignInScreen';
import { LoadingSkeleton } from './components/common/LoadingSkeleton';

const MainAppContent: React.FC = () => {
  const { currentScreen, seniorMode, setCurrentScreen } = useApp();
  const { isSessionLocked } = useLanguage();
  const { session, ready } = useAuth();

  useEffect(() => {
    if (!session) setCurrentScreen('home');
  }, [session, setCurrentScreen]);

  if (!ready) {
    return <div className="min-h-screen bg-[#FAF8FF] px-4 py-12"><LoadingSkeleton type="detail" count={2} /></div>;
  }

  if (!session) return <AuthenticationScreen />;

  if (isSessionLocked) {
    return <SessionExpiredScreen />;
  }

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
      case 'consent_onboarding':
        return <ConsentScreen />;
      case 'privacy_hub':
        return <PrivacyHubScreen />;
      case 'secure_signin':
        return <AuthenticationScreen />;
      case 'activity_log':
        return <ActivityLogScreen />;
      case 'doctor_share':
        return <DoctorShareScreen />;
      case 'family_access':
        return <FamilyAccessScreen />;
      case 'data_download_delete':
        return <DataManagementScreen />;
      case 'session_expired':
        return <SessionExpiredScreen />;
      case 'report_detail':
        return <ReportBreakdownScreen />;
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

      {/* Floating Inspector for Privacy Hub Screens and States */}
      <GlobalSwitcher />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
