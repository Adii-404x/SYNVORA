import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';

interface MaskedValueProps {
  value: string;
  label?: string;
  maskedPlaceholder?: string;
  defaultMasked?: boolean;
  className?: string;
  inline?: boolean;
}

export const MaskedValue: React.FC<MaskedValueProps> = ({
  value,
  label,
  maskedPlaceholder,
  defaultMasked = true,
  className = '',
  inline = false
}) => {
  const { translations, maskSensitiveByDefault } = useLanguage();
  const [isRevealed, setIsRevealed] = useState<boolean>(!maskSensitiveByDefault && !defaultMasked);

  const toggleReveal = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRevealed(prev => !prev);
  };

  const placeholder = maskedPlaceholder || '•••• •••• ••••';

  if (inline) {
    return (
      <span className={`inline-flex items-center gap-1.5 align-middle ${className}`}>
        <span
          className={`transition-all duration-200 select-none ${
            isRevealed ? 'filter-none font-semibold' : 'filter blur-[4px] opacity-75 font-mono'
          }`}
        >
          {isRevealed ? value : placeholder}
        </span>
        <button
          type="button"
          onClick={toggleReveal}
          aria-label={isRevealed ? translations.tapToHide : translations.tapToShow}
          className="min-h-[32px] px-2 py-0.5 rounded-full text-xs font-medium text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200/80 flex items-center gap-1 transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[14px]">
            {isRevealed ? 'visibility_off' : 'visibility'}
          </span>
          <span className="text-[11px] font-semibold">{isRevealed ? translations.tapToHide : translations.tapToShow}</span>
        </button>
      </span>
    );
  }

  return (
    <div className={`p-3 bg-slate-50/90 rounded-xl border border-slate-200/80 flex items-center justify-between gap-3 ${className}`}>
      <div className="flex flex-col min-w-0">
        {label && (
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-0.5">
            {label}
          </span>
        )}
        <div className="relative">
          <p
            className={`text-sm text-slate-800 font-medium transition-all duration-200 select-none ${
              isRevealed ? 'filter-none' : 'filter blur-[5px] opacity-70 font-mono tracking-wider'
            }`}
          >
            {isRevealed ? value : placeholder}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={toggleReveal}
        className="min-h-[40px] px-3 py-1 rounded-xl text-xs font-semibold text-teal-800 bg-white hover:bg-teal-50 border border-teal-200 shadow-xs flex items-center gap-1.5 transition-all shrink-0 active:scale-95 cursor-pointer"
      >
        <span className="material-symbols-outlined text-[16px] text-teal-700">
          {isRevealed ? 'visibility_off' : 'visibility'}
        </span>
        <span>{isRevealed ? translations.tapToHide : translations.tapToShow}</span>
      </button>
    </div>
  );
};
