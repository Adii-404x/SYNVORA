import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { INITIAL_FAMILY_MEMBERS } from '../../data/mockData';
import { FamilyMember, FamilyRole } from '../../types';
import { LoadingSkeleton } from '../common/LoadingSkeleton';
import { EmptyState } from '../common/EmptyState';
import { ErrorState } from '../common/ErrorState';

export const FamilyAccessScreen: React.FC = () => {
  const { lang, translations, setCurrentScreen, screenState, setScreenState } = useLanguage();

  const [members, setMembers] = useState<FamilyMember[]>(INITIAL_FAMILY_MEMBERS);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showConfirmSheet, setShowConfirmSheet] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberPhone, setNewMemberPhone] = useState('');
  const [newMemberRelation, setNewMemberRelation] = useState('Son');
  const [selectedRole, setSelectedRole] = useState<FamilyRole>('Upload');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (screenState === 'loading') {
    return (
      <div className="max-w-lg mx-auto py-6 px-4">
        <LoadingSkeleton type="list" count={3} />
      </div>
    );
  }

  if (screenState === 'empty') {
    return (
      <div className="max-w-lg mx-auto py-10 px-4">
        <EmptyState
          icon="group_add"
          title="No Family Members Added"
          subtitle="You haven't granted access to any caregivers or relatives yet."
          actionLabel="Invite Family Member"
          onAction={() => setShowInviteModal(true)}
        />
      </div>
    );
  }

  if (screenState === 'error') {
    return (
      <div className="max-w-lg mx-auto py-10 px-4">
        <ErrorState
          title="Could not load family members"
          subtitle="Family access records are safely preserved in our encrypted database."
          onRetry={() => setScreenState('normal')}
        />
      </div>
    );
  }

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleOpenConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;
    setShowInviteModal(false);
    setShowConfirmSheet(true);
  };

  const handleGrantAccess = () => {
    const newMember: FamilyMember = {
      id: `fam-${Date.now()}`,
      name: newMemberName,
      relation: newMemberRelation,
      phone: newMemberPhone ? `+91 ${newMemberPhone}` : '+91 98200 11223',
      role: selectedRole,
      avatarUrl:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      addedDate: 'Today',
      canRevoke: true
    };

    setMembers([...members, newMember]);
    setShowConfirmSheet(false);
    setNewMemberName('');
    setNewMemberPhone('');
    triggerToast(
      lang === 'hi'
        ? `${newMember.name} को पारिवारिक पहुंच प्रदान कर दी गई है।`
        : `Access granted to ${newMember.name} (${newMember.role})`
    );
  };

  const handleRevokeMember = (memberId: string) => {
    const member = members.find(m => m.id === memberId);
    setMembers(members.filter(m => m.id !== memberId));
    triggerToast(`Revoked access for ${member?.name || 'member'}`);
  };

  const roleExplanations: Record<FamilyRole, { can: string[]; cannot: string[] }> = {
    View: {
      can: [
        'Read your historical lab reports and parameters',
        'Check medications and dosage reminders',
        'Review doctor visit consultation notes'
      ],
      cannot: [
        'Upload or edit your documents',
        'Share your records with outside doctors',
        'Change account security or delete data'
      ]
    },
    Upload: {
      can: [
        'View lab reports and prescription history',
        'Snap camera photos and upload prescriptions on your behalf',
        'Confirm medication intake notifications'
      ],
      cannot: [
        'Invite new members or change security permissions',
        'Delete any existing records or account data'
      ]
    },
    Manage: {
      can: [
        'Full access: View, upload, and organize all records',
        'Generate temporary consultation links for doctors',
        'Manage medication schedules and reminders'
      ],
      cannot: ['Permanently erase your account without two-step phone OTP authorization']
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto px-4 py-4 space-y-4">
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
          Caregiver Permissions
        </span>
      </div>

      {/* Title & "Invite family member" Button */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-snug">
            {translations.familyAccessTitle}
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed max-w-xs">
            {translations.familyAccessSubtitle}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowInviteModal(true)}
          className="min-h-[44px] px-3.5 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 shrink-0 transition-transform active:scale-95 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">person_add</span>
          <span>{translations.inviteFamilyBtn}</span>
        </button>
      </div>

      {/* Role Guide Card */}
      <div className="p-3 bg-teal-50/70 rounded-xl border border-teal-200/70 text-xs text-teal-950 flex items-center gap-2.5">
        <span className="material-symbols-outlined text-teal-700 text-[20px] shrink-0">info</span>
        <span className="leading-snug">{translations.rolesExplained}</span>
      </div>

      {/* Family Members List with Role Pills */}
      <div className="space-y-3 pt-1">
        {members.map((member) => (
          <div
            key={member.id}
            className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between gap-3 transition-all hover:border-slate-300"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative shrink-0">
                <img
                  src={member.avatarUrl}
                  alt={member.name}
                  className="w-11 h-11 rounded-full object-cover ring-2 ring-emerald-500/80"
                />
                {member.role === 'Manage' && (
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-teal-700 text-white flex items-center justify-center text-[10px]">
                    ★
                  </span>
                )}
              </div>

              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-bold text-slate-900 truncate">{member.name}</h3>
                  <span className="text-[10px] text-slate-400 font-medium truncate">
                    ({member.relation})
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 truncate mt-0.5">{member.phone}</span>
                <span className="text-[10px] text-slate-400">Added: {member.addedDate}</span>
              </div>
            </div>

            {/* Role Pill & Revoke CTA */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Role Pill */}
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                  member.role === 'Manage'
                    ? 'bg-teal-50 text-teal-800 border-teal-200'
                    : member.role === 'Upload'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-sky-50 text-sky-800 border-sky-200'
                }`}
              >
                {member.role}
              </span>

              {/* Revoke button if permitted */}
              {member.canRevoke && (
                <button
                  type="button"
                  onClick={() => handleRevokeMember(member.id)}
                  title="Remove family access"
                  className="w-8 h-8 rounded-full hover:bg-rose-50 text-slate-400 hover:text-rose-700 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">person_remove</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Invite Member Sheet */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto sm:hidden -mt-2 mb-2"></div>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-teal-700 text-[22px]">
                  person_add
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  {lang === 'hi' ? 'परिवार के सदस्य को आमंत्रित करें' : 'Invite Family Member'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleOpenConfirm} className="space-y-4 pt-1">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Full Name / पूरा नाम
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vikram Sharma"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  className="w-full min-h-[48px] px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold focus:outline-none focus:border-teal-700 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Relationship</label>
                  <select
                    value={newMemberRelation}
                    onChange={(e) => setNewMemberRelation(e.target.value)}
                    className="w-full min-h-[48px] px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none"
                  >
                    <option value="Son">Son (बेटा)</option>
                    <option value="Daughter">Daughter (बेटी)</option>
                    <option value="Spouse">Spouse (पति/पत्नी)</option>
                    <option value="Caregiver">Caregiver (देखभालकर्ता)</option>
                    <option value="Physician">Personal Doctor</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="98200 11223"
                    value={newMemberPhone}
                    onChange={(e) => setNewMemberPhone(e.target.value)}
                    className="w-full min-h-[48px] px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none"
                  />
                </div>
              </div>

              {/* Role Selector Pills */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Select Access Role
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['View', 'Upload', 'Manage'] as FamilyRole[]).map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setSelectedRole(role)}
                      className={`min-h-[44px] rounded-xl text-xs font-bold border transition-all cursor-pointer flex flex-col items-center justify-center p-2 ${
                        selectedRole === role
                          ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span>{role}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="submit"
                  className="w-full min-h-[48px] rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm shadow-md shadow-teal-700/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Continue to Confirmation Sheet</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="w-full min-h-[40px] text-xs font-semibold text-slate-500"
                >
                  {translations.cancelBtn}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Sheet Before Giving Access */}
      {showConfirmSheet && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto sm:hidden -mt-2 mb-2"></div>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-800 border border-teal-200 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[22px]">verified_user</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {translations.confirmAccessTitle}
                  </h3>
                  <span className="text-xs text-slate-500">
                    Role: <strong className="text-teal-800">{selectedRole}</strong>
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowConfirmSheet(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {translations.confirmAccessDesc} <strong className="text-slate-900">{newMemberName}</strong> ({newMemberRelation}):
            </p>

            {/* Clear breakdown of what they can do vs what they cannot do */}
            <div className="space-y-3 pt-1">
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-xl space-y-1.5">
                <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-emerald-700">
                    check_circle
                  </span>
                  <span>{translations.confirmAccessWhatTheyCanDo}</span>
                </span>
                <ul className="text-xs text-slate-700 space-y-1 pl-5 list-disc">
                  {roleExplanations[selectedRole].can.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-slate-500">
                    block
                  </span>
                  <span>{translations.confirmAccessWhatTheyCannotDo}</span>
                </span>
                <ul className="text-xs text-slate-600 space-y-1 pl-5 list-disc">
                  {roleExplanations[selectedRole].cannot.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleGrantAccess}
                className="w-full min-h-[48px] rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm shadow-md shadow-teal-700/20 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[20px]">check</span>
                <span>{translations.grantAccessBtn}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowConfirmSheet(false)}
                className="w-full min-h-[40px] text-xs font-semibold text-slate-500"
              >
                {translations.cancelBtn}
              </button>
            </div>
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
