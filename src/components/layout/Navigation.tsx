import React from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { ScreenId } from '../../types';

const items: { id: ScreenId; label: string; icon: string }[] = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'timeline', label: 'Timeline', icon: 'history' },
  { id: 'upload', label: 'Upload', icon: 'upload_file' },
  { id: 'copilot', label: 'Copilot', icon: 'forum' },
  { id: 'summary', label: 'Summary', icon: 'summarize' },
];

export const BottomNavigation: React.FC = () => {
  const { currentScreen, setCurrentScreen } = useApp();

  return (
    <nav aria-label="Primary" className="lg:hidden fixed bottom-0 inset-x-0 z-40 pb-safe bg-white/95 backdrop-blur border-t border-slate-200">
      <div className="grid grid-cols-5 h-16 max-w-xl mx-auto px-1">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-current={currentScreen === item.id ? 'page' : undefined}
            onClick={() => setCurrentScreen(item.id)}
            className={`min-w-0 min-h-12 flex flex-col items-center justify-center gap-0.5 ${currentScreen === item.id ? 'text-teal-800 font-semibold' : 'text-slate-500'}`}
          >
            <span className="material-symbols-outlined text-[21px]">{item.icon}</span>
            <span className="text-[10px] leading-tight truncate max-w-full">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export const DesktopSidebar: React.FC = () => {
  const { currentScreen, setCurrentScreen } = useApp();
  const { session } = useAuth();
  const email = session?.user.email || 'Signed-in account';
  const initial = email.slice(0, 1).toUpperCase();

  return (
    <aside className="hidden lg:flex flex-col w-64 min-h-[calc(100vh-4rem)] sticky top-16 bg-white border-r border-slate-200 p-4">
      <div className="mb-6 flex items-center gap-3 rounded-lg bg-slate-50 p-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-teal-800 text-white font-semibold">{initial}</span>
        <div className="min-w-0">
          <p className="text-xs text-slate-500">Account</p>
          <p className="truncate text-sm font-medium text-slate-900">{email}</p>
        </div>
      </div>
      <nav aria-label="Primary" className="space-y-1">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-current={currentScreen === item.id ? 'page' : undefined}
            onClick={() => setCurrentScreen(item.id)}
            className={`w-full min-h-11 rounded-md px-3 flex items-center gap-3 text-sm font-medium ${currentScreen === item.id ? 'bg-teal-800 text-white' : 'text-slate-700 hover:bg-slate-100'}`}
          >
            <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
      <p className="mt-auto border-t border-slate-200 pt-4 text-xs leading-relaxed text-slate-500">
        Unreviewed extraction candidates stay separate from verified health records.
      </p>
    </aside>
  );
};
