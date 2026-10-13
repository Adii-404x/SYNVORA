import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

interface EmptyStateProps {
  icon?: string;
  title?: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'inbox',
  title,
  subtitle,
  actionLabel,
  onAction,
  className = ''
}) => {
  const { translations } = useLanguage();

  return (
    <div
      className={`bg-white rounded-2xl p-8 border border-slate-200/80 shadow-xs text-center space-y-4 max-w-lg mx-auto ${className}`}
    >
      <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-200/60 flex items-center justify-center text-teal-700 mx-auto shadow-xs">
        <span className="material-symbols-outlined text-[32px]">{icon}</span>
      </div>
      <div className="space-y-1.5">
        <h3 className="text-lg font-bold text-slate-800">
          {title || translations.emptyTitle}
        </h3>
        <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
          {subtitle || translations.emptySubtitle}
        </p>
      </div>

      {actionLabel && onAction && (
        <div className="pt-2">
          <button
            type="button"
            onClick={onAction}
            className="min-h-[48px] px-6 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold text-sm transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            {actionLabel}
          </button>
        </div>
      )}
    </div>
  );
};
