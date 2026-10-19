import { LoanRecord, PaymentReceipt, PenaltySettings, NotificationLog } from '../types';
import { DEFAULT_PENALTY_SETTINGS, generateEmiSchedule } from './calculations';

const STORAGE_KEYS = {
  LOANS: 'ssssm_loans_data_v1',
  LOANS_BACKUP: 'ssssm_loans_live_backup_v1',
  RECEIPTS: 'ssssm_receipts_data_v1',
  SETTINGS: 'ssssm_penalty_settings_v1',
  NOTIFICATIONS: 'ssssm_notifications_log_v1',
  USER_ROLE: 'ssssm_current_role_v1',
  APP_INITIALIZED: 'ssssm_app_initialized_v1',
};

// Realistic Seed data for Samajotthan Sai Sakh Sahakari Sanstha Maryadit, Bhopal
export const INITIAL_SEED_LOANS: LoanRecord[] = [
  {
    id: 'loan-101',
    loanAccountNo: 'SSSSM/LN/2026/001',
    borrowerName: 'राजेश कुमार शर्मा',
    memberNo: 'M-1042',
    fatherSpouseName: 'श्री रामेश्वर दयाल शर्मा',
    mobile: '9826012345',
    email: 'rajesh.sharma.bpl@gmail.com',
    address: 'मकान नं. 45, वार्ड 22, कोलार रोड, भोपाल (म.प्र.)',
    aadharNoMasked: 'XXXX-XXXX-8492',
    bankName: 'स्टेट बैंक ऑफ इंडिया (SBI), टी.टी. नगर शाखा, भोपाल',
    accountNumber: '30491029384',
    ifscCode: 'SBIN0001042',
    loanDate: '2026-05-15',
    disbursementDate: '2026-05-18',
    utrTransferRef: 'SBIN7261948201',
    advanceChequeNo: '482019',
    appliedAmount: 100000,
    sanctionedAmount: 100000,
    interestRate: 14,
    tenureMonths: 24,
    calculationMethod: 'reducing_installment',
    monthlyEmi: 5333,
    preEmiDeduction: 5000,
    processingFee: 500,
    buildingFund: 300,
    shareCapitalDeduction: 0,
    netDisbursedAmount: 94200,
    disbursedChequeNo: 'CHQ-890214',
    mandatoryAmanatRashi: 100,
    amanatStatus: 'deposited',
    guarantor1: {
      name: 'महेश चंद्र वर्मा',
      memberNo: 'M-0814',
      chequeNo: '729103',
      mobile: '9425098765',
      address: 'प्लाट 12, न्यू मार्केट, भोपाल',
      relation: 'सहकारी सदस्य / मित्र',
      occupation: 'दुकानदार',
    },
    guarantor2: {
      name: 'दिनेश कुमार साहू',
      memberNo: 'M-0952',
      chequeNo: '109284',
      mobile: '9893123490',
      address: 'म.नं. 104, शिवाजी नगर, भोपाल',
      relation: 'सहकारी सदस्य',
      occupation: 'शासकीय कर्मचारी',
    },
    emiSchedule: [],
    status: 'active',
    totalPaidPrincipal: 15400,
    totalPaidInterest: 3804,
    totalPaidPenalty: 0,
    outstandingBalance: 84600,
    createdAt: '2026-05-15T10:00:00Z',
    updatedAt: '2026-09-18T14:20:00Z',
    notes: 'किश्तें नियमित रूप से जमा कर रहे हैं।',
  },
  {
    id: 'loan-102',
    loanAccountNo: 'SSSSM/LN/2026/002',
    borrowerName: 'सुनील कुमार पटले',
    memberNo: 'M-1108',
    fatherSpouseName: 'श्री बाबूलाल पटले',
    mobile: '9752109843',
    email: 'sunil.patle.bpl@yahoo.com',
    address: 'ग्राम पिपलिया, बैरसिया रोड, भोपाल',
    aadharNoMasked: 'XXXX-XXXX-6120',
    bankName: 'मध्य प्रदेश ग्रामीण बैंक, बैरसिया शाखा',
    accountNumber: '70291823901',
    ifscCode: 'CRGB0000412',
    loanDate: '2026-03-10',
    disbursementDate: '2026-03-12',
    utrTransferRef: 'MPGB9102837461',
    advanceChequeNo: '319028',
    appliedAmount: 50000,
    sanctionedAmount: 50000,
    interestRate: 14,
    tenureMonths: 24,
    calculationMethod: 'reducing_installment',
    monthlyEmi: 2667,
    preEmiDeduction: 2500,
    processingFee: 500,
    buildingFund: 300,
    shareCapitalDeduction: 0,
    netDisbursedAmount: 46700,
    disbursedChequeNo: 'CHQ-890215',
    mandatoryAmanatRashi: 100,
    amanatStatus: 'deposited',
    guarantor1: {
      name: 'कैलाश नारायण जोशी',
      memberNo: 'M-0640',
      chequeNo: '482011',
      mobile: '9827033441',
      address: 'गांधी नगर, एयरपोर्ट रोड, भोपाल',
      relation: 'रिश्तेदार / सदस्य',
      occupation: 'व्यापारी',
    },
    guarantor2: {
      name: 'संजय मीना',
      memberNo: 'M-1019',
      chequeNo: '839201',
      mobile: '9424455667',
      address: 'एम.पी. नगर जोन-2, भोपाल',
      relation: 'व्यापारिक साझीदार',
      occupation: 'ठेकेदार',
    },
    emiSchedule: [],
    status: 'overdue',
    totalPaidPrincipal: 5200,
    totalPaidInterest: 2003,
    totalPaidPenalty: 120,
    outstandingBalance: 44800,
    createdAt: '2026-03-10T11:30:00Z',
    updatedAt: '2026-10-10T09:15:00Z',
    notes: 'पिछली 2 किश्तें विलंबित हैं, तगादा सूचना पत्र प्रेषित किया गया।',
  },
  {
    id: 'loan-103',
    loanAccountNo: 'SSSSM/LN/2026/003',
    borrowerName: 'श्रीमती अनीता देवी मालवीय',
    memberNo: 'M-1154',
    fatherSpouseName: 'पति श्री विक्रम मालवीय',
    mobile: '9826188990',
    email: 'anita.malviya.bhopal@gmail.com',
    address: 'फ्लैट 203, सागर रॉयल विला, होशंगाबाद रोड, भोपाल',
    aadharNoMasked: 'XXXX-XXXX-9934',
    bankName: 'बैंक ऑफ बड़ौदा (BOB), अरेरा कॉलोनी, भोपाल',
    accountNumber: '19283746501',
    ifscCode: 'BARB0ARERAC',
    loanDate: '2026-06-01',
    disbursementDate: '2026-06-04',
    utrTransferRef: 'BARBR583920194',
    advanceChequeNo: '992014',
    appliedAmount: 200000,
    sanctionedAmount: 200000,
    interestRate: 14,
    tenureMonths: 24,
    calculationMethod: 'reducing_installment',
    monthlyEmi: 10667,
    preEmiDeduction: 10000,
    processingFee: 500,
    buildingFund: 300,
    shareCapitalDeduction: 0,
    netDisbursedAmount: 189200,
    disbursedChequeNo: 'CHQ-890216',
    mandatoryAmanatRashi: 100,
    amanatStatus: 'deposited',
    guarantor1: {
      name: 'सुरेंद्र कुमार दुबे',
      memberNo: 'M-0721',
      chequeNo: '627190',
      mobile: '9893044556',
      address: 'ई-7 अरेरा कॉलोनी, भोपाल',
      relation: 'सहकारी सदस्य',
      occupation: 'अधिवक्ता',
    },
    guarantor2: {
      name: 'मनोज कुमार अहिरवार',
      memberNo: 'M-0994',
      chequeNo: '554019',
      mobile: '9425122334',
      address: 'अयोध्या बायपास, भोपाल',
      relation: 'मित्र / सदस्य',
      occupation: 'व्यापारी',
    },
    emiSchedule: [],
    status: 'active',
    totalPaidPrincipal: 28800,
    totalPaidInterest: 9612,
    totalPaidPenalty: 0,
    outstandingBalance: 171200,
    createdAt: '2026-06-01T10:00:00Z',
    updatedAt: '2026-09-05T12:00:00Z',
    notes: 'समय पर ईएमआई का भुगतान हो रहा है।',
  },
  {
    id: 'loan-104',
    loanAccountNo: 'SSSSM/LN/2026/004',
    borrowerName: 'अशोक कुमार पाटीदार',
    memberNo: 'M-1205',
    fatherSpouseName: 'श्री रामगोपाल पाटीदार',
    mobile: '9827011223',
    email: 'ashok.patidar.agro@gmail.com',
    address: 'ग्राम करोंद, विदिशा रोड, भोपाल',
    aadharNoMasked: 'XXXX-XXXX-3341',
    bankName: 'केनरा बैंक, हमीदिया रोड, भोपाल',
    accountNumber: '40192837461',
    ifscCode: 'CNRB0002145',
    loanDate: '2026-01-20',
    disbursementDate: '2026-01-24',
    utrTransferRef: 'CNRBN482910394',
    advanceChequeNo: '110294',
    appliedAmount: 350000,
    sanctionedAmount: 350000,
    interestRate: 14,
    tenureMonths: 36,
    calculationMethod: 'reducing_installment',
    monthlyEmi: 13806,
    preEmiDeduction: 17500,
    processingFee: 500,
    buildingFund: 300,
    shareCapitalDeduction: 0,
    netDisbursedAmount: 331700,
    disbursedChequeNo: 'CHQ-890217',
    mandatoryAmanatRashi: 100,
    amanatStatus: 'deposited',
    guarantor1: {
      name: 'भगवान सिंह धाकड़',
      memberNo: 'M-0512',
      chequeNo: '441920',
      mobile: '9424099881',
      address: 'करोंद मंडी के पास, भोपाल',
      relation: 'सहकारी सदस्य',
      occupation: 'कृषि व्यवसायी',
    },
    guarantor2: {
      name: 'प्रकाश चंद्र जैन',
      memberNo: 'M-0883',
      chequeNo: '772819',
      mobile: '9893322110',
      address: 'जवाहर चौक, भोपाल',
      relation: 'व्यापारी मित्र',
      occupation: 'दुकानदार',
    },
    emiSchedule: [],
    status: 'active',
    totalPaidPrincipal: 62000,
    totalPaidInterest: 33648,
    totalPaidPenalty: 0,
    outstandingBalance: 288000,
    createdAt: '2026-01-20T10:00:00Z',
    updatedAt: '2026-09-24T16:10:00Z',
    notes: '36 माह की योजना, नियमित किश्त भुगतान।',
  },
  {
    id: 'loan-105',
    loanAccountNo: 'SSSSM/LN/2026/005',
    borrowerName: 'हेमंत कुमार कुशवाह',
    memberNo: 'M-1240',
    fatherSpouseName: 'श्री रामदास कुशवाह',
    mobile: '9826310294',
    email: 'hemant.kus@gmail.com',
    address: 'वार्ड 15, भानपुर, भोपाल (म.प्र.)',
    aadharNoMasked: 'XXXX-XXXX-4190',
    bankName: 'यूनियन बैंक ऑफ इंडिया, भानपुर, भोपाल',
    accountNumber: '50291840291',
    ifscCode: 'UBIN0532014',
    loanDate: '2026-07-05',
    disbursementDate: '2026-07-08',
    utrTransferRef: 'UBINR920194821',
    advanceChequeNo: '582019',
    appliedAmount: 400000,
    sanctionedAmount: 400000,
    interestRate: 14,
    tenureMonths: 36,
    calculationMethod: 'reducing_installment',
    monthlyEmi: 15778,
    preEmiDeduction: 20000,
    processingFee: 500,
    buildingFund: 300,
    shareCapitalDeduction: 0,
    netDisbursedAmount: 379200,
    disbursedChequeNo: 'CHQ-890218',
    mandatoryAmanatRashi: 100,
    amanatStatus: 'deposited',
    guarantor1: {
      name: 'सतीश चंद्र चौबे',
      memberNo: 'M-0715',
      chequeNo: '819203',
      mobile: '9425182910',
      address: 'म.नं. 28, अयोध्या बाईपास, भोपाल',
      relation: 'सहकारी सदस्य',
      occupation: 'शिक्षक',
    },
    guarantor2: {
      name: 'विनोद कुमार राठौर',
      memberNo: 'M-1102',
      chequeNo: '304918',
      mobile: '9826071829',
      address: 'करोद, भोपाल',
      relation: 'व्यापारी',
      occupation: 'दुकानदार',
    },
    emiSchedule: [],
    status: 'active',
    totalPaidPrincipal: 44440,
    totalPaidInterest: 18400,
    totalPaidPenalty: 0,
    outstandingBalance: 355560,
    createdAt: '2026-07-05T10:00:00Z',
    updatedAt: '2026-10-08T15:00:00Z',
    notes: '₹4,00,000 योजना, ₹20,000 प्री-ईएमआई कटौती, नियमित खाता।',
  },
];

// Initialize schedules and lock status for seed data if not built yet
function initSeedSchedules() {
  const asOf = '2026-10-19';
  INITIAL_SEED_LOANS.forEach((loan) => {
    loan.isSeed = true;
    if (loan.isLocked === undefined) {
      loan.isLocked = true;
      loan.lockedAt = '2026-10-19T09:00:00.000Z';
      loan.lockedBy = 'ऑटो-लॉक सिस्टम (Auto-Lock)';
    }
    if (!loan.mandatoryAmanatRashi) {
      loan.mandatoryAmanatRashi = 100;
      loan.amanatStatus = 'deposited';
    }
    if (!loan.emiSchedule || loan.emiSchedule.length === 0) {
      loan.emiSchedule = generateEmiSchedule(
        loan.sanctionedAmount,
        loan.interestRate,
        loan.tenureMonths,
        loan.calculationMethod || 'reducing_installment',
        loan.loanDate,
        DEFAULT_PENALTY_SETTINGS,
        asOf,
        true,
        loan.preEmiDeduction
      );

      // Mark early installments as paid based on total paid
      let remainingPaid = loan.totalPaidPrincipal + loan.totalPaidInterest;
      loan.emiSchedule.forEach((item) => {
        if (remainingPaid >= item.totalEmi) {
          item.paidAmount = item.totalEmi;
          item.status = 'paid';
          item.onTimePayment = true;
          item.paidDate = item.dueDate;
          item.paymentMode = 'bank_transfer';
          item.receiptNo = `RCPT-${item.installmentNo.toString().padStart(4, '0')}`;
          item.penalty = 0;
          remainingPaid -= item.totalEmi;
        } else if (remainingPaid > 0) {
          item.paidAmount = remainingPaid;
          item.status = 'partial';
          item.onTimePayment = true;
          remainingPaid = 0;
        }
      });
    }
  });
}

initSeedSchedules();

export const Storage = {
  getLoans(): LoanRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.LOANS);
      const isInitialized = localStorage.getItem(STORAGE_KEYS.APP_INITIALIZED);

      // If user has already visited and customized data (even if 0 loans), don't resurrect dummy data
      if (data !== null) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) return parsed;
      }

      // Check secondary backup if main key was corrupted or wiped
      const backupData = localStorage.getItem(STORAGE_KEYS.LOANS_BACKUP);
      if (backupData !== null) {
        const parsedBackup = JSON.parse(backupData);
        if (Array.isArray(parsedBackup)) {
          this.saveLoans(parsedBackup);
          return parsedBackup;
        }
      }

      // Only seed on first initialization if never initialized
      if (!isInitialized) {
        localStorage.setItem(STORAGE_KEYS.APP_INITIALIZED, 'true');
        this.saveLoans(INITIAL_SEED_LOANS);
        return INITIAL_SEED_LOANS;
      }

      return [];
    } catch {
      return INITIAL_SEED_LOANS;
    }
  },

  // Save with dual-key redundancy for 100% live data retention
  saveLoans(loans: LoanRecord[]): void {
    try {
      const serialized = JSON.stringify(loans);
      localStorage.setItem(STORAGE_KEYS.LOANS, serialized);
      localStorage.setItem(STORAGE_KEYS.LOANS_BACKUP, serialized);
      localStorage.setItem(STORAGE_KEYS.APP_INITIALIZED, 'true');
      // Dispatch custom event for real-time live sync
      window.dispatchEvent(new CustomEvent('ssssm_loans_updated', { detail: loans }));
    } catch (e) {
      console.error('Storage save error:', e);
    }
  },

  getLoanById(id: string): LoanRecord | undefined {
    return this.getLoans().find((l) => l.id === id);
  },

  // Add new loan - auto-locks immediately upon creation
  addLoan(loan: LoanRecord): void {
    const loans = this.getLoans();
    const secureLoan: LoanRecord = {
      ...loan,
      isSeed: false, // Live user entry
      isLocked: true, // Auto-lock system
      lockedAt: new Date().toISOString(),
      lockedBy: 'ऑटो-लॉक सिस्टम (Auto-Lock)',
      createdAt: loan.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    loans.unshift(secureLoan);
    this.saveLoans(loans);
  },

  // Update existing loan - auto-locks upon save
  updateLoan(updated: LoanRecord): void {
    const loans = this.getLoans();
    const idx = loans.findIndex((l) => l.id === updated.id);
    if (idx !== -1) {
      loans[idx] = {
        ...updated,
        isLocked: true, // Re-lock after modification
        lockedAt: new Date().toISOString(),
        lockedBy: 'ऑटो-लॉक सिस्टम (Auto-Lock)',
        updatedAt: new Date().toISOString(),
      };
      this.saveLoans(loans);
    }
  },

  // Modify loan by admin or authorized user (maintains audit trail)
  modifyLoan(updated: LoanRecord, modifiedBy: string = 'व्यवस्थापक (Admin)'): void {
    const loans = this.getLoans();
    const idx = loans.findIndex((l) => l.id === updated.id);
    if (idx !== -1) {
      loans[idx] = {
        ...updated,
        lastModifiedAt: new Date().toISOString(),
        lastModifiedBy: modifiedBy,
        updatedAt: new Date().toISOString(),
        isLocked: true, // auto lock again after edit
        lockedAt: new Date().toISOString(),
        lockedBy: `${modifiedBy} (Auto-Locked)`,
      };
      this.saveLoans(loans);
    }
  },

  // Toggle record lock status (Admin function)
  toggleLock(id: string, lockStatus: boolean, adminName: string = 'व्यवस्थापक (Admin)'): LoanRecord | undefined {
    const loans = this.getLoans();
    const target = loans.find((l) => l.id === id);
    if (target) {
      target.isLocked = lockStatus;
      if (lockStatus) {
        target.lockedAt = new Date().toISOString();
        target.lockedBy = adminName;
      } else {
        target.lockedAt = undefined;
        target.lockedBy = undefined;
      }
      this.saveLoans(loans);
      return target;
    }
    return undefined;
  },

  deleteLoan(id: string): void {
    const loans = this.getLoans().filter((l) => l.id !== id);
    this.saveLoans(loans);
  },

  // Purge dummy/sample entries and keep ONLY real live entries entered by user
  clearDummyLoans(): number {
    const current = this.getLoans();
    const seedIds = new Set(['loan-101', 'loan-102', 'loan-103', 'loan-104', 'loan-105']);
    const liveLoans = current.filter((l) => !l.isSeed && !seedIds.has(l.id));
    const removedCount = current.length - liveLoans.length;
    this.saveLoans(liveLoans);
    return removedCount;
  },

  getReceipts(): PaymentReceipt[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.RECEIPTS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  addReceipt(receipt: PaymentReceipt): void {
    const receipts = this.getReceipts();
    receipts.unshift(receipt);
    localStorage.setItem(STORAGE_KEYS.RECEIPTS, JSON.stringify(receipts));
  },

  getSettings(): PenaltySettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? JSON.parse(data) : DEFAULT_PENALTY_SETTINGS;
    } catch {
      return DEFAULT_PENALTY_SETTINGS;
    }
  },

  saveSettings(settings: PenaltySettings): void {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  },

  getNotifications(): NotificationLog[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  addNotification(log: NotificationLog): void {
    const logs = this.getNotifications();
    logs.unshift(log);
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(logs));
  },

  // Export complete society database as a downloadable JSON backup
  exportDatabase(): string {
    const dbExport = {
      sanstha: 'समोत्थान सांई साख सहकारी संस्था मर्यादित, भोपाल',
      exportedAt: new Date().toISOString(),
      loans: this.getLoans(),
      receipts: this.getReceipts(),
      settings: this.getSettings(),
      notifications: this.getNotifications(),
    };
    return JSON.stringify(dbExport, null, 2);
  },

  // Import / restore society database
  importDatabase(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.loans && Array.isArray(parsed.loans)) {
        this.saveLoans(parsed.loans);
        if (parsed.receipts) localStorage.setItem(STORAGE_KEYS.RECEIPTS, JSON.stringify(parsed.receipts));
        if (parsed.settings) this.saveSettings(parsed.settings);
        if (parsed.notifications) localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(parsed.notifications));
        return true;
      }
      return false;
    } catch (e) {
      console.error('Import error', e);
      return false;
    }
  },
};
