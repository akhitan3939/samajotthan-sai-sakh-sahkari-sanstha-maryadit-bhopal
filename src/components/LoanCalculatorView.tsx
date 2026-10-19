import React, { useState } from 'react';
import { 
  Calculator, 
  ArrowRight, 
  Printer, 
  Sparkles, 
  CheckCircle2, 
  Building2, 
  DollarSign, 
  TrendingDown, 
  Receipt,
  FileCheck2,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { CalculationMethod } from '../types';
import { 
  calculateEmi, 
  calculateNetDisbursedCheque, 
  getPreEmiForAmount,
  formatCurrency, 
  numberToHindiWords, 
  DEFAULT_SCHEMES,
  addMonths
} from '../utils/calculations';

interface LoanCalculatorViewProps {
  onApplyCalculation: (data: {
    sanctionedAmount: number;
    tenureMonths: number;
    interestRate: number;
    calculationMethod: CalculationMethod;
    preEmiDeduction: number;
    processingFee: number;
    buildingFund: number;
    shareCapitalDeduction: number;
    netDisbursedAmount: number;
  }) => void;
}

export const LoanCalculatorView: React.FC<LoanCalculatorViewProps> = ({ onApplyCalculation }) => {
  // Input parameters
  const [sanctionedAmount, setSanctionedAmount] = useState<number>(100000);
  const [interestRate, setInterestRate] = useState<number>(14);
  const [tenureMonths, setTenureMonths] = useState<number>(24);
  const [calculationMethod, setCalculationMethod] = useState<CalculationMethod>('reducing_installment');
  
  // Disbursal Deductions as specified:
  // e.g. for ₹1,00,000 -> Pre-EMI ₹5,000, Processing Fee ₹500, Building Fund ₹300 = ₹94,200 Cheque!
  const [preEmiDeduction, setPreEmiDeduction] = useState<number>(5000);
  const [processingFee, setProcessingFee] = useState<number>(500);
  const [buildingFund, setBuildingFund] = useState<number>(300);
  const [shareCapitalDeduction, setShareCapitalDeduction] = useState<number>(0);
  
  const [showPrintVoucher, setShowPrintVoucher] = useState<boolean>(false);

  // Net Cheque Disbursed calculation
  const disbursalBreakdown = calculateNetDisbursedCheque(
    sanctionedAmount,
    preEmiDeduction,
    processingFee,
    buildingFund,
    shareCapitalDeduction
  );

  // Generate month-by-month table data
  const monthlyRate = interestRate / 12 / 100;
  const baseMonthlyPrincipal = Math.floor(sanctionedAmount / tenureMonths);
  const principalRemainder = sanctionedAmount - (baseMonthlyPrincipal * tenureMonths);

  let tempRemaining = sanctionedAmount;
  const scheduleRows = [];
  let totalInterestSum = 0;

  for (let i = 1; i <= tenureMonths; i++) {
    let principalPart = 0;
    let interestPart = 0;
    let installmentTotal = 0;
    const openingBalance = tempRemaining;

    if (calculationMethod === 'flat') {
      interestPart = Math.round((sanctionedAmount * (interestRate / 100) * (tenureMonths / 12)) / tenureMonths);
      principalPart = Math.round(sanctionedAmount / tenureMonths);
      installmentTotal = principalPart + interestPart;
      tempRemaining = Math.max(0, tempRemaining - principalPart);
    } else if (calculationMethod === 'reducing_balance') {
      const emi = calculateEmi(sanctionedAmount, interestRate, tenureMonths, 'reducing_balance');
      interestPart = Math.round(tempRemaining * monthlyRate);
      principalPart = emi - interestPart;
      if (i === tenureMonths || tempRemaining - principalPart < 0) {
        principalPart = tempRemaining;
      }
      installmentTotal = principalPart + interestPart;
      tempRemaining = Math.max(0, tempRemaining - principalPart);
    } else {
      // 'reducing_installment' (घटते क्रम में किश्त)
      interestPart = Math.round(tempRemaining * monthlyRate);
      principalPart = baseMonthlyPrincipal + (i === 1 ? principalRemainder : 0);
      if (i === tenureMonths || tempRemaining - principalPart < 0) {
        principalPart = tempRemaining;
      }
      installmentTotal = principalPart + interestPart;
      tempRemaining = Math.max(0, tempRemaining - principalPart);
    }

    totalInterestSum += interestPart;

    scheduleRows.push({
      month: i,
      openingBalance,
      principalPart,
      interestPart,
      installmentTotal,
      closingBalance: tempRemaining,
      isPreEmiMonth: i === 1 && preEmiDeduction > 0,
    });
  }

  // Pre-configured slabs quick selection
  const handleSelectSlab = (amount: number, months: number) => {
    setSanctionedAmount(amount);
    setTenureMonths(months);
    setPreEmiDeduction(getPreEmiForAmount(amount));
  };

  const handleApplyToForm = () => {
    onApplyCalculation({
      sanctionedAmount,
      tenureMonths,
      interestRate,
      calculationMethod,
      preEmiDeduction,
      processingFee,
      buildingFund,
      shareCapitalDeduction,
      netDisbursedAmount: disbursalBreakdown.netChequeAmount,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider bg-emerald-50 px-2.5 py-0.5 rounded">
            ऋण गणना एवं चेक वितरण विवरणी
          </span>
          <h2 className="text-xl font-bold text-slate-900 mt-1 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-emerald-600" />
            घटते क्रम किश्त (Reducing Schedule) एवं प्री-ईएमआई चेक कैलकुलेटर
          </h2>
          <p className="text-xs text-slate-500">
            समोत्थान सांई साख सहकारी संस्था मर्यादित, भोपाल • अग्रिम 1 किश्त, ₹500 प्रोसेसिंग फीस व ₹300 भवन निर्माण कोष कटौती
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPrintVoucher(true)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
          >
            <Printer className="w-4 h-4 text-emerald-300" />
            <span>चेक वितरण वाउचर प्रिंट करें</span>
          </button>
        </div>
      </div>

      {/* Quick Slab Buttons */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
        <div className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-500" />
          संस्था के मानक ऋण स्लैब से त्वरित चयन:
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {[
            { amount: 50000, months: 24 },
            { amount: 100000, months: 24, recommended: true },
            { amount: 150000, months: 24 },
            { amount: 200000, months: 24 },
            { amount: 350000, months: 36 },
            { amount: 400000, months: 36 },
          ].map((slab) => {
            const isSelected = slab.amount === sanctionedAmount && slab.months === tenureMonths;
            return (
              <button
                type="button"
                key={slab.amount}
                onClick={() => handleSelectSlab(slab.amount, slab.months)}
                className={`p-2.5 rounded-xl border text-center transition ${
                  isSelected
                    ? 'border-emerald-600 bg-emerald-600 text-white font-bold shadow-xs'
                    : 'border-slate-200 bg-white text-slate-800 hover:border-emerald-300'
                }`}
              >
                <div className="text-xs font-mono font-bold">{formatCurrency(slab.amount)}</div>
                <div className={`text-[10px] ${isSelected ? 'text-emerald-100' : 'text-slate-500'}`}>
                  {slab.months} माह @ 14%
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Top 2 Columns: Parameters & Disbursal Cheque Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Loan Settings & Deductions */}
        <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center justify-between">
            <span>1. ऋण पैरामीटर्स एवं कटौती विन्यास</span>
            <span className="text-[11px] font-mono text-emerald-800">14% p.a.</span>
          </h3>

          <div className="space-y-3.5 text-xs">
            {/* Sanctioned Amount */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                स्वीकृत ऋण राशि (Sanctioned Amount ₹):
              </label>
              <input
                type="number"
                step={5000}
                value={sanctionedAmount}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setSanctionedAmount(val);
                  setPreEmiDeduction(getPreEmiForAmount(val));
                }}
                className="w-full border border-emerald-400 bg-emerald-50/40 rounded-lg px-3 py-2 font-mono font-bold text-slate-900 text-sm focus:outline-none focus:border-emerald-600"
              />
            </div>

            {/* Tenure & Rate */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">अवधि (माह):</label>
                <select
                  value={tenureMonths}
                  onChange={(e) => setTenureMonths(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 font-semibold text-slate-900 focus:outline-none focus:border-emerald-500"
                >
                  <option value={12}>12 माह (1 वर्ष)</option>
                  <option value={20}>20 माह (विशेष)</option>
                  <option value={24}>24 माह (2 वर्ष - मानक)</option>
                  <option value={36}>36 माह (3 वर्ष - मानक)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">वार्षिक ब्याज दर (%):</label>
                <input
                  type="number"
                  step="0.5"
                  value={interestRate}
                  onChange={(e) => setInterestRate(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono font-semibold text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Calculation Method Selection */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                किश्त गणना प्रणाली (Calculation Type):
              </label>
              <select
                value={calculationMethod}
                onChange={(e) => setCalculationMethod(e.target.value as CalculationMethod)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 font-bold text-emerald-900 bg-emerald-50/30 focus:outline-none focus:border-emerald-500"
              >
                <option value="reducing_installment">
                  📉 किश्त घटते क्रम में होगी (समान मूलधन + घटता ब्याज - मानक)
                </option>
                <option value="reducing_balance">
                  ⚖️ समान मासिक किश्त (Standard Reducing EMI)
                </option>
                <option value="flat">
                  📊 समतल ब्याज दर (Flat Rate)
                </option>
              </select>
            </div>

            {/* Advance Deductions Group */}
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <div className="font-bold text-slate-800 flex items-center justify-between">
                <span>स्वीकृति पर अनिवार्य कटौतियां (Deductions):</span>
                <span className="text-[10px] text-slate-500">चेक से देय पूर्व कटौती</span>
              </div>

              {/* Pre-EMI */}
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">
                    अग्रिम प्री-ईएमआई (Pre-EMI) कटौती:
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setPreEmiDeduction(5000)}
                      className="px-1.5 py-0.5 text-[10px] bg-slate-200 hover:bg-slate-300 rounded font-mono"
                    >
                      ₹5,000
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreEmiDeduction(Math.round(sanctionedAmount / tenureMonths))}
                      className="px-1.5 py-0.5 text-[10px] bg-slate-200 hover:bg-slate-300 rounded font-mono"
                    >
                      1 किश्त
                    </button>
                  </div>
                </div>
                <input
                  type="number"
                  value={preEmiDeduction}
                  onChange={(e) => setPreEmiDeduction(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 font-mono font-bold text-slate-900 bg-white"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  * अग्रिम 1 किश्त काटकर चेक दिया जाएगा एवं किश्त #1 चुकता मानी जाएगी।
                </p>
              </div>

              {/* Processing Fee ₹500 & Building Fund ₹300 */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <label className="block font-semibold text-slate-700 mb-1">
                    प्रोसेसिंग फीस (₹):
                  </label>
                  <input
                    type="number"
                    value={processingFee}
                    onChange={(e) => setProcessingFee(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 font-mono font-bold text-slate-900 bg-white"
                  />
                  <span className="text-[10px] text-slate-500">मानक: ₹500</span>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <label className="block font-semibold text-slate-700 mb-1">
                    भवन निर्माण कोष (₹):
                  </label>
                  <input
                    type="number"
                    value={buildingFund}
                    onChange={(e) => setBuildingFund(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 font-mono font-bold text-slate-900 bg-white"
                  />
                  <span className="text-[10px] text-slate-500">मानक: ₹300</span>
                </div>
              </div>

              {/* Share Capital Optional */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  अंश पूंजी / अन्य कटौती (वैकल्पिक ₹):
                </label>
                <input
                  type="number"
                  value={shareCapitalDeduction}
                  onChange={(e) => setShareCapitalDeduction(Number(e.target.value))}
                  placeholder="0"
                  className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono text-slate-900"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Exact Disbursal Cheque Card (e.g. ₹94,200) & Actions */}
        <div className="lg:col-span-7 space-y-4">
          {/* Official Disbursal Cheque Voucher Card */}
          <div className="bg-gradient-to-br from-emerald-950 via-teal-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-emerald-800/80 space-y-5">
            <div className="flex items-center justify-between border-b border-emerald-800/70 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-400 text-emerald-950 flex items-center justify-center font-bold">
                  ₹
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">समोत्थान सांई साख - चेक वितरण विवरणी</h4>
                  <p className="text-[11px] text-emerald-200/80">कटौती पश्चात वास्तविक देय चेक राशि</p>
                </div>
              </div>
              <span className="text-xs bg-emerald-800/80 text-emerald-100 font-mono px-2.5 py-0.5 rounded">
                सूत्र सत्यापित
              </span>
            </div>

            {/* Mathematical Breakdown Line by Line */}
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between items-center text-slate-200">
                <span>स्वीकृत कुल ऋण राशि (Sanctioned Loan):</span>
                <span className="font-bold text-sm text-white">{formatCurrency(sanctionedAmount)}</span>
              </div>
              <div className="flex justify-between items-center text-rose-300">
                <span>(-) अग्रिम प्री-ईएमआई कटौती (Pre-EMI):</span>
                <span className="font-bold">- {formatCurrency(preEmiDeduction)}</span>
              </div>
              <div className="flex justify-between items-center text-rose-300">
                <span>(-) प्रोसेसिंग फीस (Processing Fee):</span>
                <span className="font-bold">- {formatCurrency(processingFee)}</span>
              </div>
              <div className="flex justify-between items-center text-rose-300">
                <span>(-) भवन निर्माण कोष (Building Fund):</span>
                <span className="font-bold">- {formatCurrency(buildingFund)}</span>
              </div>
              {shareCapitalDeduction > 0 && (
                <div className="flex justify-between items-center text-rose-300">
                  <span>(-) अंश पूंजी कटौती (Share Capital):</span>
                  <span className="font-bold">- {formatCurrency(shareCapitalDeduction)}</span>
                </div>
              )}
            </div>

            {/* Total Cheque Given Box */}
            <div className="pt-4 border-t-2 border-dashed border-emerald-700/80 bg-emerald-900/40 p-4 rounded-xl">
              <div className="text-xs text-amber-300 uppercase tracking-wider font-semibold">
                ग्राहक को दिए जाने वाले चेक की शुद्ध राशि (Net Cheque Given):
              </div>
              <div className="text-3xl md:text-4xl font-extrabold font-mono text-amber-400 mt-1">
                {formatCurrency(disbursalBreakdown.netChequeAmount)}
              </div>
              <div className="text-xs text-emerald-100 mt-1.5 italic font-sans">
                शब्दों में: <strong>{numberToHindiWords(disbursalBreakdown.netChequeAmount)}</strong>
              </div>
            </div>

            {/* Summary details */}
            <div className="grid grid-cols-2 gap-3 text-xs pt-2">
              <div className="bg-emerald-900/50 p-2.5 rounded-lg border border-emerald-800">
                <div className="text-emerald-300 text-[11px]">प्रथम माह किश्त (Month 1):</div>
                <div className="text-sm font-bold font-mono text-white">
                  {formatCurrency(scheduleRows[0]?.installmentTotal || 0)}
                </div>
                <div className="text-[10px] text-emerald-300/80 mt-0.5">
                  (प्री-ईएमआई द्वारा अग्रिम समायोजित)
                </div>
              </div>
              <div className="bg-emerald-900/50 p-2.5 rounded-lg border border-emerald-800">
                <div className="text-emerald-300 text-[11px]">अंतिम माह किश्त (Month {tenureMonths}):</div>
                <div className="text-sm font-bold font-mono text-emerald-300">
                  {formatCurrency(scheduleRows[scheduleRows.length - 1]?.installmentTotal || 0)}
                </div>
                <div className="text-[10px] text-emerald-300/80 mt-0.5">
                  (घटते क्रम में न्यूनतम किश्त)
                </div>
              </div>
            </div>

            {/* 1-Click Action to Apply into AddLoan form */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={handleApplyToForm}
                className="flex-1 py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-emerald-950 font-bold rounded-xl text-xs shadow-lg transition flex items-center justify-center gap-2"
              >
                <span>इस गणना से नया ऋण आवेदन भरें</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Month-by-Month Decreasing Installment Schedule (घटते क्रम किश्त विवरणी) */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-emerald-600" />
              माह-दर-माह घटते क्रम किश्त सारणी (Month-by-Month Decreasing Schedule)
            </h3>
            <p className="text-xs text-slate-500">
              प्रत्येक माह मूलधन घटने से ब्याज घटता है, जिससे कुल किश्त घटते क्रम में आती है
            </p>
          </div>

          <div className="text-xs font-mono text-slate-600">
            कुल अवधि: <strong>{tenureMonths} माह</strong> • कुल ब्याज: <strong className="text-emerald-700">{formatCurrency(totalInterestSum)}</strong>
          </div>
        </div>

        <div className="overflow-x-auto max-h-96 overflow-y-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-100 sticky top-0 font-semibold text-slate-700 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">माह (Month)</th>
                <th className="py-2.5 px-3">प्रारंभिक शेष मूलधन</th>
                <th className="py-2.5 px-3">मूलधन किश्त</th>
                <th className="py-2.5 px-3">ब्याज (14% वार्षिक)</th>
                <th className="py-2.5 px-3">कुल किश्त (घटते क्रम में)</th>
                <th className="py-2.5 px-3">अंतिम शेष मूलधन</th>
                <th className="py-2.5 px-3">टिप्पणी / स्थिति</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {scheduleRows.map((row) => (
                <tr
                  key={row.month}
                  className={`hover:bg-slate-50 transition ${
                    row.isPreEmiMonth ? 'bg-amber-50/60 font-semibold' : ''
                  }`}
                >
                  <td className="py-2 px-3 font-mono font-bold text-slate-700">
                    माह {row.month}
                  </td>
                  <td className="py-2 px-3 font-mono text-slate-700">
                    {formatCurrency(row.openingBalance)}
                  </td>
                  <td className="py-2 px-3 font-mono text-slate-800 font-semibold">
                    {formatCurrency(row.principalPart)}
                  </td>
                  <td className="py-2 px-3 font-mono text-slate-600">
                    {formatCurrency(row.interestPart)}
                  </td>
                  <td className="py-2 px-3 font-mono font-bold text-emerald-800 text-sm">
                    {formatCurrency(row.installmentTotal)}
                  </td>
                  <td className="py-2 px-3 font-mono text-slate-600">
                    {formatCurrency(row.closingBalance)}
                  </td>
                  <td className="py-2 px-3">
                    {row.isPreEmiMonth ? (
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                        अग्रिम प्री-ईएमआई (चेक से काटी गई)
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700">
                        ग्राहक द्वारा देय
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-900 text-white font-extrabold border-t-2 border-slate-700 sticky bottom-0">
              <tr>
                <td colSpan={2} className="py-3 px-3 text-xs md:text-sm font-extrabold text-amber-300 uppercase">
                  कुल महायोग (GRAND TOTAL - {tenureMonths} माह):
                </td>
                <td className="py-3 px-3 font-mono font-black text-amber-300 text-sm md:text-base">
                  {formatCurrency(sanctionedAmount)}
                </td>
                <td className="py-3 px-3 font-mono font-black text-amber-300 text-sm md:text-base">
                  {formatCurrency(totalInterestSum)}
                </td>
                <td className="py-3 px-3 font-mono font-black text-emerald-300 text-base md:text-lg">
                  {formatCurrency(sanctionedAmount + totalInterestSum)}
                </td>
                <td className="py-3 px-3 font-mono font-black text-emerald-400 text-xs md:text-sm">
                  ₹0 (पूर्ण चुकता)
                </td>
                <td className="py-3 px-3">
                  <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-400 text-emerald-950">
                    कुल देय योग
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Printable Cheque Voucher Modal */}
      {showPrintVoucher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden print:shadow-none print:w-full print:max-w-none print:m-0">
            {/* Modal Actions */}
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between print:hidden">
              <span className="font-bold text-sm">ऋण चेक वितरण वाउचर (Cheque Disbursement Voucher)</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>प्रिंट करें</span>
                </button>
                <button
                  onClick={() => setShowPrintVoucher(false)}
                  className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Voucher Body */}
            <div className="p-8 overflow-y-auto text-xs space-y-4 font-sans text-slate-900 print:p-4">
              <div className="border-2 border-emerald-900 p-6 rounded-xl space-y-4">
                <div className="text-center border-b-2 border-emerald-900 pb-3">
                  <h1 className="text-xl font-bold text-emerald-950">
                    समोत्थान सांई साख सहकारी संस्था मर्यादित, भोपाल
                  </h1>
                  <p className="text-[11px] text-slate-600">
                    पंजीकृत कार्यालय: भोपाल (म.प्र.) • ईमेल: sssssmbhopal@gmail.com
                  </p>
                  <div className="inline-block mt-2 px-3 py-0.5 bg-emerald-900 text-white font-bold text-xs rounded uppercase">
                    ऋण आवंटन एवं चेक भुगतान वाउचर (DISBURSEMENT VOUCHER)
                  </div>
                </div>

                <div className="flex justify-between py-1 border-b text-[11px] font-mono">
                  <div>वाउचर दिनांक: {new Date().toLocaleDateString('hi-IN')}</div>
                  <div>ऋण स्वीकृत राशि: {formatCurrency(sanctionedAmount)}</div>
                </div>

                {/* Deduction calculations */}
                <div className="space-y-2 border border-slate-300 rounded-lg p-3 bg-slate-50">
                  <div className="font-bold text-slate-900 border-b pb-1">कटौती विवरण:</div>
                  <div className="flex justify-between font-mono">
                    <span>1. स्वीकृत कुल ऋण राशि:</span>
                    <span>{formatCurrency(sanctionedAmount)}</span>
                  </div>
                  <div className="flex justify-between font-mono text-rose-700">
                    <span>2. (-) अग्रिम प्री-ईएमआई (Pre-EMI) कटौती:</span>
                    <span>- {formatCurrency(preEmiDeduction)}</span>
                  </div>
                  <div className="flex justify-between font-mono text-rose-700">
                    <span>3. (-) प्रोसेसिंग फीस (Processing Fee):</span>
                    <span>- {formatCurrency(processingFee)}</span>
                  </div>
                  <div className="flex justify-between font-mono text-rose-700">
                    <span>4. (-) भवन निर्माण कोष (Building Fund):</span>
                    <span>- {formatCurrency(buildingFund)}</span>
                  </div>
                  {shareCapitalDeduction > 0 && (
                    <div className="flex justify-between font-mono text-rose-700">
                      <span>5. (-) अंश पूंजी कटौती:</span>
                      <span>- {formatCurrency(shareCapitalDeduction)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-mono font-bold text-base text-emerald-950 pt-2 border-t border-slate-300">
                    <span>ग्राहक को देय शुद्ध चेक राशि (Net Cheque):</span>
                    <span>{formatCurrency(disbursalBreakdown.netChequeAmount)}</span>
                  </div>
                </div>

                <div className="p-2.5 bg-white border border-slate-200 rounded text-xs">
                  <span className="text-slate-500">चेक राशि अक्षरों में: </span>
                  <strong className="text-slate-900">{numberToHindiWords(disbursalBreakdown.netChequeAmount)}</strong>
                </div>

                <div className="text-[11px] text-slate-600 italic">
                  प्रमाणित किया जाता है कि उपरोक्त कटौतियां संस्था के नियमानुसार की जाकर शेष राशि का चेक ऋणी को सुपुर्द किया गया है।
                </div>

                {/* Signatures */}
                <div className="mt-8 pt-6 border-t border-slate-300 grid grid-cols-3 text-center text-[11px]">
                  <div>
                    <div className="h-10"></div>
                    <div className="border-t border-slate-400 pt-1 font-semibold">
                      ऋणी के हस्ताक्षर (चेक प्राप्तकर्ता)
                    </div>
                  </div>
                  <div className="flex flex-col items-center justify-end">
                    <div className="w-14 h-14 border border-dashed border-emerald-800 rounded-full flex items-center justify-center text-[9px] text-emerald-900 font-bold p-1">
                      संस्था सील
                    </div>
                  </div>
                  <div>
                    <div className="h-10"></div>
                    <div className="border-t border-slate-400 pt-1 font-semibold">
                      रोकड़िया / प्रबंधक हस्ताक्षर
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-3 flex justify-end print:hidden border-t">
              <button
                onClick={() => setShowPrintVoucher(false)}
                className="px-4 py-1.5 bg-slate-800 text-white rounded-lg text-xs"
              >
                बंद करें
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
