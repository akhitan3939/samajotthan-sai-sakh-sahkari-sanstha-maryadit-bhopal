import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  User, 
  Calendar, 
  CreditCard, 
  ShieldCheck, 
  Users, 
  CheckCircle2, 
  Sparkles,
  Calculator,
  ArrowRight
} from 'lucide-react';
import { LoanRecord, LoanScheme, CalculationMethod } from '../types';
import { 
  calculateEmi, 
  generateEmiSchedule, 
  calculateNetDisbursedCheque,
  getPreEmiForAmount,
  formatCurrency, 
  numberToHindiWords,
  DEFAULT_SCHEMES, 
  DEFAULT_PENALTY_SETTINGS 
} from '../utils/calculations';

interface AddLoanViewProps {
  onSaveLoan: (loan: LoanRecord) => void;
  onCancel: () => void;
  initialScheme?: LoanScheme | null;
  initialCalculation?: {
    sanctionedAmount: number;
    tenureMonths: number;
    interestRate: number;
    calculationMethod: CalculationMethod;
    preEmiDeduction: number;
    processingFee: number;
    buildingFund: number;
    shareCapitalDeduction: number;
    netDisbursedAmount: number;
  } | null;
}

export const AddLoanView: React.FC<AddLoanViewProps> = ({ 
  onSaveLoan, 
  onCancel, 
  initialScheme,
  initialCalculation 
}) => {
  const [borrowerName, setBorrowerName] = useState('');
  const [memberNo, setMemberNo] = useState(`M-${Math.floor(1000 + Math.random() * 9000)}`);
  const [fatherSpouseName, setFatherSpouseName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [aadharNoMasked, setAadharNoMasked] = useState('');

  // Loan specs
  const [loanDate, setLoanDate] = useState(new Date().toISOString().split('T')[0]);
  const [advanceChequeNo, setAdvanceChequeNo] = useState('');
  const [appliedAmount, setAppliedAmount] = useState<number>(
    initialCalculation?.sanctionedAmount || (initialScheme ? initialScheme.amount : 100000)
  );
  const [sanctionedAmount, setSanctionedAmount] = useState<number>(
    initialCalculation?.sanctionedAmount || (initialScheme ? initialScheme.amount : 100000)
  );
  const [interestRate, setInterestRate] = useState<number>(
    initialCalculation?.interestRate || (initialScheme ? initialScheme.interestRate : 14)
  );
  const [tenureMonths, setTenureMonths] = useState<number>(
    initialCalculation?.tenureMonths || (initialScheme ? initialScheme.tenureMonths : 24)
  );
  const [calculationMethod, setCalculationMethod] = useState<CalculationMethod>(
    initialCalculation?.calculationMethod || 'reducing_installment'
  );

  // Cooperative Disbursal Deductions as requested:
  // e.g. 100000 - 5000 Pre-EMI - 500 Processing Fee - 300 Building Fund = 94200 Cheque given to customer!
  const [preEmiDeduction, setPreEmiDeduction] = useState<number>(
    initialCalculation?.preEmiDeduction !== undefined ? initialCalculation.preEmiDeduction : 5000
  );
  const [processingFee, setProcessingFee] = useState<number>(
    initialCalculation?.processingFee !== undefined ? initialCalculation.processingFee : 500
  );
  const [buildingFund, setBuildingFund] = useState<number>(
    initialCalculation?.buildingFund !== undefined ? initialCalculation.buildingFund : 300
  );
  const [shareCapitalDeduction, setShareCapitalDeduction] = useState<number>(
    initialCalculation?.shareCapitalDeduction !== undefined ? initialCalculation.shareCapitalDeduction : 0
  );
  const [disbursedChequeNo, setDisbursedChequeNo] = useState<string>('');

  // Bank transfer info ("kab uske account me transfer hua")
  const [bankName, setBankName] = useState('भारतीय स्टेट बैंक (SBI), भोपाल');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('SBIN0001042');
  const [disbursementDate, setDisbursementDate] = useState(new Date().toISOString().split('T')[0]);
  const [utrTransferRef, setUtrTransferRef] = useState('');

  // 02 Guarantors (02 लोग रहेंगे)
  const [g1Name, setG1Name] = useState('');
  const [g1MemberNo, setG1MemberNo] = useState('');
  const [g1ChequeNo, setG1ChequeNo] = useState('');
  const [g1Mobile, setG1Mobile] = useState('');
  const [g1Address, setG1Address] = useState('');
  const [g1Relation, setG1Relation] = useState('सहकारी सदस्य');

  const [g2Name, setG2Name] = useState('');
  const [g2MemberNo, setG2MemberNo] = useState('');
  const [g2ChequeNo, setG2ChequeNo] = useState('');
  const [g2Mobile, setG2Mobile] = useState('');
  const [g2Address, setG2Address] = useState('');
  const [g2Relation, setG2Relation] = useState('सहकारी सदस्य');

  const [notes, setNotes] = useState('');

  // Live Auto EMI / First Installment Calculation
  const autoEmi = calculateEmi(sanctionedAmount, interestRate, tenureMonths, calculationMethod);

  // Net Cheque Disbursed calculation
  const disbursalBreakdown = calculateNetDisbursedCheque(
    sanctionedAmount,
    preEmiDeduction,
    processingFee,
    buildingFund,
    shareCapitalDeduction
  );

  // Handle slab selection
  const selectSlab = (scheme: LoanScheme) => {
    setAppliedAmount(scheme.amount);
    setSanctionedAmount(scheme.amount);
    setInterestRate(scheme.interestRate);
    setTenureMonths(scheme.tenureMonths);
    setPreEmiDeduction(getPreEmiForAmount(scheme.amount));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!borrowerName.trim()) {
      alert('कृपया ऋणी का नाम दर्ज करें!');
      return;
    }

    if (!g1Name.trim() || !g2Name.trim()) {
      alert('संस्था के नियमानुसार 02 ज़मानतदारों का नाम एवं विवरण अनिवार्य है!');
      return;
    }

    const loanAccountNo = `SSSSM/LN/${new Date().getFullYear()}/${Math.floor(100 + Math.random() * 900)}`;

    const emiSchedule = generateEmiSchedule(
      sanctionedAmount,
      interestRate,
      tenureMonths,
      calculationMethod,
      loanDate,
      DEFAULT_PENALTY_SETTINGS,
      new Date().toISOString().split('T')[0],
      preEmiDeduction > 0,
      preEmiDeduction
    );

    const newLoan: LoanRecord = {
      id: `loan-${Date.now()}`,
      loanAccountNo,
      borrowerName: borrowerName.trim(),
      memberNo: memberNo.trim(),
      fatherSpouseName: fatherSpouseName.trim(),
      mobile: mobile.trim(),
      email: email.trim(),
      address: address.trim(),
      aadharNoMasked: aadharNoMasked.trim(),
      bankName: bankName.trim(),
      accountNumber: accountNumber.trim(),
      ifscCode: ifscCode.trim(),
      loanDate,
      disbursementDate,
      utrTransferRef: utrTransferRef.trim() || `UTR-${Date.now().toString().slice(-8)}`,
      advanceChequeNo: advanceChequeNo.trim(),
      appliedAmount: Number(appliedAmount),
      sanctionedAmount: Number(sanctionedAmount),
      interestRate: Number(interestRate),
      tenureMonths: Number(tenureMonths),
      calculationMethod,
      monthlyEmi: autoEmi,
      preEmiDeduction: Number(preEmiDeduction),
      processingFee: Number(processingFee),
      buildingFund: Number(buildingFund),
      shareCapitalDeduction: Number(shareCapitalDeduction),
      netDisbursedAmount: disbursalBreakdown.netChequeAmount,
      disbursedChequeNo: disbursedChequeNo.trim() || `CHQ-${Math.floor(100000 + Math.random() * 900000)}`,
      guarantor1: {
        name: g1Name.trim(),
        memberNo: g1MemberNo.trim(),
        chequeNo: g1ChequeNo.trim(),
        mobile: g1Mobile.trim(),
        address: g1Address.trim(),
        relation: g1Relation.trim(),
      },
      guarantor2: {
        name: g2Name.trim(),
        memberNo: g2MemberNo.trim(),
        chequeNo: g2ChequeNo.trim(),
        mobile: g2Mobile.trim(),
        address: g2Address.trim(),
        relation: g2Relation.trim(),
      },
      emiSchedule,
      status: 'active',
      mandatoryAmanatRashi: 100,
      amanatStatus: 'deposited',
      totalPaidPrincipal: preEmiDeduction > 0 ? (emiSchedule[0]?.principal || 0) : 0,
      totalPaidInterest: preEmiDeduction > 0 ? (emiSchedule[0]?.interest || 0) : 0,
      totalPaidPenalty: 0,
      outstandingBalance: Math.max(0, Number(sanctionedAmount) - (preEmiDeduction > 0 ? (emiSchedule[0]?.principal || 0) : 0)),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: notes.trim(),
    };

    onSaveLoan(newLoan);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Title Header with Formula Card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 px-2.5 py-1 rounded-md">
            सहकारी साख ऋण आवंटन प्रपत्र
          </span>
          <h2 className="text-xl font-bold text-slate-900 mt-2">
            नया ऋण आवेदन, प्री-ईएमआई एवं 02 ज़मानतदार प्रविष्टि
          </h2>
          <p className="text-xs text-slate-500">
            समोत्थान सांई साख सहकारी संस्था मर्यादित, भोपाल • किश्त घटते क्रम में एवं चेक कटौती सूत्र
          </p>
        </div>

        {/* Live Net Cheque Given Banner */}
        <div className="bg-gradient-to-br from-emerald-950 via-teal-950 to-slate-900 text-white p-4 rounded-xl shadow-lg min-w-[240px] text-right border border-emerald-800">
          <div className="text-[11px] text-amber-300 font-semibold uppercase tracking-wider">
            ग्राहक को देय शुद्ध चेक राशि
          </div>
          <div className="text-2xl md:text-3xl font-extrabold font-mono text-amber-400 mt-0.5">
            {formatCurrency(disbursalBreakdown.netChequeAmount)}
          </div>
          <div className="text-[10px] text-emerald-200/80 mt-1">
            ₹{sanctionedAmount.toLocaleString('en-IN')} - ₹{preEmiDeduction} प्री-ईएमआई - ₹{processingFee} फीस - ₹{buildingFund} भवन कोष
          </div>
        </div>
      </div>

      {/* Preset Loan Slabs Fast Picker */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
        <div className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-500" />
          मानक ऋण स्लैब से त्वरित चयन करें:
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {DEFAULT_SCHEMES.map((sch) => {
            const isSelected = sch.amount === sanctionedAmount && sch.tenureMonths === tenureMonths;
            return (
              <button
                type="button"
                key={sch.id}
                onClick={() => selectSlab(sch)}
                className={`p-2.5 rounded-xl border text-center transition ${
                  isSelected
                    ? 'border-emerald-600 bg-emerald-600 text-white font-bold shadow-xs'
                    : 'border-slate-200 bg-white text-slate-800 hover:border-emerald-300'
                }`}
              >
                <div className="text-xs font-mono font-bold">{formatCurrency(sch.amount)}</div>
                <div className={`text-[10px] ${isSelected ? 'text-emerald-100' : 'text-slate-500'}`}>
                  {sch.tenureMonths} माह @ 14%
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: ऋणी का विवरण */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
            <User className="w-4 h-4 text-emerald-600" />
            1. ऋणी (सदस्य) का व्यक्तिगत एवं संपर्क विवरण
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                ऋणी का पूरा नाम <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={borrowerName}
                onChange={(e) => setBorrowerName(e.target.value)}
                placeholder="जैसे: राजेश कुमार शर्मा"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                सदस्यता क्रमांक (Member No.) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={memberNo}
                onChange={(e) => setMemberNo(e.target.value)}
                placeholder="जैसे: M-1042"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono font-semibold focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">पिता / पति का नाम</label>
              <input
                type="text"
                value={fatherSpouseName}
                onChange={(e) => setFatherSpouseName(e.target.value)}
                placeholder="जैसे: श्री रामेश्वर दयाल शर्मा"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">मोबाइल नंबर</label>
              <input
                type="tel"
                maxLength={10}
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="जैसे: 9826012345"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">ईमेल पता (अलर्ट/नोटिस हेतु)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="जैसे: rajesh.sharma.bpl@gmail.com"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">आधार नंबर / पहचान पत्र</label>
              <input
                type="text"
                value={aadharNoMasked}
                onChange={(e) => setAadharNoMasked(e.target.value)}
                placeholder="जैसे: 8492-3847-1920"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block font-semibold text-slate-700 mb-1">स्थायी पता (भोपाल/म.प्र.)</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="जैसे: मकान नं. 45, वार्ड 22, कोलार रोड, भोपाल (म.प्र.)"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Section 2: ऋण राशि, घटते क्रम किश्त एवं चेक कटौतियां */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
            <Calculator className="w-4 h-4 text-emerald-600" />
            2. ऋण स्वीकृति, घटते क्रम किश्त एवं अग्रिम चेक कटौतियां
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                ऋण आवेदन तिथि (Loan Date) <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={loanDate}
                onChange={(e) => setLoanDate(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                ऋणी अग्रिम सुरक्षा चेक नंबर <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={advanceChequeNo}
                onChange={(e) => setAdvanceChequeNo(e.target.value)}
                placeholder="जैसे: 482019"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono font-semibold focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                आवेदन राशि (Applied Amount ₹) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                value={appliedAmount}
                onChange={(e) => setAppliedAmount(Number(e.target.value))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono font-bold focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                स्वीकृत राशि (Sanctioned ₹) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                value={sanctionedAmount}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setSanctionedAmount(val);
                  setPreEmiDeduction(getPreEmiForAmount(val));
                }}
                className="w-full border border-emerald-400 bg-emerald-50/50 rounded-lg px-3 py-2 text-emerald-900 font-mono font-bold focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">वार्षिक ब्याज दर (% p.a.)</label>
              <input
                type="number"
                step="0.1"
                value={interestRate}
                onChange={(e) => setInterestRate(Number(e.target.value))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono font-semibold focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">अवधि (माह)</label>
              <select
                value={tenureMonths}
                onChange={(e) => setTenureMonths(Number(e.target.value))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:border-emerald-500"
              >
                <option value={12}>12 माह (1 वर्ष)</option>
                <option value={20}>20 माह</option>
                <option value={24}>24 माह (2 वर्ष - मानक)</option>
                <option value={36}>36 माह (3 वर्ष - मानक)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">किश्त प्रणाली</label>
              <select
                value={calculationMethod}
                onChange={(e) => setCalculationMethod(e.target.value as CalculationMethod)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-emerald-500"
              >
                <option value="reducing_installment">📉 किश्त घटते क्रम में होगी (मानक)</option>
                <option value="reducing_balance">⚖️ समान किश्त (Reducing EMI)</option>
                <option value="flat">📊 समतल ब्याज (Flat Rate)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">प्रथम माह किश्त</label>
              <div className="w-full border border-slate-300 bg-slate-100 rounded-lg px-3 py-2 text-emerald-700 font-mono font-bold text-sm">
                {formatCurrency(autoEmi)}
              </div>
            </div>
          </div>

          {/* Deductions breakdown as specified by user */}
          <div className="mt-4 p-4 bg-emerald-950 text-white rounded-xl space-y-3 text-xs">
            <div className="font-bold text-amber-300 flex items-center justify-between border-b border-emerald-800 pb-2">
              <span>ऋण स्वीकृति चेक कटौतियां (Disbursal Cheque Deductions):</span>
              <span className="font-mono text-emerald-200">
                स्वीकृत: {formatCurrency(sanctionedAmount)}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <span className="text-emerald-200">(-) अग्रिम प्री-ईएमआई (Pre-EMI):</span>
                <input
                  type="number"
                  value={preEmiDeduction}
                  onChange={(e) => setPreEmiDeduction(Number(e.target.value))}
                  className="mt-1 w-full border border-emerald-700 rounded px-2.5 py-1.5 bg-emerald-900/80 font-mono text-amber-300 font-bold"
                />
              </div>

              <div>
                <span className="text-emerald-200">(-) प्रोसेसिंग फीस (₹):</span>
                <input
                  type="number"
                  value={processingFee}
                  onChange={(e) => setProcessingFee(Number(e.target.value))}
                  className="mt-1 w-full border border-emerald-700 rounded px-2.5 py-1.5 bg-emerald-900/80 font-mono text-amber-300 font-bold"
                />
              </div>

              <div>
                <span className="text-emerald-200">(-) भवन निर्माण कोष (₹):</span>
                <input
                  type="number"
                  value={buildingFund}
                  onChange={(e) => setBuildingFund(Number(e.target.value))}
                  className="mt-1 w-full border border-emerald-700 rounded px-2.5 py-1.5 bg-emerald-900/80 font-mono text-amber-300 font-bold"
                />
              </div>

              <div>
                <span className="text-emerald-200 font-semibold">(=) ग्राहक को देय चेक राशि:</span>
                <div className="mt-1 font-mono font-extrabold text-amber-400 text-base bg-emerald-900/90 px-2.5 py-1 rounded border border-amber-400/40">
                  {formatCurrency(disbursalBreakdown.netChequeAmount)}
                </div>
              </div>
            </div>

            <div className="text-[11px] text-emerald-200/90 italic">
              उदाहरण: ₹{sanctionedAmount.toLocaleString('en-IN')} राशि में से ₹{preEmiDeduction} अग्रिम प्री-ईएमआई, ₹{processingFee} प्रोसेसिंग फीस एवं ₹{buildingFund} भवन निर्माण कोष = <strong>{formatCurrency(disbursalBreakdown.netChequeAmount)}</strong> का चेक ग्राहक को दिया गया।
            </div>
          </div>
        </div>

        {/* Section 3: बैंक अंतरण एवं ग्राहक को दिए गए चेक का विवरण */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
            <CreditCard className="w-4 h-4 text-emerald-600" />
            3. बैंक खाता एवं चेक अंतरण विवरण (Disbursement Details)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                ग्राहक को दिए गए चेक का नंबर (Disbursed Cheque No.) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={disbursedChequeNo}
                onChange={(e) => setDisbursedChequeNo(e.target.value)}
                placeholder="जैसे: CHQ-890214"
                className="w-full border border-emerald-400 bg-emerald-50/30 rounded-lg px-3 py-2 text-slate-900 font-mono font-bold focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                खाते में अंतरण की तिथि (Disbursement Date) <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={disbursementDate}
                onChange={(e) => setDisbursementDate(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">बैंक का नाम</label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="जैसे: स्टेट बैंक ऑफ इंडिया (SBI), भोपाल"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">खाता क्रमांक (Account No.)</label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="जैसे: 30491029384"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">IFSC कोड</label>
              <input
                type="text"
                value={ifscCode}
                onChange={(e) => setIfscCode(e.target.value)}
                placeholder="जैसे: SBIN0001042"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">UTR / ट्रांसफर संदर्भ क्रमांक</label>
              <input
                type="text"
                value={utrTransferRef}
                onChange={(e) => setUtrTransferRef(e.target.value)}
                placeholder="जैसे: SBIN7261948201"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Section 4: 02 ज़मानतदार विवरण */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" />
              4. दो ज़मानतदारों का विवरण (02 ज़मानतदार अनिवार्य)
            </h3>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
              चेक एवं सदस्यता क्रमांक सहित
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ज़मानतदार 01 */}
            <div className="border border-emerald-200 bg-emerald-50/20 rounded-xl p-4 space-y-3 text-xs">
              <div className="font-bold text-emerald-900 flex items-center gap-2 border-b border-emerald-200 pb-1.5">
                <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[10px]">
                  1
                </span>
                प्रथम ज़मानतदार (Guarantor 01)
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  ज़मानतदार का नाम <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={g1Name}
                  onChange={(e) => setG1Name(e.target.value)}
                  placeholder="जैसे: महेश चंद्र वर्मा"
                  className="w-full border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">सदस्यता क्रमांक</label>
                  <input
                    type="text"
                    value={g1MemberNo}
                    onChange={(e) => setG1MemberNo(e.target.value)}
                    placeholder="जैसे: M-0814"
                    className="w-full border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-slate-900 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    ज़मानतदार चेक नंबर <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={g1ChequeNo}
                    onChange={(e) => setG1ChequeNo(e.target.value)}
                    placeholder="जैसे: 729103"
                    className="w-full border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-slate-900 font-mono font-semibold focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">मोबाइल नंबर</label>
                  <input
                    type="tel"
                    maxLength={10}
                    value={g1Mobile}
                    onChange={(e) => setG1Mobile(e.target.value)}
                    placeholder="जैसे: 9425098765"
                    className="w-full border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-slate-900 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">संबंध / व्यवसाय</label>
                  <input
                    type="text"
                    value={g1Relation}
                    onChange={(e) => setG1Relation(e.target.value)}
                    placeholder="जैसे: सहकारी सदस्य / दुकानदार"
                    className="w-full border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">स्थायी पता (भोपाल)</label>
                <input
                  type="text"
                  value={g1Address}
                  onChange={(e) => setG1Address(e.target.value)}
                  placeholder="जैसे: प्लाट 12, न्यू मार्केट, भोपाल"
                  className="w-full border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* ज़मानतदार 02 */}
            <div className="border border-emerald-200 bg-emerald-50/20 rounded-xl p-4 space-y-3 text-xs">
              <div className="font-bold text-emerald-900 flex items-center gap-2 border-b border-emerald-200 pb-1.5">
                <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[10px]">
                  2
                </span>
                द्वितीय ज़मानतदार (Guarantor 02)
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  ज़मानतदार का नाम <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={g2Name}
                  onChange={(e) => setG2Name(e.target.value)}
                  placeholder="जैसे: दिनेश कुमार साहू"
                  className="w-full border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">सदस्यता क्रमांक</label>
                  <input
                    type="text"
                    value={g2MemberNo}
                    onChange={(e) => setG2MemberNo(e.target.value)}
                    placeholder="जैसे: M-0952"
                    className="w-full border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-slate-900 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    ज़मानतदार चेक नंबर <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={g2ChequeNo}
                    onChange={(e) => setG2ChequeNo(e.target.value)}
                    placeholder="जैसे: 109284"
                    className="w-full border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-slate-900 font-mono font-semibold focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">मोबाइल नंबर</label>
                  <input
                    type="tel"
                    maxLength={10}
                    value={g2Mobile}
                    onChange={(e) => setG2Mobile(e.target.value)}
                    placeholder="जैसे: 9893123490"
                    className="w-full border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-slate-900 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">संबंध / व्यवसाय</label>
                  <input
                    type="text"
                    value={g2Relation}
                    onChange={(e) => setG2Relation(e.target.value)}
                    placeholder="जैसे: सहकारी सदस्य / शासकीय कर्मचारी"
                    className="w-full border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">स्थायी पता (भोपाल)</label>
                <input
                  type="text"
                  value={g2Address}
                  onChange={(e) => setG2Address(e.target.value)}
                  placeholder="जैसे: म.नं. 104, शिवाजी नगर, भोपाल"
                  className="w-full border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold"
          >
            रद्द करें
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-800 hover:from-emerald-800 hover:to-teal-900 text-white text-xs font-bold shadow-lg shadow-emerald-700/20 flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-amber-300" />
            <span>ऋण खाता स्वीकृत करें एवं चेक विवरण सुरक्षित करें</span>
          </button>
        </div>
      </form>
    </div>
  );
};
