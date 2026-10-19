export type UserRole = 'admin' | 'cashier' | 'recovery';

export interface AuthUser {
  role: UserRole;
  name: string;
  hindiTitle: string;
  email: string;
}

export interface Guarantor {
  name: string;
  memberNo: string;
  chequeNo: string;
  mobile: string;
  address: string;
  relation: string;
  occupation?: string;
}

export interface InstallmentItem {
  installmentNo: number; // ईएमआई क्रमांक
  dueDate: string; // ईएमआई देय तिथि (YYYY-MM-DD)
  principal: number; // मूलधन
  interest: number; // ब्याज
  totalEmi: number; // कुल देय राशि
  paidDate?: string; // जमा दिनांक
  paymentMode?: 'cash' | 'bank_transfer' | 'cheque'; // जमा करने का माध्यम
  paidAmount: number; // कुल जमा राशि
  paidPrincipal?: number; // जमा मूलधन
  paidInterest?: number; // जमा ब्याज
  penalty: number; // विलंब दंड (₹2.6/दिन)
  penaltyPaid?: number; // जमा दंड
  daysOverdue: number; // विलंब दिन
  status: 'pending' | 'paid' | 'partial' | 'overdue';
  onTimePayment?: boolean; // सही समय पर जमा (ग्रीन कलर)
  receiptNo?: string;
  remarks?: string;
}

export type CalculationMethod = 'reducing_installment' | 'reducing_balance' | 'flat';

export interface LoanRecord {
  id: string;
  loanAccountNo: string; // e.g. SSS-LOAN-2026-001
  borrowerName: string; // ऋणी का नाम
  memberNo: string; // सदस्यता क्रमांक
  fatherSpouseName: string; // पिता / पति का नाम
  mobile: string; // मोबाइल नंबर
  email?: string; // ईमेल (सूचनाओं हेतु)
  address: string; // स्थायी निवास पता
  aadharNoMasked?: string; // आधार क्रमांक
  
  // Bank details for disbursement
  bankName: string; // बैंक का नाम
  accountNumber: string; // खाता क्रमांक
  ifscCode: string; // IFSC कोड
  disbursementDate: string; // कब उसके अकाउंट में ट्रांसफर हुआ
  utrTransferRef: string; // UTR / ट्रांसफर संदर्भ संख्या
  
  // Cheque & dates
  loanDate: string; // ऋण स्वीकृति / आवेदन तिथि
  advanceChequeNo: string; // अग्रिम सुरक्षा चेक नंबर (ऋणी का)
  
  // Loan Amounts & Terms
  appliedAmount: number; // आवेदन राशि
  sanctionedAmount: number; // स्वीकृत राशि (जैसे: ₹1,00,000)
  interestRate: number; // वार्षिक ब्याज दर (e.g. 14%)
  tenureMonths: number; // अवधि (माह) (e.g. 24, 36)
  calculationMethod: CalculationMethod; // 'reducing_installment' (घटते क्रम में किश्त) | 'reducing_balance' | 'flat'
  interestType?: 'reducing' | 'flat'; // backward compatibility
  monthlyEmi: number; // प्रथम/मासिक किश्त
  
  // Deductions at disbursement (कटौती विवरणी)
  preEmiDeduction: number; // अग्रिम प्री-ईएमआई कटौती (जैसे ₹5,000)
  processingFee: number; // प्रोसेसिंग फीस (स्थिर ₹500)
  buildingFund: number; // भवन निर्माण कोष (स्थिर ₹300)
  shareCapitalDeduction: number; // अन्य / अंश पूंजी (यदि हो)
  netDisbursedAmount: number; // ग्राहक को दिया गया चेक (जैसे ₹94,200)
  disbursedChequeNo?: string; // संस्था द्वारा ग्राहक को दिया गया चेक नं.
  
  // अलग से अनिवार्य अमानत राशि (₹100/-, जो लोन से अलग होगी)
  mandatoryAmanatRashi: number; // ₹100
  amanatStatus: 'deposited' | 'pending'; // जमा स्थिति
  
  // 02 Guarantors (ज़मानतदार 02 लोग रहेंगे)
  guarantor1: Guarantor;
  guarantor2: Guarantor;
  
  // Schedule & Repayments
  emiSchedule: InstallmentItem[];
  status: 'active' | 'closed' | 'overdue' | 'applied';
  
  totalPaidPrincipal: number;
  totalPaidInterest: number;
  totalPaidPenalty: number;
  outstandingBalance: number;
  
  // Lock and Live-Data Protection System (ऑटो-लॉक व्यवस्था)
  isLocked?: boolean; // क्या रिकॉर्ड लॉक है
  lockedAt?: string; // कब लॉक हुआ
  lockedBy?: string; // किसके द्वारा लॉक किया गया (Auto-lock / Admin)
  isSeed?: boolean; // क्या यह सैंपल/डम्मी डेटा है या रियल लाइव डेटा
  lastModifiedAt?: string; // अंतिम संशोधन दिनांक
  lastModifiedBy?: string; // अंतिम संशोधन कर्ता

  createdAt: string;
  updatedAt: string;
  notes?: string;
}

export interface PaymentReceipt {
  id: string;
  receiptNo: string; // e.g. RCPT-2026-0042
  loanId: string;
  loanAccountNo: string;
  borrowerName: string;
  memberNo: string;
  installmentNos: number[];
  principalAmount: number;
  interestAmount: number;
  penaltyAmount: number;
  totalPaid: number;
  paymentDate: string;
  paymentMode: 'cash' | 'bank_transfer' | 'cheque';
  transactionRef?: string;
  collectedBy: string;
  collectorRole: string;
  notes?: string;
}

export interface LoanScheme {
  id: string;
  name: string;
  amount: number;
  interestRate: number; // e.g. 14%
  tenureMonths: number; // 24 or 36
  interestType: 'reducing' | 'flat';
  description: string;
  popular?: boolean;
}

export interface PenaltySettings {
  gracePeriodDays: number; // e.g. 5 days after due date
  monthlyPenaltyRate: number; // e.g. 2% per month
  fixedDailyPenalty: number; // e.g. ₹10 per day (if flat)
  penaltyMode: 'percentage' | 'fixed_daily';
  shareCapitalRate: number; // default 5%
  processingFeeRate: number; // default 1% or flat
}

export interface NotificationLog {
  id: string;
  loanId: string;
  loanAccountNo: string;
  borrowerName: string;
  recipientType: 'borrower' | 'guarantor1' | 'guarantor2';
  recipientName: string;
  recipientContact: string; // email or phone
  channel: 'email' | 'whatsapp' | 'sms';
  subject: string;
  message: string;
  sentAt: string;
  status: 'sent' | 'queued' | 'simulated';
}
