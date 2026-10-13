import { FamilyMember, ShareLink, ActivityLogItem, HealthRecord } from '../types';

export const APP_ASSETS = {
  logo: 'https://lh3.googleusercontent.com/aida/AEtjO1W4qgceCnk6S4iBvl8NMKdBNwtDH8ZYpPyxj-bXwWBy-PwNisuK1Gb5-8DEgO3HctFMscMcoTJbl_Hb0QGhYgg98878IdCjB6u6VxuOTgT-IODFTa4nYJ1Pq1ujgjHu6MaNWjBdSQRSt6Z6JmTYpWxmHjazDkcFsML5998caVW-PmL2tpg9cN32sjKZuFoSnYieTz7BgabltEbPC-CR7ncwy0dDfKFyKFFN0l-vJhnZX6pJ0tL21DnDzvQ',
  sunitaAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCsgoJRpIxD3MIl8f5soFqSdvmZogu3i0RMpL14RblsQvBx_e0YepaZoo5vBoFlOUbZZJzm4KejkfOLzaQY-ldjZf-MBSjEvmDuHBsxspu6jgCwL-ujgjYJYkYbusf_gBIU1NQN8HGcZHhLQa2ZhOv3bjHsGVrfacbtbMuchPqpXkrjgvnhZC7Y19JFmLiF2pwsSs5pysbu_faI3EdHK7NSW4tr4urdhL0HJm3--uOznsOAfChWpwuF',
  drRajivAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCQ-uoUYzMh04qIINcfnoP7UJmchWEyW900b2rsZ_nU-1y0bq8Hez1UTkkGZ6NGbgfp0ok8d-ZBUoB2Zho404ThrsErXEtJY3lqT1Bkz43FZx69BYeu_VG-zmjNXK-ILR-03p9A4yjYFHy3TQVsOwYxp82ip3pAuB0EmOpRAYw_YDYgr3oDHNLVnszIndDA-4GUWaOzLLSNXjKRmUnH5jyz83YVP9HpCK7MrTni9mPTBxn_mrKm4fv8',
  prescriptionPhoto: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAnFndBLYmIOu88Id6aEfza7bdEzmLU63APh6BPxgqzN01r_zLRKVxKlDa2CFZFzsQMcTbOuEq5etoHWlcyCWg4NAlwoCDTRw9OndAHAmOHKMpNuUBEti-pRIkNTxFYbDV8JfY3AsfXj1Z7wuyqgTMvVuQ0G-N5TZ3gYLorYOyXnWMjIE47iPWe6lJ9zNlOcaajLP3d7dPV_yaYZiw4hAYEwooNtdsO-7RIVFZHPsMXQYZjeSffTfe9',
  pdfThumbnail: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDc3d3v6HS23EtH-SjfdtLQ4ekmoAMe-z3jVbgCERr2WbFzI2XhlxAoEiRbFMH7oKv2LIRvq5rIIsG3vTzsVLDomG6-XVi_EzcIotlZtfUjQeBnJbvBad54nL202jisAQYVIN2GnP7BteggOgBC_yeSX9z-sM69pDR_VtocD3bZYB1nGSRYfOUSP7rdqvLvojKdKrnpxqGRsBUsdGFF3XsQEuIcooSGDhualfPGwKPI0FMPv3knI763'
};

export const INITIAL_FAMILY_MEMBERS: FamilyMember[] = [
  {
    id: 'fam-1',
    name: 'Sunita Sharma',
    relation: 'Self (Account Owner)',
    phone: '+91 98721 00342',
    role: 'Manage',
    avatarUrl: APP_ASSETS.sunitaAvatar,
    addedDate: 'Account Creation',
    canRevoke: false
  },
  {
    id: 'fam-2',
    name: 'Ramesh Sharma',
    relation: 'Spouse',
    phone: '+91 98112 55431',
    role: 'Manage',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    addedDate: '15 Jan 2024',
    canRevoke: true
  },
  {
    id: 'fam-3',
    name: 'Ananya Sharma',
    relation: 'Daughter (Caregiver)',
    phone: '+91 99204 88310',
    role: 'Upload',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    addedDate: '02 Mar 2024',
    canRevoke: true
  },
  {
    id: 'fam-4',
    name: 'Dr. Rajiv Sharma',
    relation: 'Primary Physician',
    phone: '+91 98765 43210',
    role: 'View',
    avatarUrl: APP_ASSETS.drRajivAvatar,
    addedDate: '12 Oct 2024',
    canRevoke: true
  }
];

export const INITIAL_SHARE_LINKS: ShareLink[] = [
  {
    id: 'share-1',
    title: 'Consultation with Dr. Rajiv Sharma',
    doctorName: 'Dr. Rajiv Sharma',
    clinic: 'Fortis Diabetology Clinic',
    createdAt: '12 Oct 2024, 09:30 AM',
    expiresAt: '19 Oct 2024, 09:30 AM',
    expiryChoice: '7 days',
    hasPin: true,
    pinCode: '4892',
    url: 'https://altrix.health/share/sunita-s/84a9e2',
    status: 'Active',
    documents: [
      'Comprehensive Diabetes & Lipid Profile (12 Oct 2024)',
      'Prescription - Dr. Rajesh Mehta (12 Oct 2024)'
    ],
    accessCount: 2
  },
  {
    id: 'share-2',
    title: 'Second Opinion Review',
    doctorName: 'Dr. Sunita Kulkarni',
    clinic: 'Max Heart Institute',
    createdAt: '10 Oct 2024, 04:15 PM',
    expiresAt: '11 Oct 2024, 04:15 PM',
    expiryChoice: '24 hours',
    hasPin: false,
    url: 'https://altrix.health/share/sunita-s/c291da',
    status: 'Expired',
    documents: ['Cardiology ECG & Vitals Panel (22 Aug 2024)'],
    accessCount: 1
  }
];

export const INITIAL_ACTIVITY_LOGS: ActivityLogItem[] = [
  {
    id: 'act-1',
    actor: 'Dr. Rajiv Sharma',
    actorRole: 'Doctor (Via Shared Link)',
    action: 'Viewed Comprehensive Diabetes Profile',
    recordTitle: 'Comprehensive Diabetes Profile',
    timestamp: 'Today, 10:42 AM',
    device: 'Safari on Mac OS • Fortis Clinic Network',
    location: 'Gurugram, Haryana',
    status: 'PIN Verified',
    ipAddress: '103.24.112.4'
  },
  {
    id: 'act-2',
    actor: 'Sunita Sharma',
    actorRole: 'Self',
    action: 'Created 7-day secure link for Dr. Rajiv',
    recordTitle: '2 Health Documents',
    timestamp: '12 Oct 2024, 09:30 AM',
    device: 'Altrix Mobile App • iPhone 15',
    location: 'New Delhi, India',
    status: 'Authorized'
  },
  {
    id: 'act-3',
    actor: 'Ananya Sharma',
    actorRole: 'Caregiver (Family)',
    action: 'Uploaded lab report PDF',
    recordTitle: 'Comprehensive Diabetes & Lipid Profile',
    timestamp: '12 Oct 2024, 08:45 AM',
    device: 'Chrome Mobile • OnePlus 11',
    location: 'Bengaluru, Karnataka',
    status: 'Authorized'
  },
  {
    id: 'act-4',
    actor: 'Sunita Sharma',
    actorRole: 'Self',
    action: 'Biometric sign-in via Face ID',
    recordTitle: 'Account Security Session',
    timestamp: '12 Oct 2024, 08:30 AM',
    device: 'Altrix Mobile App • iPhone 15',
    location: 'New Delhi, India',
    status: 'Authorized'
  },
  {
    id: 'act-5',
    actor: 'Dr. Sunita Kulkarni',
    actorRole: 'Consultant',
    action: 'Accessed 24-hr consultation link',
    recordTitle: 'Cardiology ECG & Vitals Panel',
    timestamp: '10 Oct 2024, 05:20 PM',
    device: 'Chrome on Windows 11',
    location: 'New Delhi, India',
    status: 'Authorized'
  },
  {
    id: 'act-6',
    actor: 'System Security Engine',
    actorRole: 'Automated Protection',
    action: 'Revoked expired 24-hour doctor link',
    recordTitle: 'Cardiology ECG Link #c291da',
    timestamp: '11 Oct 2024, 04:16 PM',
    device: 'Automated Privacy Policy',
    location: 'Cloud Data Center (Mumbai)',
    status: 'Expired'
  }
];

export const INITIAL_RECORDS: HealthRecord[] = [
  {
    id: 'rec-1',
    title: 'Comprehensive Diabetes & Lipid Profile',
    type: 'Lab Report',
    date: '12 Oct 2024',
    provider: 'Dr. Lal PathLabs',
    parametersCount: 14,
    status: 'Needs review',
    summary: 'HbA1c 7.2%, Fasting Glucose 138 mg/dL. Kidney & Liver functions normal.',
    sensitiveDiagnosis: 'Type 2 Diabetes Mellitus with borderline glycemic volatility',
    abhaId: '91-8274-1029-4421',
    tags: ['Diabetes', 'Metabolic', 'KFT']
  },
  {
    id: 'rec-2',
    title: 'Prescription - Dr. Rajesh Mehta',
    type: 'Prescription',
    date: '12 Oct 2024',
    provider: 'Apollo Diabetology Clinic',
    status: 'Processed',
    summary: 'Metformin 500mg (BD), Telmisartan 40mg (OD), Glimepiride 1mg.',
    sensitiveDiagnosis: 'Oral Hypoglycemic therapy adjustment',
    abhaId: '91-8274-1029-4421',
    tags: ['Endocrinology', 'Prescription']
  },
  {
    id: 'rec-3',
    title: 'Cardiology ECG & Vitals Panel',
    type: 'Diagnostic',
    date: '22 Aug 2024',
    provider: 'Max Super Speciality Hospital',
    status: 'Normal',
    summary: 'Normal sinus rhythm, BP 132/84 mmHg, SpO2 98%.',
    sensitiveDiagnosis: 'Routine cardiac clearance',
    abhaId: '91-8274-1029-4421',
    tags: ['Cardiology', 'ECG']
  },
  {
    id: 'rec-4',
    title: 'Annual Health Checkup Panel',
    type: 'Lab Report',
    date: '10 May 2024',
    provider: 'Quest Diagnostics',
    parametersCount: 22,
    status: 'Normal',
    summary: 'Lipid & renal metrics optimal. Total Cholesterol 182 mg/dL.',
    sensitiveDiagnosis: 'Annual preventative assessment',
    abhaId: '91-8274-1029-4421',
    tags: ['Preventative', 'Lipid']
  }
];
