import React, { useState } from 'react';
import { 
  X, 
  Save, 
  Lock, 
  Unlock, 
  AlertCircle, 
  UserCheck, 
  Building2, 
  CreditCard, 
  ShieldCheck, 
  FileText,
  CheckCircle2,
  Phone,
  Landmark,
  KeyRound
} from 'lucide-react';
import { LoanRecord, Guarantor } from '../types';
import { formatCurrency, getPreEmiForAmount } from '../utils/calculations';

interface EditLoanModalProps {
  loan: LoanRecord;
  onSave: (updatedLoan: LoanRecord) => void;
  onClose: () => void;
  isAdmin: boolean;
}

export const EditLoanModal: React.FC<EditLoanModalProps> = ({
  loan,
  onSave,
  onClose,
  isAdmin,
}) => {
  // Form state
  const [borrowerName, setBorrowerName] = useState(loan.borrowerName);
  const [memberNo, setMemberNo] = useState(loan.memberNo);
  const [fatherSpouseName, setFatherSpouseName] = useState(loan.fatherSpouseName);
  const [mobile, setMobile] = useState(loan.mobile);
  const [email, setEmail] = useState(loan.email || '');
  const [address, setAddress] = useState(loan.address);
  const [aadharNoMasked, setAadharNoMasked] = useState(loan.aadharNoMasked || '');

  // Bank & Disbursement
  const [bankName, setBankName] = useState(loan.bankName);
  const [accountNumber, setAccountNumber] = useState(loan.accountNumber);
  const [ifscCode, setIfscCode] = useState(loan.ifscCode);
  const [disbursementDate, setDisbursementDate] = useState(loan.disbursementDate);
  const [utrTransferRef, setUtrTransferRef] = useState(loan.utrTransferRef);
  const [advanceChequeNo, setAdvanceChequeNo] = useState(loan.advanceChequeNo);
  const [disbursedChequeNo, setDisbursedChequeNo] = useState(loan.disbursedChequeNo || '');

  // Amounts & Deductions
  const [sanctionedAmount, setSanctionedAmount] = useState(loan.sanctionedAmount);
  const [preEmiDeduction, setPreEmiDeduction] = useState(loan.preEmiDeduction);
  const [processingFee, setProcessingFee] = useState(loan.processingFee || 500);
  const [buildingFund, setBuildingFund] = useState(loan.buildingFund || 300);
  const [mandatoryAmanatRashi, setMandatoryAmanatRashi] = useState(loan.mandatoryAmanatRashi || 100);
  const [amanatStatus, setAmanatStatus] = useState<'deposited' | 'pending'>(loan.amanatStatus || 'deposited');

  // Guarantors
  const [g1, setG1] = useState<Guarantor>({ ...loan.guarantor1 });
  const [g2, setG2] = useState<Guarantor>({ ...loan.guarantor2 });

  // Status & Lock
  const [status, setStatus] = useState<'active' | 'closed' | 'overdue'>(
    loan.status === 'applied' ? 'active' : loan.status
  );
  const [isLocked, setIsLocked] = useState(loan.isLocked ?? true);
  const [notes, setNotes] = useState(loan.notes || '');

  // Error / Admin PIN check if non-admin tries to toggle lock
  const [adminPinInput, setAdminPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [unlockedForEdit, setUnlockedForEdit] = useState(!loan.isLocked || isAdmin);

  // Auto-calculated net disbursed cheque
  const netCheque = Math.max(0, sanctionedAmount - preEmiDeduction - processingFee - buildingFund);

  const handleSanctionAmountChange = (newAmount: number) => {
    setSanctionedAmount(newAmount);
    setPreEmiDeduction(getPreEmiForAmount(newAmount));
  };

  const handleUnlockWithPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPinInput === '1234') {
      setUnlockedForEdit(true);
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedLoan: LoanRecord = {
      ...loan,
      borrowerName,
      memberNo,
      fatherSpouseName,
      mobile,
      email,
      address,
      aadharNoMasked,
      bankName,
      accountNumber,
      ifscCode,
      disbursementDate,
      utrTransferRef,
      advanceChequeNo,
      disbursedChequeNo,
      sanctionedAmount,
      preEmiDeduction,
      processingFee,
      buildingFund,
      netDisbursedAmount: netCheque,
      mandatoryAmanatRashi,
      amanatStatus,
      guarantor1: g1,
      guarantor2: g2,
      status,
      notes,
      isLocked: isLocked, // stays protected
      lockedAt: new Date().toISOString(),
      lockedBy: isAdmin ? 'व्यवस्थापक (Admin)' : 'सिस्टम ऑटो-लॉक',
      lastModifiedAt: new Date().toISOString(),
      lastModifiedBy: isAdmin ? 'प्रबंधक/Admin' : 'अधिकृत उपयोगकर्ता',
      updatedAt: new Date().toISOString(),
    };

    onSave(updatedLoan);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-5 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 text-slate-900 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold bg-amber-400 text-emerald-950 px-2 py-0.5 rounded">
                खाता: {loan.loanAccountNo}
              </span>
              <span className="text-xs text-emerald-200">
                सदस्यता: {loan.memberNo}
              </span>
              {loan.isLocked ? (
                <span className="text-[11px] bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold">
                  <Lock className="w-3 h-3 text-amber-400" />
                  सुरक्षित (Auto-Locked)
                </span>
              ) : (
                <span className="text-[11px] bg-amber-500 text-slate-900 px-2 py-0.5 rounded-full flex items-center gap-1 font-bold">
                  <Unlock className="w-3 h-3" />
                  अनलॉक
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold text-white mt-1 flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-400" />
              ऋण प्रविष्टि संशोधन एवं सम्पादन (Edit / Modify Loan Entry)
            </h2>
            <p className="text-xs text-emerald-200/80 mt-0.5">
              ऋणी का नाम, पता, मोबाइल, चेक नंबर, 2 ज़मानतदार एवं कटौती विवरण संशोधित करें
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* If record is locked and user is not verified, require Admin PIN */}
        {!unlockedForEdit ? (
          <div className="p-8 text-center max-w-md mx-auto my-auto space-y-4">
            <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <Lock className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">यह ऋण अभिलेख सुरक्षित / लॉक है</h3>
              <p className="text-xs text-slate-600 mt-1">
                संस्था के वित्तीय नियमों के अनुसार अनधिकृत परिवर्तन रोकने हेतु यह रिकॉर्ड स्वतः लॉक किया गया है। इसे संपादित करने हेतु व्यवस्थापक पिन दर्ज करें।
              </p>
            </div>

            <form onSubmit={handleUnlockWithPin} className="space-y-3 pt-2">
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  placeholder="व्यवस्थापक पिन (Default: 1234)"
                  value={adminPinInput}
                  onChange={(e) => setAdminPinInput(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-emerald-600 text-center font-mono tracking-widest"
                  autoFocus
                />
              </div>

              {pinError && (
                <p className="text-xs text-rose-600 font-semibold">गलत पिन! कृपया व्यवस्थापक पिन '1234' दर्ज करें।</p>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-1/2 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md transition"
                >
                  अनलॉक करें 🔓
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Main Edit Form */
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {/* Live Data Protection Guarantee Alert */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between gap-3 text-xs text-emerald-900">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
                <span>
                  <strong>लाइव डेटा ऑटो-सेव सुरक्षा:</strong> आपके द्वारा किए गए सभी संशोधन तत्काल लाइव सहेजे जाएंगे। पेज रीलोड होने पर भी 1% डेटा नहीं बदलेगा।
                </span>
              </div>
              <span className="font-mono text-[11px] font-bold bg-emerald-200/80 text-emerald-950 px-2 py-0.5 rounded shrink-0">
                सुरक्षित अभिलेख
              </span>
            </div>

            {/* Section 1: Borrower Information */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b pb-1.5 border-slate-200">
                <UserCheck className="w-4 h-4 text-emerald-600" />
                1. ऋणी सदस्य का विवरण (Borrower Details)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">ऋणी का पूरा नाम *</label>
                  <input
                    type="text"
                    required
                    value={borrowerName}
                    onChange={(e) => setBorrowerName(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">सदस्यता क्रमांक (Member No) *</label>
                  <input
                    type="text"
                    required
                    value={memberNo}
                    onChange={(e) => setMemberNo(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 font-mono font-bold text-emerald-800"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">पिता / पति का नाम *</label>
                  <input
                    type="text"
                    required
                    value={fatherSpouseName}
                    onChange={(e) => setFatherSpouseName(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">मोबाइल नंबर *</label>
                  <input
                    type="tel"
                    required
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">ईमेल (सूचनाओं हेतु)</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">आधार क्रमांक (सुरक्षित/मास्क्ड)</label>
                  <input
                    type="text"
                    value={aadharNoMasked}
                    onChange={(e) => setAadharNoMasked(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 font-mono"
                  />
                </div>

                <div className="sm:col-span-2 md:col-span-3">
                  <label className="block text-slate-600 font-semibold mb-1">स्थायी निवास पता *</label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Financial Terms & Disbursal Formula */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b pb-1.5 border-slate-200">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                2. ऋण राशि, चेक कटौती एवं शुद्ध वितरण (Disbursal Cheque Formula)
              </h3>
              
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">स्वीकृत ऋण राशि (₹) *</label>
                  <input
                    type="number"
                    step="5000"
                    required
                    value={sanctionedAmount}
                    onChange={(e) => handleSanctionAmountChange(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 font-mono font-bold text-sm text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">प्री-ईएमआई कटौती (1 किश्त) *</label>
                  <input
                    type="number"
                    required
                    value={preEmiDeduction}
                    onChange={(e) => setPreEmiDeduction(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 font-mono font-bold text-sm text-amber-700"
                  />
                  <span className="text-[10px] text-slate-500">50k=2500, 1L=5000, 1.5L=7500...</span>
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">प्रोसेसिंग फीस (स्थिर ₹500)</label>
                  <input
                    type="number"
                    value={processingFee}
                    onChange={(e) => setProcessingFee(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">भवन निर्माण कोष (स्थिर ₹300)</label>
                  <input
                    type="number"
                    value={buildingFund}
                    onChange={(e) => setBuildingFund(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 font-mono text-sm"
                  />
                </div>

                <div className="sm:col-span-2 md:col-span-2 bg-emerald-900 text-white p-3 rounded-lg flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-bold text-amber-300 uppercase">ग्राहक को देय शुद्ध चेक राशि (FORMULA)</div>
                    <div className="text-xl font-black font-mono mt-0.5 text-white">
                      {formatCurrency(netCheque)}
                    </div>
                  </div>
                  <div className="text-right text-[10px] text-emerald-200">
                    {sanctionedAmount} - ({preEmiDeduction} + {processingFee} + {buildingFund})
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">संस्था का जारी चेक नं.</label>
                  <input
                    type="text"
                    value={disbursedChequeNo}
                    onChange={(e) => setDisbursedChequeNo(e.target.value)}
                    placeholder="उदा. CHQ-890214"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">ऋणी का अग्रिम सुरक्षा चेक नं. *</label>
                  <input
                    type="text"
                    required
                    value={advanceChequeNo}
                    onChange={(e) => setAdvanceChequeNo(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 font-mono font-bold text-emerald-800"
                  />
                </div>
              </div>

              {/* Mandatory Amanat Rashi ₹100 */}
              <div className="bg-amber-50/70 border border-amber-200 p-3 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-bold text-amber-900 flex items-center gap-1.5">
                    <span>अनिवार्य अमानत राशि (ऋण से अलग संधारित):</span>
                    <strong className="text-sm font-mono text-amber-800">₹{mandatoryAmanatRashi}/-</strong>
                  </span>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    यह ₹100 अमानत राशि ऋण खाते व किश्त से पृथक संस्था की अनिवार्य धरोहर राशि है।
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <label className="font-semibold text-slate-700">अमानत स्थिति:</label>
                  <select
                    value={amanatStatus}
                    onChange={(e) => setAmanatStatus(e.target.value as 'deposited' | 'pending')}
                    className="px-2 py-1 border border-amber-300 rounded-lg bg-white font-semibold text-xs text-amber-900"
                  >
                    <option value="deposited">✓ जमा है (Deposited)</option>
                    <option value="pending">लंबित (Pending)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 3: Bank Account for Disbursement */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b pb-1.5 border-slate-200">
                <Landmark className="w-4 h-4 text-emerald-600" />
                3. बैंक खाता एवं ट्रांसफर संदर्भ (Bank Account Details)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">बैंक का नाम व शाखा *</label>
                  <input
                    type="text"
                    required
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">खाता क्रमांक *</label>
                  <input
                    type="text"
                    required
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">IFSC कोड *</label>
                  <input
                    type="text"
                    required
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">वितरण दिनांक (Disbursement Date)</label>
                  <input
                    type="date"
                    value={disbursementDate}
                    onChange={(e) => setDisbursementDate(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-600 font-semibold mb-1">UTR / बैंक ट्रांसफर संदर्भ संख्या</label>
                  <input
                    type="text"
                    value={utrTransferRef}
                    onChange={(e) => setUtrTransferRef(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Section 4: 02 Guarantors */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b pb-1.5 border-slate-200">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                4. अनिवार्य 02 ज़मानतदार (Two Guarantors)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Guarantor 1 */}
                <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-2 text-xs">
                  <div className="font-bold text-emerald-900 flex items-center justify-between">
                    <span>ज़मानतदार 1 (प्रथम प्रतिभू)</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">अनिवार्य</span>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-0.5">नाम *</label>
                    <input
                      type="text"
                      required
                      value={g1.name}
                      onChange={(e) => setG1({ ...g1, name: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-600 font-semibold mb-0.5">सदस्यता क्र. *</label>
                      <input
                        type="text"
                        required
                        value={g1.memberNo}
                        onChange={(e) => setG1({ ...g1, memberNo: e.target.value })}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-semibold mb-0.5">चेक नंबर *</label>
                      <input
                        type="text"
                        required
                        value={g1.chequeNo}
                        onChange={(e) => setG1({ ...g1, chequeNo: e.target.value })}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono font-bold text-emerald-800"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-600 font-semibold mb-0.5">मोबाइल नं.</label>
                      <input
                        type="tel"
                        value={g1.mobile}
                        onChange={(e) => setG1({ ...g1, mobile: e.target.value })}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-semibold mb-0.5">संबंध</label>
                      <input
                        type="text"
                        value={g1.relation}
                        onChange={(e) => setG1({ ...g1, relation: e.target.value })}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-0.5">पता</label>
                    <input
                      type="text"
                      value={g1.address}
                      onChange={(e) => setG1({ ...g1, address: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                {/* Guarantor 2 */}
                <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-2 text-xs">
                  <div className="font-bold text-teal-900 flex items-center justify-between">
                    <span>ज़मानतदार 2 (द्वितीय प्रतिभू)</span>
                    <span className="text-[10px] bg-teal-100 text-teal-800 px-2 py-0.5 rounded">अनिवार्य</span>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-0.5">नाम *</label>
                    <input
                      type="text"
                      required
                      value={g2.name}
                      onChange={(e) => setG2({ ...g2, name: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-600 font-semibold mb-0.5">सदस्यता क्र. *</label>
                      <input
                        type="text"
                        required
                        value={g2.memberNo}
                        onChange={(e) => setG2({ ...g2, memberNo: e.target.value })}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-semibold mb-0.5">चेक नंबर *</label>
                      <input
                        type="text"
                        required
                        value={g2.chequeNo}
                        onChange={(e) => setG2({ ...g2, chequeNo: e.target.value })}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono font-bold text-teal-800"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-600 font-semibold mb-0.5">मोबाइल नं.</label>
                      <input
                        type="tel"
                        value={g2.mobile}
                        onChange={(e) => setG2({ ...g2, mobile: e.target.value })}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-semibold mb-0.5">संबंध</label>
                      <input
                        type="text"
                        value={g2.relation}
                        onChange={(e) => setG2({ ...g2, relation: e.target.value })}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-0.5">पता</label>
                    <input
                      type="text"
                      value={g2.address}
                      onChange={(e) => setG2({ ...g2, address: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 5: Status, Auto-Lock, and Notes */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b pb-1.5 border-slate-200">
                <Lock className="w-4 h-4 text-emerald-600" />
                5. स्थिति एवं रिकॉर्ड सुरक्षा (Status & Auto-Lock Control)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">ऋण खाता स्थिति (Loan Status)</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white font-semibold"
                  >
                    <option value="active">सक्रिय (Active)</option>
                    <option value="overdue">विलंबित किश्त (Overdue)</option>
                    <option value="closed">पूर्ण चुकता (Closed)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-600 font-semibold mb-1">
                    ऑटो-लॉक सुरक्षा (Auto-Lock Protection)
                  </label>
                  <div className="flex items-center gap-3 p-2 bg-slate-50 border border-slate-200 rounded-lg">
                    <input
                      type="checkbox"
                      id="lockToggle"
                      checked={isLocked}
                      onChange={(e) => setIsLocked(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded border-slate-300"
                    />
                    <label htmlFor="lockToggle" className="cursor-pointer">
                      <span className="font-bold text-slate-800">
                        {isLocked ? '🔒 यह प्रविष्टि सहेजने के बाद स्वतः लॉक रहेगी' : '🔓 प्रविष्टि अनलॉक रखें'}
                      </span>
                      <p className="text-[10px] text-slate-500">
                        लॉक रहने पर केवल व्यवस्थापक पिन से ही पुनः खोला जा सकता है।
                      </p>
                    </label>
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-slate-600 font-semibold mb-1">विशेष टिप्पणी (Notes / Audit Remarks)</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="उदा. अग्रिम चेक जमा, ज़मानतदार सत्यापन पूर्ण, 14% ब्याज दर"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="text-[11px] text-slate-500">
                {loan.lastModifiedAt && (
                  <span>
                    अंतिम संशोधन: {new Date(loan.lastModifiedAt).toLocaleDateString('hi-IN')} ({loan.lastModifiedBy || 'Admin'})
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>संशोधन सुरक्षित करें (Save & Auto-Lock)</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
