import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

interface AiDisclaimerFooterProps {
  className?: string;
  variant?: 'card' | 'inline';
}

export const AiDisclaimerFooter: React.FC<AiDisclaimerFooterProps> = ({
  className = '',
  variant = 'card'
}) => {
  const { lang, translations } = useLanguage();

  if (variant === 'inline') {
    return (
      <div className={`flex items-center justify-center gap-1.5 py-2 text-center text-xs text-slate-500 ${className}`}>
        <span className="material-symbols-outlined text-[16px] text-teal-700 shrink-0">info</span>
        <span>{translations.aiFooterDisclaimer}</span>
      </div>
    );
  }

  return (
    <footer className={`bg-[#F0FDFA] border border-teal-200/80 rounded-2xl p-4 text-center space-y-1.5 shadow-xs ${className}`}>
      <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-teal-100 text-teal-800 mx-auto">
        <span className="material-symbols-outlined text-[18px]">info</span>
      </div>
      <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto font-medium">
        {translations.aiFooterDisclaimer}
      </p>
      <p className="text-[11px] text-slate-400">
        {lang === 'hi'
          ? 'कृपया दवा या उपचार में बदलाव से पहले अपने चिकित्सक से परामर्श लें।'
          : 'Please consult your treating physician before modifying any medication or therapy.'}
      </p>
    </footer>
  );
};
