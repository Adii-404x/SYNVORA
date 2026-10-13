import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { INITIAL_SHARE_LINKS, INITIAL_RECORDS } from '../../data/mockData';
import { ShareLink } from '../../types';
import { LoadingSkeleton } from '../common/LoadingSkeleton';
import { EmptyState } from '../common/EmptyState';
import { ErrorState } from '../common/ErrorState';

export const DoctorShareScreen: React.FC = () => {
  const { lang, translations, setCurrentScreen, screenState, setScreenState } = useLanguage();

  const [activeLinks, setActiveLinks] = useState<ShareLink[]>(INITIAL_SHARE_LINKS);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([
    INITIAL_RECORDS[0].id,
    INITIAL_RECORDS[1].id
  ]);
  const [expiryChoice, setExpiryChoice] = useState<'24 hours' | '7 days' | '30 days'>('7 days');
  const [hasPin, setHasPin] = useState(true);
  const [pinCode, setPinCode] = useState('4892');
  const [doctorName, setDoctorName] = useState('Dr. Rajiv Sharma');
  const [isSharing, setIsSharing] = useState(false);
  const [showQrModal, setShowQrModal] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (screenState === 'loading') {
    return (
      <div className="max-w-lg mx-auto py-6 px-4">
        <LoadingSkeleton type="detail" count={2} />
      </div>
    );
  }

  if (screenState === 'empty') {
    return (
      <div className="max-w-lg mx-auto py-10 px-4">
        <EmptyState
          icon="link_off"
          title="No Active Share Links"
          subtitle="You haven't generated any time-limited doctor links yet."
          actionLabel="Create First Share Link"
          onAction={() => setScreenState('normal')}
        />
      </div>
    );
  }

  if (screenState === 'error') {
    return (
      <div className="max-w-lg mx-auto py-10 px-4">
        <ErrorState
          title="Could not generate doctor link"
          subtitle="Your encrypted records remain secure. Please try again."
          onRetry={() => setScreenState('normal')}
        />
      </div>
    );
  }

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCreateShare = () => {
    if (selectedDocIds.length === 0) return;
    setIsSharing(true);

    setTimeout(() => {
      setIsSharing(false);
      const newHash = Math.random().toString(36).substring(2, 8);
      const selectedTitles = INITIAL_RECORDS.filter(r => selectedDocIds.includes(r.id)).map(
        r => `${r.title} (${r.date})`
      );

      const newLink: ShareLink = {
        id: `share-${Date.now()}`,
        title: `Consultation with ${doctorName}`,
        doctorName: doctorName,
        clinic: 'Fortis Clinic / External Review',
        createdAt: 'Just now',
        expiresAt:
          expiryChoice === '24 hours'
            ? 'Tomorrow'
            : expiryChoice === '7 days'
            ? 'In 7 days'
            : 'In 30 days',
        expiryChoice: expiryChoice,
        hasPin: hasPin,
        pinCode: hasPin ? pinCode : undefined,
        url: `https://altrix.health/share/sunita-s/${newHash}`,
        status: 'Active',
        documents: selectedTitles,
        accessCount: 0
      };

      setActiveLinks([newLink, ...activeLinks]);
      triggerToast('Doctor link created and ready to share!');
    }, 700);
  };

  const handleRevoke = (linkId: string) => {
    setActiveLinks(prev =>
      prev.map(l => (l.id === linkId ? { ...l, status: 'Revoked' as const } : l))
    );
    triggerToast('Access immediately revoked. Link is now disabled.');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard?.writeText(text);
    triggerToast('Link copied to clipboard');
  };

  return (
    <div className="w-full max-w-lg mx-auto px-4 py-4 space-y-5">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-1">
        <button
          type="button"
          onClick={() => setCurrentScreen('privacy_hub')}
          className="min-h-[44px] px-2 flex items-center gap-1 text-teal-800 hover:text-teal-900 font-bold text-xs cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          <span>{translations.backBtn}</span>
        </button>

        <span className="text-[11px] font-semibold text-teal-800 bg-teal-50 px-3 py-1 rounded-full border border-teal-200/80">
          Temporary Doctor Window
        </span>
      </div>

      {/* Screen Title */}
      <div className="space-y-1">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          {translations.doctorShareTitle}
        </h1>
        <p className="text-xs text-slate-500 leading-relaxed">
          {translations.doctorShareSubtitle}
        </p>
      </div>

      {/* "What will be shared" Preview Card listing selected documents */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-teal-700 text-[20px]">
              checklist_rtl
            </span>
            <h2 className="text-sm font-bold text-slate-900">
              {translations.whatWillBeSharedTitle}
            </h2>
          </div>
          <span className="text-xs font-semibold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200/60">
            {selectedDocIds.length} {translations.selectedDocsCount}
          </span>
        </div>

        {/* Selected Documents Checklist */}
        <div className="space-y-2 pt-1">
          {INITIAL_RECORDS.map((record) => {
            const isSelected = selectedDocIds.includes(record.id);
            return (
              <label
                key={record.id}
                className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-teal-50/60 border-teal-300'
                    : 'bg-slate-50/60 border-slate-200/70 opacity-70 hover:opacity-100'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => {
                    if (isSelected) {
                      setSelectedDocIds(selectedDocIds.filter(id => id !== record.id));
                    } else {
                      setSelectedDocIds([...selectedDocIds, record.id]);
                    }
                  }}
                  className="mt-1 w-4 h-4 rounded text-teal-700 focus:ring-teal-600 accent-teal-700 shrink-0 cursor-pointer"
                />
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-slate-900 leading-tight">
                    {record.title}
                  </span>
                  <span className="text-[11px] text-slate-500 mt-0.5 truncate">
                    {record.provider} • {record.date}
                  </span>
                </div>
              </label>
            );
          })}
        </div>

        {/* Expiry Choices (24 hours, 7 days, 30 days) */}
        <div className="pt-3 border-t border-slate-100 space-y-2">
          <label className="text-xs font-bold text-slate-800 block">
            {translations.expiryHeader}
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: '24 hours', label: translations.expiry24h, sub: 'Clinic Visit' },
              { id: '7 days', label: translations.expiry7d, sub: 'Recommended' },
              { id: '30 days', label: translations.expiry30d, sub: 'Follow-up' }
            ].map((exp) => (
              <button
                key={exp.id}
                type="button"
                onClick={() => setExpiryChoice(exp.id as typeof expiryChoice)}
                className={`min-h-[48px] p-2 rounded-xl text-left border flex flex-col justify-center transition-all cursor-pointer ${
                  expiryChoice === exp.id
                    ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="text-xs font-bold leading-tight">{exp.label}</span>
                <span
                  className={`text-[10px] mt-0.5 ${
                    expiryChoice === exp.id ? 'text-teal-100' : 'text-slate-500'
                  }`}
                >
                  {exp.sub}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Optional PIN Toggle */}
        <div className="pt-3 border-t border-slate-100 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col min-w-0 pr-2">
              <span className="text-xs font-bold text-slate-900">
                {translations.pinToggleTitle}
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                {translations.pinToggleDesc}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setHasPin(!hasPin)}
              className={`min-w-[48px] h-7 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                hasPin ? 'bg-teal-700' : 'bg-slate-300'
              }`}
            >
              <span
                className={`block w-5 h-5 rounded-full bg-white shadow-xs transform transition-transform top-1 absolute ${
                  hasPin ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* PIN Display & Edit */}
          {hasPin && (
            <div className="p-3 bg-teal-50/70 border border-teal-200/80 rounded-xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-teal-700 text-[18px]">key</span>
                <span className="text-xs font-semibold text-slate-700">Access PIN:</span>
                <input
                  type="text"
                  maxLength={4}
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value)}
                  className="w-16 h-8 text-center font-mono font-bold text-sm bg-white border border-teal-300 rounded-lg focus:outline-none text-teal-900"
                />
              </div>
              <button
                type="button"
                onClick={() => setPinCode(Math.floor(1000 + Math.random() * 9000).toString())}
                className="text-[11px] text-teal-800 font-semibold hover:underline"
              >
                Generate New
              </button>
            </div>
          )}
        </div>

        {/* Clear "Share" Button */}
        <div className="pt-2">
          <button
            type="button"
            disabled={selectedDocIds.length === 0 || isSharing}
            onClick={handleCreateShare}
            className={`w-full min-h-[48px] rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
              selectedDocIds.length > 0 && !isSharing
                ? 'bg-teal-700 hover:bg-teal-800 text-white shadow-md shadow-teal-700/20 active:scale-[0.99]'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            {isSharing ? (
              <>
                <span className="material-symbols-outlined text-[20px] animate-spin">
                  progress_activity
                </span>
                <span>Generating encrypted doctor link...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[20px]">share</span>
                <span>{translations.shareBtn}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Active Share Links List with "Revoke access" button */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            {translations.activeLinkHeader}
          </h2>
          <span className="text-xs text-slate-500">{activeLinks.length} Links</span>
        </div>

        {activeLinks.map((link) => {
          const isActive = link.status === 'Active';

          return (
            <div
              key={link.id}
              className={`bg-white rounded-2xl p-4 border transition-all space-y-3 shadow-xs ${
                isActive ? 'border-teal-200/80' : 'border-slate-200/60 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {link.doctorName}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {link.status}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 mt-0.5">
                    Expires: {link.expiresAt} ({link.expiryChoice})
                  </span>
                </div>

                {link.hasPin && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-teal-800 bg-teal-50 px-2 py-1 rounded-lg border border-teal-200/70">
                    <span className="material-symbols-outlined text-[12px]">lock</span>
                    PIN: {link.pinCode}
                  </span>
                )}
              </div>

              {/* URL Box with Copy Button */}
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/70 flex items-center justify-between gap-2">
                <span className="font-mono text-xs text-teal-900 truncate">{link.url}</span>
                <button
                  type="button"
                  disabled={!isActive}
                  onClick={() => copyToClipboard(link.url)}
                  className="min-h-[36px] px-2.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1 border border-slate-200 shrink-0 cursor-pointer shadow-xs"
                >
                  <span className="material-symbols-outlined text-[15px]">content_copy</span>
                  <span>{translations.copyLinkBtn}</span>
                </button>
              </div>

              {/* Fast WhatsApp / QR buttons & Revoke access */}
              {isActive ? (
                <div className="flex items-center justify-between pt-1 gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => triggerToast('Shared to WhatsApp')}
                      className="min-h-[40px] px-3 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-xs font-bold flex items-center gap-1 border border-emerald-200 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">chat</span>
                      <span className="hidden sm:inline">{translations.whatsAppShareBtn}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowQrModal(link.url)}
                      className="min-h-[40px] px-2.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">qr_code_2</span>
                      <span className="hidden sm:inline">QR</span>
                    </button>
                  </div>

                  {/* "Revoke access" button */}
                  <button
                    type="button"
                    onClick={() => handleRevoke(link.id)}
                    className="min-h-[40px] px-3.5 rounded-xl border border-rose-300 text-rose-700 bg-rose-50/50 hover:bg-rose-100 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">block</span>
                    <span>{translations.revokeAccessBtn}</span>
                  </button>
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 italic">
                  {lang === 'hi' ? 'यह लिंक निष्क्रिय कर दिया गया है।' : 'Access has been revoked. Clinicians can no longer open this link.'}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* QR Code Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-xs w-full text-center space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-slate-900">Doctor Scan QR</h3>
            <div className="p-4 bg-slate-100 rounded-xl inline-block mx-auto border border-slate-200">
              <span className="material-symbols-outlined text-[120px] text-teal-800">
                qr_code_2
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono break-all">{showQrModal}</p>
            <button
              type="button"
              onClick={() => setShowQrModal(null)}
              className="w-full min-h-[44px] rounded-xl bg-teal-700 text-white text-xs font-bold"
            >
              Close QR
            </button>
          </div>
        </div>
      )}

      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-4 py-3 rounded-full text-xs font-semibold shadow-2xl flex items-center gap-2 z-50 animate-in fade-in duration-200">
          <span className="material-symbols-outlined text-emerald-400 text-[18px]">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
