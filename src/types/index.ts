/**
 * Types and interfaces for Altrix Lab Patient Privacy & Health Portal
 */

export type Language = 'en' | 'hi';

export type ScreenState = 'normal' | 'loading' | 'empty' | 'error';

export type ScreenId =
  | 'home'
  | 'timeline'
  | 'upload'
  | 'copilot'
  | 'summary'
  | 'report_detail'
  | 'privacy_hub'
  | 'consent_onboarding'
  | 'secure_signin'
  | 'activity_log'
  | 'doctor_share'
  | 'family_access'
  | 'data_download_delete'
  | 'session_expired';

export type FamilyRole = 'View' | 'Upload' | 'Manage';

export interface FamilyMember {
  id: string;
  name: string;
  relation: string;
  phone: string;
  role: FamilyRole;
  avatarUrl: string;
  addedDate: string;
  canRevoke: boolean;
}

export interface ShareLink {
  id: string;
  title: string;
  doctorName: string;
  clinic: string;
  createdAt: string;
  expiresAt: string;
  expiryChoice: '24 hours' | '7 days' | '30 days';
  hasPin: boolean;
  pinCode?: string;
  url: string;
  status: 'Active' | 'Revoked' | 'Expired';
  documents: string[];
  accessCount: number;
}

export interface ActivityLogItem {
  id: string;
  actor: string;
  actorRole: string;
  action: string;
  recordTitle: string;
  timestamp: string;
  device: string;
  location: string;
  status: 'Authorized' | 'PIN Verified' | 'Expired' | 'Revoked';
  ipAddress?: string;
}

export interface HealthRecord {
  id: string;
  title: string;
  type: 'Lab Report' | 'Prescription' | 'Diagnostic';
  date: string;
  provider: string;
  parametersCount?: number;
  status: 'Normal' | 'Needs review' | 'Processed';
  summary: string;
  sensitiveDiagnosis?: string;
  abhaId: string;
  tags: string[];
}
