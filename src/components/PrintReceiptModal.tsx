import React from 'react';
import { Printer, X, Building2, CheckCircle2 } from 'lucide-react';
import { PaymentReceipt } from '../types';
import { formatCurrency, numberToHindiWords } from '../utils/calculations';

interface PrintReceiptModalProps {
  receipt: PaymentReceipt;
  onClose: () => void;
}

export const PrintReceiptModal: React.FC<PrintReceiptModalProps> = ({ receipt, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-6 backdrop-blur-xs">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[95vh] flex flex-col shadow-2xl overflow-hidden print:shadow-none print:w-full print:max-w-none print:m-0 print:border-none">
        {/* Modal Top Actions (Hidden in Print) */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-sm">किश्त भुगतान रसीद (Payment Receipt)</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-xs transition"
            >
              <Printer className="w-4 h-4" />
              <span>रसीद प्रिंट करें (Print)</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* The Printable Official Receipt Layout */}
        <div className="p-6 md:p-8 overflow-y-auto bg-white text-slate-900 font-sans print:p-4">
          <div className="border-2 border-emerald-900 p-6 rounded-xl relative">
            {/* Corner Badges */}
            <div className="absolute top-2 left-3 text-[10px] text-slate-500 font-mono">
              कार्यालय प्रति / सदस्य प्रति
            </div>
            <div className="absolute top-2 right-3 text-[10px] text-emerald-800 font-bold font-mono">
              रसीद क्र.: {receipt.receiptNo}
            </div>

            {/* Society Official Seal & Header */}
            <div className="text-center border-b-2 border-emerald-900 pb-3 mt-3">
              <div className="inline-block p-1 rounded-full border border-amber-600 mb-1">
                <Building2 className="w-7 h-7 text-emerald-900 mx-auto" />
              </div>
              <h1 className="text-xl md:text-2xl font-black text-emerald-950 tracking-tight">
                समोत्थान सांई साख सहकारी संस्था मर्यादित, भोपाल
              </h1>
              <p className="text-xs text-slate-600 font-medium">
                (मध्य प्रदेश सहकारी सोसायटीज अधिनियम के अंतर्गत पंजीकृत)
              </p>
              <p className="text-xs text-slate-700 font-semibold mt-0.5">
                मुख्यालय: भोपाल (म.प्र.) • ईमेल: sssssmbhopal@gmail.com
              </p>
              <div className="inline-block mt-2 px-4 py-0.5 bg-emerald-900 text-white rounded text-xs font-bold tracking-wider uppercase">
                ऋण किश्त वसूली रसीद (LOAN INSTALLMENT RECEIPT)
              </div>
            </div>

            {/* Receipt Meta Row */}
            <div className="grid grid-cols-2 gap-4 py-3 border-b border-slate-200 text-xs">
              <div>
                <span className="text-slate-500">दिनांक: </span>
                <strong className="font-mono">{receipt.paymentDate}</strong>
              </div>
              <div className="text-right">
                <span className="text-slate-500">ऋण खाता क्र.: </span>
                <strong className="font-mono text-emerald-900">{receipt.loanAccountNo}</strong>
              </div>
            </div>

            {/* Member & Payment Details */}
            <div className="py-4 space-y-2.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">ऋणी (सदस्य) का नाम:</span>
                <strong className="text-sm font-bold text-slate-900">{receipt.borrowerName}</strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">सदस्यता क्रमांक (Member ID):</span>
                <strong className="font-mono text-emerald-900 font-bold">{receipt.memberNo}</strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">जमा की गई किश्त क्र.:</span>
                <strong className="font-mono text-slate-800">
                  किश्त संख्या {receipt.installmentNos.join(', ')}
                </strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">भुगतान माध्यम (Mode of Payment):</span>
                <span className="font-semibold text-slate-800 capitalize">
                  {receipt.paymentMode === 'cash' ? 'नकद (Cash)' : receipt.paymentMode === 'cheque' ? 'चेक (Cheque)' : 'बैंक अंतरण / ऑनलाइन'}
                  {receipt.transactionRef && ` (Ref: ${receipt.transactionRef})`}
                </span>
              </div>
            </div>

            {/* Financial Breakdown Table */}
            <div className="border border-slate-300 rounded-lg overflow-hidden my-3 text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-100 border-b border-slate-300 font-bold text-slate-800">
                  <tr>
                    <th className="p-2">विवरण (Particulars)</th>
                    <th className="p-2 text-right">राशि (Amount ₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="p-2">जमा मूलधन (Principal Repaid)</td>
                    <td className="p-2 text-right font-mono font-semibold">
                      {formatCurrency(receipt.principalAmount)}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2">जमा सामान्य ब्याज (Interest)</td>
                    <td className="p-2 text-right font-mono font-semibold">
                      {formatCurrency(receipt.interestAmount)}
                    </td>
                  </tr>
                  {receipt.penaltyAmount > 0 && (
                    <tr className="text-rose-700 bg-rose-50/50">
                      <td className="p-2">विलंब दंड शुल्क (Late Penalty)</td>
                      <td className="p-2 text-right font-mono font-bold">
                        {formatCurrency(receipt.penaltyAmount)}
                      </td>
                    </tr>
                  )}
                  <tr className="bg-emerald-50 font-bold text-emerald-950 text-sm">
                    <td className="p-2.5">कुल प्राप्त राशि (Total Paid Amount)</td>
                    <td className="p-2.5 text-right font-mono text-base">
                      {formatCurrency(receipt.totalPaid)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Hindi Words */}
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
              <span className="text-slate-500 font-medium">अक्षरों में (In Words): </span>
              <strong className="text-slate-900">{numberToHindiWords(receipt.totalPaid)}</strong>
            </div>

            {/* Signature & Seal Footer */}
            <div className="mt-8 pt-6 border-t border-slate-300 grid grid-cols-3 text-center text-xs">
              <div>
                <div className="h-10"></div>
                <div className="border-t border-slate-400 pt-1 font-semibold text-slate-700">
                  ऋणी / जमाकर्ता के हस्ताक्षर
                </div>
              </div>
              <div className="flex flex-col items-center justify-end">
                <div className="w-16 h-16 border-2 border-dashed border-emerald-900/40 rounded-full flex items-center justify-center text-[10px] text-emerald-900 font-bold text-center leading-tight p-1 mb-1">
                  संस्था की सील
                </div>
                <div className="text-[11px] text-slate-500">समोत्थान सांई साख</div>
              </div>
              <div>
                <div className="h-10 flex items-end justify-center pb-1">
                  <span className="font-mono text-[11px] text-emerald-800 font-semibold">{receipt.collectedBy}</span>
                </div>
                <div className="border-t border-slate-400 pt-1 font-semibold text-slate-700">
                  हस्ताक्षर रोकड़िया / अधिकृत अधिकारी
                </div>
              </div>
            </div>

            <div className="mt-4 text-center text-[10px] text-slate-400">
              * यह एक कम्प्यूटरीकृत वैध साख सहकारी रसीद है। किसी भी विसंगति पर कृपया 7 दिवस के भीतर संस्था में संपर्क करें।
            </div>
          </div>
        </div>

        {/* Footer Close */}
        <div className="bg-slate-100 p-3 flex justify-end print:hidden border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold"
          >
            बंद करें
          </button>
        </div>
      </div>
    </div>
  );
};
