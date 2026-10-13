/**
 * Altrix Lab - Patient Health & Privacy Vault
 * Designed with HIPAA-aligned and Indian data-protection principles.
 * Primary: Teal #0F766E, White 16px cards, 12px buttons, 48px touch targets, Inter font.
 */

import React from 'react';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { Header } from './components/layout/Header';
import { BottomNavigation, DesktopSidebar } from './components/layout/Navigation';
import { GlobalSwitcher } from './components/layout/GlobalSwitcher';

import { HomeScreen } from './components/screens/HomeScreen';
import { TimelineScreen } from './components/screens/TimelineScreen';
import { UploadDocumentScreen } from './components/screens/UploadDocumentScreen';
import { ReportBreakdownScreen } from './components/screens/ReportBreakdownScreen';
import { PrivacyHubScreen } from './components/screens/PrivacyHubScreen';
import { ConsentScreen } from './components/screens/ConsentScreen';
import { SignInScreen } from './components/screens/SignInScreen';
import { ActivityLogScreen } from './components/screens/ActivityLogScreen';
import { DoctorShareScreen } from './components/screens/DoctorShareScreen';
import { FamilyAccessScreen } from './components/screens/FamilyAccessScreen';
import { DataManagementScreen } from './components/screens/DataManagementScreen';
import { SessionExpiredScreen } from './components/screens/SessionExpiredScreen';

const MainAppContent: React.FC = () => {
  const { currentScreen, seniorMode } = useLanguage();

  const renderScreen = () => {
    switch (currentScreen) {
      case 'home':
        return <HomeScreen />;
      case 'timeline':
        return <TimelineScreen />;
      case 'upload':
        return <UploadDocumentScreen />;
      case 'report_detail':
        return <ReportBreakdownScreen />;
      case 'privacy_hub':
        return <PrivacyHubScreen />;
      case 'consent_onboarding':
        return <ConsentScreen />;
      case 'secure_signin':
        return <SignInScreen />;
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

      {/* Quick State and Screen Inspector for user / reviewer */}
      <GlobalSwitcher />
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
