import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  Receipt, 
  Clock,
  Sparkles
} from 'lucide-react';
import { LoanRecord, InstallmentItem, PaymentReceipt } from '../types';
import { formatCurrency, numberToHindiWords } from '../utils/calculations';
import { useAuth } from '../context/AuthContext';

interface CollectPaymentViewProps {
  loans: LoanRecord[];
  initialLoan?: LoanRecord | null;
  initialInstallment?: InstallmentItem | null;
  onRecordPayment: (receipt: PaymentReceipt, updatedLoan: LoanRecord) => void;
  onCancel: () => void;
}

export const CollectPaymentView: React.FC<CollectPaymentViewProps> = ({
  loans,
  initialLoan,
  initialInstallment,
  onRecordPayment,
  onCancel,
}) => {
  const { currentUser } = useAuth();
  const [selectedLoanId, setSelectedLoanId] = useState<string>(initialLoan?.id || (loans[0]?.id || ''));
  const [selectedInstallmentNos, setSelectedInstallmentNos] = useState<number[]>([]);
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentMode, setPaymentMode] = useState<'cash' | 'bank_transfer' | 'cheque'>('cash');
  const [transactionRef, setTransactionRef] = useState<string>('');
  const [penaltyWaiver, setPenaltyWaiver] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');

  const currentLoan = loans.find((l) => l.id === selectedLoanId);

  // Set initial installment if provided
  useEffect(() => {
    if (initialInstallment) {
      setSelectedInstallmentNos([initialInstallment.installmentNo]);
    } else if (currentLoan) {
      const firstUnpaid = currentLoan.emiSchedule.find((s) => s.status !== 'paid');
      if (firstUnpaid) {
        setSelectedInstallmentNos([firstUnpaid.installmentNo]);
      } else {
        setSelectedInstallmentNos([]);
      }
    }
  }, [selectedLoanId, initialInstallment]);

  if (!currentLoan) {
    return (
      <div className="bg-white border rounded-2xl p-8 text-center text-slate-500">
        ऋण खाते उपलब्ध नहीं हैं। कृपया पहले नया ऋण जोड़ें।
      </div>
    );
  }

  // Calculate totals for selected installments
  const selectedItems = currentLoan.emiSchedule.filter((item) =>
    selectedInstallmentNos.includes(item.installmentNo)
  );

  const principalSum = selectedItems.reduce((sum, item) => sum + item.principal, 0);
  const interestSum = selectedItems.reduce((sum, item) => sum + item.interest, 0);
  const rawPenaltySum = selectedItems.reduce((sum, item) => sum + (item.penalty || 0), 0);
  const effectivePenalty = Math.max(0, rawPenaltySum - penaltyWaiver);
  const totalPayable = principalSum + interestSum + effectivePenalty;

  const toggleInstallment = (no: number) => {
    if (selectedInstallmentNos.includes(no)) {
      setSelectedInstallmentNos(selectedInstallmentNos.filter((n) => n !== no));
    } else {
      setSelectedInstallmentNos([...selectedInstallmentNos, no].sort((a, b) => a - b));
    }
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedInstallmentNos.length === 0) {
      alert('कृपया कम से कम एक किश्त चुनें!');
      return;
    }

    const receiptNo = `RCPT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const receipt: PaymentReceipt = {
      id: `rcpt-${Date.now()}`,
      receiptNo,
      loanId: currentLoan.id,
      loanAccountNo: currentLoan.loanAccountNo,
      borrowerName: currentLoan.borrowerName,
      memberNo: currentLoan.memberNo,
      installmentNos: selectedInstallmentNos,
      principalAmount: principalSum,
      interestAmount: interestSum,
      penaltyAmount: effectivePenalty,
      totalPaid: totalPayable,
      paymentDate,
      paymentMode,
      transactionRef: transactionRef.trim() || undefined,
      collectedBy: currentUser.hindiTitle.split('(')[0].trim(),
      collectorRole: currentUser.role,
      notes: notes.trim() || undefined,
    };

    // Update loan schedule & balances
    const updatedSchedule = currentLoan.emiSchedule.map((item) => {
      if (selectedInstallmentNos.includes(item.installmentNo)) {
        const isOnTime = paymentDate <= item.dueDate;
        return {
          ...item,
          paidAmount: item.totalEmi,
          paidPrincipal: item.principal,
          paidInterest: item.interest,
          paidDate: paymentDate,
          paymentMode,
          receiptNo,
          penaltyPaid: item.penalty > 0 ? Math.max(0, item.penalty - penaltyWaiver) : 0,
          onTimePayment: isOnTime,
          status: 'paid' as const,
        };
      }
      return item;
    });

    const isAllPaid = updatedSchedule.every((s) => s.status === 'paid');
    const isAnyOverdue = updatedSchedule.some((s) => s.status === 'overdue');

    const updatedLoan: LoanRecord = {
      ...currentLoan,
      emiSchedule: updatedSchedule,
      totalPaidPrincipal: currentLoan.totalPaidPrincipal + principalSum,
      totalPaidInterest: currentLoan.totalPaidInterest + interestSum,
      totalPaidPenalty: currentLoan.totalPaidPenalty + effectivePenalty,
      outstandingBalance: Math.max(0, currentLoan.outstandingBalance - principalSum),
      status: isAllPaid ? 'closed' : isAnyOverdue ? 'overdue' : 'active',
      updatedAt: new Date().toISOString(),
    };

    onRecordPayment(receipt, updatedLoan);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded">
            किश्त वसूली काउंटर (EMI Collection)
          </span>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            मासिक किश्त जमा एवं कम्प्यूटरीकृत रसीद
          </h2>
          <p className="text-xs text-slate-500">
            समोत्थान सांई साख सहकारी संस्था मर्यादित, भोपाल
          </p>
        </div>

        {/* Loan Selector Dropdown */}
        <div className="w-full sm:w-auto">
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            ऋणी सदस्य चुनें:
          </label>
          <select
            value={selectedLoanId}
            onChange={(e) => setSelectedLoanId(e.target.value)}
            className="text-xs border border-emerald-400 bg-emerald-50/40 rounded-lg px-3 py-2 font-medium text-slate-900 focus:outline-none focus:border-emerald-600"
          >
            {loans.map((l) => (
              <option key={l.id} value={l.id}>
                {l.borrowerName} ({l.memberNo}) - {formatCurrency(l.monthlyEmi)}/माह
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Member & Loan Summary Bar */}
      <div className="bg-gradient-to-r from-emerald-900 to-teal-900 text-white rounded-2xl p-5 shadow-md grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <div>
          <div className="text-emerald-300">ऋणी का नाम</div>
          <div className="text-sm font-bold text-white">{currentLoan.borrowerName}</div>
          <div className="text-[11px] font-mono text-emerald-200">सदस्यता: {currentLoan.memberNo}</div>
        </div>
        <div>
          <div className="text-emerald-300">स्वीकृत ऋण राशि</div>
          <div className="text-sm font-bold font-mono text-amber-300">
            {formatCurrency(currentLoan.sanctionedAmount)}
          </div>
          <div className="text-[11px] text-emerald-200">अवधि: {currentLoan.tenureMonths} माह</div>
        </div>
        <div>
          <div className="text-emerald-300">मासिक किश्त (EMI)</div>
          <div className="text-sm font-bold font-mono text-white">
            {formatCurrency(currentLoan.monthlyEmi)}
          </div>
          <div className="text-[11px] text-emerald-200">14% ब्याज दर</div>
        </div>
        <div>
          <div className="text-emerald-300">वर्तमान शेष मूलधन</div>
          <div className="text-sm font-bold font-mono text-emerald-100">
            {formatCurrency(currentLoan.outstandingBalance)}
          </div>
          <div className="text-[11px] text-emerald-200">
            02 ज़मानतदार: {currentLoan.guarantor1.name}, {currentLoan.guarantor2.name}
          </div>
        </div>
      </div>

      <form onSubmit={handlePaymentSubmit} className="space-y-6">
        {/* Unpaid Installment Picker Table */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              देय किश्तों की सूची (जमा करने हेतु चयन करें)
            </h3>
            <span className="text-xs text-slate-500">
              चयनित किश्तें: <strong>{selectedInstallmentNos.length}</strong>
            </span>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-100 sticky top-0 font-semibold text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="py-2 px-3 w-10">चयन</th>
                  <th className="py-2 px-3">किश्त #</th>
                  <th className="py-2 px-3">नियत देय तिथि</th>
                  <th className="py-2 px-3">मूलधन</th>
                  <th className="py-2 px-3">ब्याज</th>
                  <th className="py-2 px-3">कुल किश्त</th>
                  <th className="py-2 px-3">विलंब दंड</th>
                  <th className="py-2 px-3">वर्तमान स्थिति</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentLoan.emiSchedule.map((item) => {
                  const isChecked = selectedInstallmentNos.includes(item.installmentNo);
                  const isPaid = item.status === 'paid';

                  return (
                    <tr
                      key={item.installmentNo}
                      onClick={() => !isPaid && toggleInstallment(item.installmentNo)}
                      className={`cursor-pointer transition ${
                        isPaid
                          ? 'bg-slate-50 opacity-60 cursor-not-allowed'
                          : isChecked
                          ? 'bg-emerald-50/70 font-semibold text-emerald-950'
                          : item.status === 'overdue'
                          ? 'bg-rose-50/30 hover:bg-rose-50'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="py-2 px-3 text-center">
                        <input
                          type="checkbox"
                          disabled={isPaid}
                          checked={isChecked}
                          onChange={() => !isPaid && toggleInstallment(item.installmentNo)}
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                      </td>
                      <td className="py-2 px-3 font-mono font-bold">#{item.installmentNo}</td>
                      <td className="py-2 px-3 font-mono text-slate-800">{item.dueDate}</td>
                      <td className="py-2 px-3 font-mono text-slate-600">{formatCurrency(item.principal)}</td>
                      <td className="py-2 px-3 font-mono text-slate-600">{formatCurrency(item.interest)}</td>
                      <td className="py-2 px-3 font-mono font-bold text-slate-900">{formatCurrency(item.totalEmi)}</td>
                      <td className="py-2 px-3 font-mono text-rose-600 font-bold">
                        {item.penalty > 0 ? formatCurrency(item.penalty) : '-'}
                      </td>
                      <td className="py-2 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isPaid
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.status === 'overdue'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {isPaid ? 'जमा हो चुकी' : item.status === 'overdue' ? `विलंबित (${item.daysOverdue} दिन)` : 'देय'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment Configuration Row */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
            <Receipt className="w-4 h-4 text-emerald-600" />
            भुगतान विवरण एवं माध्यम
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">भुगतान तिथि</label>
              <input
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono text-slate-900 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">भुगतान माध्यम</label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as any)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 font-medium text-slate-900 focus:outline-none focus:border-emerald-500"
              >
                <option value="cash">नकद (Cash)</option>
                <option value="bank_transfer">बैंक अंतरण / RTGS / NEFT / UPI</option>
                <option value="cheque">चेक (Cheque)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {paymentMode === 'cheque' ? 'चेक नंबर' : 'ट्रांजेक्शन संदर्भ / UTR No.'}
              </label>
              <input
                type="text"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                placeholder={paymentMode === 'cheque' ? 'जैसे: 710294' : 'जैसे: UTR-92810394'}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono text-slate-900 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                पेनल्टी छूट (Waiver ₹)
              </label>
              <input
                type="number"
                min={0}
                max={rawPenaltySum}
                value={penaltyWaiver}
                onChange={(e) => setPenaltyWaiver(Number(e.target.value))}
                placeholder="0"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono text-rose-600 font-bold focus:outline-none focus:border-emerald-500"
              />
              {rawPenaltySum > 0 && (
                <span className="text-[10px] text-slate-500">कुल देय पेनल्टी: {formatCurrency(rawPenaltySum)}</span>
              )}
            </div>
          </div>
        </div>

        {/* Calculation Summary Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between text-xs border-b border-slate-200 pb-2">
            <span className="text-slate-600">मूलधन राशि (Principal): <strong>{formatCurrency(principalSum)}</strong></span>
            <span className="text-slate-600">ब्याज राशि (Interest): <strong>{formatCurrency(interestSum)}</strong></span>
            <span className="text-rose-600">विलंब दंड (Penalty): <strong>{formatCurrency(effectivePenalty)}</strong></span>
          </div>

          <div className="flex flex-wrap items-center justify-between pt-1">
            <div>
              <div className="text-xs text-slate-500">कुल प्राप्य राशि (Net Payable):</div>
              <div className="text-2xl font-bold font-mono text-emerald-800">
                {formatCurrency(totalPayable)}
              </div>
              <div className="text-xs text-slate-600 mt-0.5">
                अक्षरों में: <strong>{numberToHindiWords(totalPayable)}</strong>
              </div>
            </div>

            <div className="flex items-center gap-2.5 mt-3 sm:mt-0">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl"
              >
                रद्द करें
              </button>
              <button
                type="submit"
                disabled={selectedInstallmentNos.length === 0}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-700 to-teal-800 hover:from-emerald-800 hover:to-teal-900 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-700/20 flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 text-amber-300" />
                <span>किश्त जमा करें व रसीद बनाएं</span>
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
