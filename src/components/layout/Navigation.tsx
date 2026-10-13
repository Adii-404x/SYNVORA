import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { ScreenId } from '../../types';

export const BottomNavigation: React.FC = () => {
  const { currentScreen, setCurrentScreen, translations } = useLanguage();

  const navItems: { id: ScreenId; label: string; icon: string }[] = [
    { id: 'home', label: translations.navHome, icon: 'home' },
    { id: 'timeline', label: translations.navTimeline, icon: 'history_edu' },
    { id: 'upload', label: translations.navUpload, icon: 'add' },
    { id: 'report_detail', label: translations.navMedicines, icon: 'medication' },
    { id: 'privacy_hub', label: translations.navPrivacy, icon: 'shield_lock' }
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 pb-safe bg-white/90 backdrop-blur-xl border-t border-emerald-100 shadow-[0_-4px_24px_rgba(15,118,110,0.08)]">
      <div className="flex justify-between items-center h-16 px-2 max-w-lg mx-auto relative">
        {navItems.map((item) => {
          const isActive =
            currentScreen === item.id ||
            (item.id === 'privacy_hub' &&
              [
                'privacy_hub',
                'activity_log',
                'doctor_share',
                'family_access',
                'data_download_delete'
              ].includes(currentScreen));

          if (item.id === 'upload') {
            return (
              <div key={item.id} className="flex flex-col items-center justify-center -mt-6 flex-1">
                <button
                  type="button"
                  onClick={() => setCurrentScreen('upload')}
                  aria-label="Upload Health Document"
                  className="w-14 h-14 rounded-full bg-gradient-to-tr from-teal-700 to-teal-600 text-white shadow-lg shadow-teal-700/35 flex items-center justify-center transition-transform active:scale-95 hover:scale-105 border-4 border-[#FAF8FF] ring-2 ring-teal-400/30 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[30px] font-bold">add</span>
                </button>
                <span className="text-[11px] font-bold text-teal-800 mt-0.5">
                  {item.label}
                </span>
              </div>
            );
          }

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setCurrentScreen(item.id)}
              className={`flex flex-col items-center justify-center min-w-[48px] min-h-[48px] flex-1 transition-colors cursor-pointer ${
                isActive ? 'text-teal-700 font-bold' : 'text-slate-500 hover:text-teal-700'
              }`}
            >
              <span
                className="material-symbols-outlined text-[24px]"
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                {item.icon}
              </span>
              <span className="text-[11px] mt-0.5 leading-none">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export const DesktopSidebar: React.FC = () => {
  const { currentScreen, setCurrentScreen, translations, lang } = useLanguage();

  const mainNav = [
    { id: 'home' as ScreenId, label: translations.navHome, icon: 'home' },
    { id: 'timeline' as ScreenId, label: translations.navTimeline, icon: 'history_edu' },
    { id: 'upload' as ScreenId, label: translations.navUpload, icon: 'document_scanner' },
    { id: 'report_detail' as ScreenId, label: 'Lab Report Analysis', icon: 'biotech' }
  ];

  const privacyNav = [
    { id: 'privacy_hub' as ScreenId, label: translations.hubTitle, icon: 'shield_lock' },
    { id: 'doctor_share' as ScreenId, label: translations.doctorShareTitle, icon: 'share' },
    { id: 'family_access' as ScreenId, label: translations.familyAccessTitle, icon: 'group' },
    { id: 'activity_log' as ScreenId, label: translations.activityTitle, icon: 'history' },
    { id: 'data_download_delete' as ScreenId, label: translations.dataMgmtTitle, icon: 'download' }
  ];

  return (
    <aside className="hidden lg:flex flex-col w-72 h-[calc(100vh-4rem)] sticky top-16 bg-white border-r border-emerald-100/80 p-5 space-y-6 overflow-y-auto no-scrollbar">
      {/* Patient Profile Card */}
      <div className="bg-emerald-50/70 border border-emerald-200/70 rounded-2xl p-4 flex items-center gap-3">
        <div className="relative">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCsgoJRpIxD3MIl8f5soFqSdvmZogu3i0RMpL14RblsQvBx_e0YepaZoo5vBoFlOUbZZJzm4KejkfOLzaQY-ldjZf-MBSjEvmDuHBsxspu6jgCwL-ujgjYJYkYbusf_gBIU1NQN8HGcZHhLQa2ZhOv3bjHsGVrfacbtbMuchPqpXkrjgvnhZC7Y19JFmLiF2pwsSs5pysbu_faI3EdHK7NSW4tr4urdhL0HJm3--uOznsOAfChWpwuF"
            alt="Sunita Sharma"
            className="w-11 h-11 rounded-full object-cover ring-2 ring-emerald-600"
          />
          <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white"></span>
        </div>
        <div className="flex flex-col min-w-0">
          <h2 className="text-sm font-bold text-slate-800 truncate">Sunita Sharma</h2>
          <span className="text-xs text-teal-700 font-medium">52y • Self • ABHA Linked</span>
          <span className="text-[10px] text-slate-400 font-mono mt-0.5">ID: 91-8274-****-4421</span>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="space-y-1">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2 block">
          {lang === 'hi' ? 'मुख्य नेविगेशन' : 'Main Portal'}
        </span>
        {mainNav.map((item) => {
          const isActive = currentScreen === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setCurrentScreen(item.id)}
              className={`w-full min-h-[48px] px-3.5 rounded-xl font-semibold text-sm flex items-center gap-3 transition-all cursor-pointer ${
                isActive
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-teal-50 hover:text-teal-900'
              }`}
            >
              <span
                className="material-symbols-outlined text-[20px]"
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                {item.icon}
              </span>
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Privacy & Security Hub Subsections */}
      <div className="space-y-1 pt-2 border-t border-slate-100">
        <div className="flex items-center justify-between px-3 mb-2">
          <span className="text-[11px] font-bold text-teal-800 uppercase tracking-wider block">
            {lang === 'hi' ? 'गोपनीयता और नियंत्रण' : 'Privacy & Security'}
          </span>
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
        </div>
        {privacyNav.map((item) => {
          const isActive = currentScreen === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setCurrentScreen(item.id)}
              className={`w-full min-h-[44px] px-3 rounded-xl font-medium text-xs flex items-center gap-2.5 transition-all cursor-pointer ${
                isActive
                  ? 'bg-teal-100/80 text-teal-950 font-bold border border-teal-300/80 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <span className="material-symbols-outlined text-[18px] text-teal-700 shrink-0">
                {item.icon}
              </span>
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Trust & Safe Locker reassurance footer */}
      <div className="mt-auto p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-100 text-xs text-slate-600 space-y-1">
        <div className="flex items-center gap-1.5 text-teal-800 font-bold text-[11px]">
          <span className="material-symbols-outlined text-[16px]">verified_user</span>
          <span>Indian Health Privacy Standards</span>
        </div>
        <p className="text-[11px] text-slate-500 leading-snug">
          End-to-end encrypted storage under ABDM & ISO-27001 healthcare privacy safeguards.
        </p>
      </div>
    </aside>
  );
};
