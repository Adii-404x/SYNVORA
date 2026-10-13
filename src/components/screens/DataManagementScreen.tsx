import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { LoadingSkeleton } from '../common/LoadingSkeleton';
import { EmptyState } from '../common/EmptyState';
import { ErrorState } from '../common/ErrorState';

export const DataManagementScreen: React.FC = () => {
  const { lang, translations, setCurrentScreen, screenState, setScreenState } = useLanguage();

  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [downloadReady, setDownloadReady] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteStep, setDeleteStep] = useState<1 | 2>(1);
  const [confirmInput, setConfirmInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
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
          icon="inventory_2"
          title="No Archive Requests"
          subtitle="You haven't requested any data downloads recently."
          actionLabel="Request Download"
          onAction={() => setDownloadProgress(0)}
        />
      </div>
    );
  }

  if (screenState === 'error') {
    return (
      <div className="max-w-lg mx-auto py-10 px-4">
        <ErrorState
          title="Could not process archive"
          subtitle="Your encrypted health records remain completely safe. Please retry."
          onRetry={() => setScreenState('normal')}
        />
      </div>
    );
  }

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleStartDownload = () => {
    setDownloadProgress(10);
    setDownloadReady(false);

    const interval = setInterval(() => {
      setDownloadProgress((prev) => {
        if (prev === null) return 10;
        if (prev >= 90) {
          clearInterval(interval);
          setDownloadReady(true);
          return 100;
        }
        return prev + 25;
      });
    }, 400);
  };

  const handleDownloadFile = () => {
    // Generate clean JSON export
    const sampleExport = {
      patient: 'Sunita Sharma',
      abhaId: '91-8274-1029-4421',
      exportedAt: new Date().toISOString(),
      standards: 'FHIR HL7 & ABDM Health Vault',
      recordsCount: 4,
      parameters: ['HbA1c: 7.2%', 'Fasting Blood Sugar: 138 mg/dL', 'Serum Creatinine: 0.9 mg/dL']
    };

    const blob = new Blob([JSON.stringify(sampleExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `altrix-lab-sunita-sharma-export.json`;
    a.click();
    URL.revokeObjectURL(url);

    triggerToast('Download started (JSON archive)');
  };

  const handleExecuteDelete = () => {
    setIsDeleting(true);
    setTimeout(() => {
      setIsDeleting(false);
      setShowDeleteModal(false);
      triggerToast('All data has been permanently erased.');
      setTimeout(() => {
        setCurrentScreen('consent_onboarding');
      }, 1000);
    }, 1200);
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
          Digital Health Rights
        </span>
      </div>

      {/* Screen Title */}
      <div className="space-y-1">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          {translations.dataMgmtTitle}
        </h1>
        <p className="text-xs text-slate-500 leading-relaxed">
          {lang === 'hi'
            ? 'भारतीय डेटा संरक्षण दिशानिर्देशों के तहत आपको अपनी स्वास्थ्य जानकारी डाउनलोड करने या हटाने का पूर्ण अधिकार है।'
            : 'You have full legal ownership and control over your health records under national data protection frameworks.'}
        </p>
      </div>

      {/* SECTION 1: DOWNLOAD MY DATA */}
      <section className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-800 border border-teal-200/60 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[24px]">download_for_offline</span>
          </div>
          <div className="flex flex-col min-w-0">
            <h2 className="text-sm font-bold text-slate-900">
              {translations.downloadSectionTitle}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              {translations.downloadSectionDesc}
            </p>
          </div>
        </div>

        {/* Progress State or Download Button */}
        {downloadProgress !== null && downloadProgress < 100 && (
          <div className="p-4 bg-teal-50/70 border border-teal-200/70 rounded-xl space-y-2 animate-in fade-in duration-200">
            <div className="flex items-center justify-between text-xs font-bold text-teal-950">
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] animate-spin text-teal-700">
                  progress_activity
                </span>
                <span>{translations.downloadingState}</span>
              </span>
              <span>{downloadProgress}%</span>
            </div>
            <div className="w-full h-2 bg-teal-200/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-teal-700 rounded-full transition-all duration-300"
                style={{ width: `${downloadProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {downloadReady && (
          <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-center justify-between gap-3 animate-in fade-in duration-200">
            <div className="flex items-center gap-2 min-w-0">
              <span className="material-symbols-outlined text-emerald-600 text-[22px]">
                check_circle
              </span>
              <span className="text-xs font-bold text-emerald-950 truncate">
                {translations.downloadReady}
              </span>
            </div>
            <button
              type="button"
              onClick={handleDownloadFile}
              className="min-h-[40px] px-3.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0"
            >
              <span className="material-symbols-outlined text-[16px]">file_download</span>
              <span>Download ZIP</span>
            </button>
          </div>
        )}

        {downloadProgress === null && (
          <button
            type="button"
            onClick={handleStartDownload}
            className="w-full min-h-[48px] rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm shadow-md shadow-teal-700/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">archive</span>
            <span>{translations.downloadBtn}</span>
          </button>
        )}

        <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-1">
          <span className="material-symbols-outlined text-[14px]">lock</span>
          <span>Includes verified diagnostic PDFs, FHIR JSON schemas, and prescription OCR text.</span>
        </div>
      </section>

      {/* SECTION 2: DELETE MY DATA (Calm outlined destructive button, NOT a full red screen) */}
      <section className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-800 border border-rose-200/60 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[24px]">delete_sweep</span>
          </div>
          <div className="flex flex-col min-w-0">
            <h2 className="text-sm font-bold text-slate-900">
              {translations.deleteSectionTitle}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              {translations.deleteSectionDesc}
            </p>
          </div>
        </div>

        {/* Calm outlined destructive button, NOT full red screen */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => {
              setDeleteStep(1);
              setConfirmInput('');
              setShowDeleteModal(true);
            }}
            className="w-full min-h-[48px] rounded-xl border border-rose-300 text-rose-700 bg-rose-50/50 hover:bg-rose-100 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">delete_outline</span>
            <span>{translations.deleteRequestBtn}</span>
          </button>
        </div>
      </section>

      {/* TWO-STEP CONFIRMATION SHEET EXPLAINING WHAT WILL BE REMOVED */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto sm:hidden -mt-2 mb-2"></div>

            {/* STEP 1: Explaining what will be removed */}
            {deleteStep === 1 && (
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[22px]">info</span>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        {translations.deleteModalStep1Title}
                      </h3>
                      <span className="text-xs text-slate-500">Step 1 of 2: Impact Review</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(false)}
                    className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[20px]">close</span>
                  </button>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {translations.deleteModalStep1Desc}
                </p>

                {/* Items to be removed */}
                <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-700">
                  <div className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-rose-600 text-[16px] mt-0.5">
                      remove_circle_outline
                    </span>
                    <span>{translations.deleteItem1}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-rose-600 text-[16px] mt-0.5">
                      remove_circle_outline
                    </span>
                    <span>{translations.deleteItem2}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-rose-600 text-[16px] mt-0.5">
                      remove_circle_outline
                    </span>
                    <span>{translations.deleteItem3}</span>
                  </div>
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => setDeleteStep(2)}
                    className="w-full min-h-[48px] rounded-xl border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold text-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>{translations.deleteModalNextBtn}</span>
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(false)}
                    className="w-full min-h-[44px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs cursor-pointer"
                  >
                    {translations.calmCancel}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Intentional verification ("Type DELETE") */}
            {deleteStep === 2 && (
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[22px]">warning</span>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        {translations.deleteModalStep2Title}
                      </h3>
                      <span className="text-xs text-slate-500">Step 2 of 2: Final Confirmation</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(false)}
                    className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[20px]">close</span>
                  </button>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {translations.deleteModalStep2Desc}
                </p>

                <input
                  type="text"
                  placeholder="DELETE"
                  value={confirmInput}
                  onChange={(e) => setConfirmInput(e.target.value)}
                  className="w-full min-h-[48px] px-4 rounded-xl border border-slate-300 text-center font-mono font-bold text-base tracking-widest text-slate-900 focus:outline-none focus:border-rose-400 bg-slate-50 focus:bg-white"
                />

                <div className="pt-2 flex flex-col gap-2">
                  <button
                    type="button"
                    disabled={confirmInput.trim().toUpperCase() !== 'DELETE' || isDeleting}
                    onClick={handleExecuteDelete}
                    className={`w-full min-h-[48px] rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      confirmInput.trim().toUpperCase() === 'DELETE' && !isDeleting
                        ? 'border border-rose-300 bg-rose-600 text-white shadow-md shadow-rose-600/20 active:scale-[0.99]'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {isDeleting ? (
                      <>
                        <span className="material-symbols-outlined text-[20px] animate-spin">
                          progress_activity
                        </span>
                        <span>Erasing encrypted records...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[20px]">delete_forever</span>
                        <span>{translations.deleteConfirmFinalBtn}</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(false)}
                    className="w-full min-h-[44px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs cursor-pointer"
                  >
                    {translations.calmCancel}
                  </button>
                </div>
              </div>
            )}
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
