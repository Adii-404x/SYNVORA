import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { LoadingSkeleton } from '../common/LoadingSkeleton';
import { EmptyState } from '../common/EmptyState';
import { ErrorState } from '../common/ErrorState';
import { APP_ASSETS } from '../../data/mockData';

export const SignInScreen: React.FC = () => {
  const {
    lang,
    translations,
    setCurrentScreen,
    screenState,
    setScreenState,
    autoLockEnabled,
    setAutoLockEnabled,
    setBiometricsEnabled
  } = useLanguage();

  const [step, setStep] = useState<'phone' | 'otp' | 'biometric'>('phone');
  const [phone, setPhone] = useState('98721 00342');
  const [otp, setOtp] = useState(['4', '8', '9', '2', '', '']);
  const [resendTimer, setResendTimer] = useState(45);
  const [isVerifying, setIsVerifying] = useState(false);
  const [biometricScanning, setBiometricScanning] = useState(false);
  const [biometricSuccess, setBiometricSuccess] = useState(false);

  useEffect(() => {
    if (step === 'otp' && resendTimer > 0) {
      const interval = setInterval(() => setResendTimer(prev => prev - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [step, resendTimer]);

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
          icon="lock_open"
          title="Already Signed In"
          subtitle="Sunita Sharma's session is currently active on this device."
          actionLabel="Go to Dashboard"
          onAction={() => setCurrentScreen('home')}
        />
      </div>
    );
  }

  if (screenState === 'error') {
    return (
      <div className="max-w-lg mx-auto py-10 px-4">
        <ErrorState
          title="SMS service temporarily paused"
          subtitle="We couldn't deliver the OTP right now. Please try in a few moments."
          onRetry={() => setScreenState('normal')}
        />
      </div>
    );
  }

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length >= 10) {
      setStep('otp');
      setResendTimer(45);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto advance focus
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleVerifyOtp = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setStep('biometric');
    }, 800);
  };

  const handleSimulateBiometric = () => {
    setBiometricScanning(true);
    setTimeout(() => {
      setBiometricScanning(false);
      setBiometricSuccess(true);
      setBiometricsEnabled(true);
      setTimeout(() => {
        setCurrentScreen('home');
      }, 700);
    }, 1200);
  };

  return (
    <div className="w-full max-w-lg mx-auto px-4 py-6 space-y-6">
      {/* Brand & Reassurance Header */}
      <div className="text-center space-y-2">
        <img src={APP_ASSETS.logo} alt="Altrix Lab" className="h-10 w-auto object-contain mx-auto" />
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          {translations.signInTitle}
        </h1>
        <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
          {translations.signInSubtitle}
        </p>
      </div>

      {/* STEP 1: Phone Number Input */}
      {step === 'phone' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block uppercase tracking-wider">
              {translations.phoneLabel}
            </label>
            <div className="flex items-center gap-2">
              <span className="min-h-[48px] px-3.5 rounded-xl bg-slate-100 text-slate-700 font-semibold text-sm flex items-center border border-slate-200 shrink-0">
                🇮🇳 +91
              </span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="98721 00342"
                className="w-full min-h-[48px] px-4 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-base text-slate-900 focus:outline-none focus:border-teal-700 focus:bg-white transition-all tracking-wider"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {lang === 'hi'
                ? 'हम केवल सुरक्षित साइन-इन और मेडिकल अलर्ट के लिए एसएमएस भेजते हैं।'
                : 'We only send SMS for secure sign-in and patient consultation updates.'}
            </p>
          </div>

          {/* Auto-lock after 2 minutes setting toggle */}
          <div className="p-3.5 rounded-xl bg-teal-50/60 border border-teal-200/70 flex items-start justify-between gap-3">
            <div className="flex flex-col min-w-0 pr-2">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-teal-800 text-[18px]">lock_clock</span>
                <span className="text-xs font-bold text-teal-950">{translations.autoLockTitle}</span>
              </div>
              <span className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                {translations.autoLockDesc}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setAutoLockEnabled(!autoLockEnabled)}
              className={`min-w-[48px] h-7 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                autoLockEnabled ? 'bg-teal-700' : 'bg-slate-300'
              }`}
            >
              <span
                className={`block w-5 h-5 rounded-full bg-white shadow-xs transform transition-transform top-1 absolute ${
                  autoLockEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <button
            type="button"
            onClick={handlePhoneSubmit}
            className="w-full min-h-[48px] rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm shadow-md shadow-teal-700/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{lang === 'hi' ? 'ओटीपी कोड प्राप्त करें' : 'Get One-Time Passcode'}</span>
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </div>
      )}

      {/* STEP 2: 6-Digit OTP Screen */}
      {step === 'otp' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm space-y-5 animate-in fade-in duration-200">
          <div className="space-y-1 text-center">
            <h2 className="text-base font-bold text-slate-900">{translations.otpLabel}</h2>
            <p className="text-xs text-slate-500">
              {translations.otpSentTo} <strong className="text-slate-800">+91 {phone}</strong>
            </p>
          </div>

          {/* 6 Digit Inputs */}
          <div className="flex justify-center gap-2 sm:gap-3 py-1">
            {otp.map((digit, idx) => (
              <input
                key={idx}
                id={`otp-input-${idx}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(idx, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Backspace' && !digit && idx > 0) {
                    document.getElementById(`otp-input-${idx - 1}`)?.focus();
                  }
                }}
                className="w-11 sm:w-12 h-14 rounded-xl border border-slate-300 text-center font-bold text-lg text-slate-900 focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20 focus:outline-none transition-all bg-slate-50 focus:bg-white"
              />
            ))}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <button
              type="button"
              onClick={() => setStep('phone')}
              className="text-teal-700 hover:underline font-semibold"
            >
              {lang === 'hi' ? 'नंबर बदलें' : 'Change mobile number'}
            </button>
            <span>
              {resendTimer > 0 ? (
                `${translations.resendOtp} 00:${resendTimer.toString().padStart(2, '0')}`
              ) : (
                <button
                  type="button"
                  onClick={() => setResendTimer(45)}
                  className="text-teal-700 font-bold hover:underline"
                >
                  {lang === 'hi' ? 'पुनः कोड भेजें' : 'Resend code'}
                </button>
              )}
            </span>
          </div>

          <button
            type="button"
            onClick={handleVerifyOtp}
            disabled={isVerifying}
            className="w-full min-h-[48px] rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm shadow-md shadow-teal-700/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isVerifying ? (
              <>
                <span className="material-symbols-outlined text-[20px] animate-spin">
                  progress_activity
                </span>
                <span>{lang === 'hi' ? 'सत्यापित हो रहा है...' : 'Verifying securely...'}</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[20px]">verified</span>
                <span>{translations.verifyBtn}</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* STEP 3: Optional Biometrics Prompt (Fingerprint or Face Unlock) */}
      {step === 'biometric' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm space-y-5 text-center animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 mx-auto shadow-xs relative">
            <span
              className={`material-symbols-outlined text-[36px] transition-transform ${
                biometricScanning ? 'scale-110 text-teal-800 animate-pulse' : ''
              } ${biometricSuccess ? 'text-emerald-600' : ''}`}
            >
              {biometricSuccess ? 'check_circle' : 'fingerprint'}
            </span>
            {biometricScanning && (
              <span className="absolute inset-0 rounded-2xl border-2 border-teal-500 animate-ping opacity-40"></span>
            )}
          </div>

          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-900">
              {translations.biometricPromptTitle}
            </h2>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              {translations.biometricPromptDesc}
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl text-left border border-slate-200/60 text-xs text-slate-600 space-y-1">
            <div className="flex items-center gap-1.5 text-teal-800 font-bold">
              <span className="material-symbols-outlined text-[16px]">security</span>
              <span>On-device hardware biometric</span>
            </div>
            <p className="text-[11px] text-slate-500">
              {lang === 'hi'
                ? 'बायोमेट्रिक डेटा कभी हमारे सर्वर पर नहीं भेजा जाता। यह केवल आपके फोन के सुरक्षित क्षेत्र में रहता है।'
                : 'Biometric keys are processed strictly on your device hardware and never leave your phone.'}
            </p>
          </div>

          <div className="space-y-2.5 pt-1">
            <button
              type="button"
              onClick={handleSimulateBiometric}
              disabled={biometricScanning}
              className="w-full min-h-[48px] rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm shadow-md shadow-teal-700/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {biometricScanning ? (
                <>
                  <span className="material-symbols-outlined text-[20px] animate-spin">
                    fingerprint
                  </span>
                  <span>Scanning sensor...</span>
                </>
              ) : biometricSuccess ? (
                <>
                  <span className="material-symbols-outlined text-[20px]">done</span>
                  <span>Biometrics Enabled!</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[20px]">fingerprint</span>
                  <span>{translations.biometricBtn}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setCurrentScreen('home')}
              className="w-full min-h-[44px] text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
            >
              {translations.skipForNow}
            </button>
          </div>
        </div>
      )}

      {/* Bottom privacy safeguard note */}
      <div className="flex items-center justify-center gap-1.5 text-slate-400 text-xs">
        <span className="material-symbols-outlined text-[16px] text-teal-700">lock</span>
        <span>End-to-end encrypted medical communication</span>
      </div>
    </div>
  );
};
