import React from 'react';
import { Printer, X, Building2, CheckCircle2 } from 'lucide-react';
import { LoanRecord } from '../types';
import { formatCurrency, numberToHindiWords } from '../utils/calculations';

interface PrintSanctionModalProps {
  loan: LoanRecord;
  onClose: () => void;
}

export const PrintSanctionModal: React.FC<PrintSanctionModalProps> = ({ loan, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-6 backdrop-blur-xs">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[95vh] flex flex-col shadow-2xl overflow-hidden print:shadow-none print:w-full print:max-w-none print:m-0 print:border-none">
        {/* Top Actions (Hidden in Print) */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-sm">ऋण स्वीकृति आदेश एवं दोहरी ज़मानतनामा (Sanction Letter)</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-xs transition"
            >
              <Printer className="w-4 h-4" />
              <span>आदेश प्रिंट करें</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Sanction Document */}
        <div className="p-8 overflow-y-auto bg-white text-slate-900 font-sans print:p-4 text-xs leading-relaxed space-y-4">
          <div className="border-2 border-slate-800 p-6 rounded-xl">
            {/* Header */}
            <div className="text-center border-b-2 border-slate-800 pb-3">
              <div className="inline-block p-1 rounded-full border border-amber-600 mb-1">
                <Building2 className="w-6 h-6 text-emerald-900 mx-auto" />
              </div>
              <h1 className="text-xl md:text-2xl font-black text-emerald-950">
                समोत्थान सांई साख सहकारी संस्था मर्यादित, भोपाल
              </h1>
              <p className="text-[11px] text-slate-600 font-medium">
                (मध्य प्रदेश सहकारी सोसायटीज अधिनियम के अंतर्गत पंजीकृत)
              </p>
              <p className="text-xs text-slate-700 font-semibold">
                पंजीकृत कार्यालय: भोपाल (म.प्र.) • ईमेल: sssssmbhopal@gmail.com
              </p>
              <div className="inline-block mt-2 px-4 py-0.5 bg-slate-900 text-white rounded text-xs font-bold tracking-wider">
                ऋण स्वीकृति पत्र एवं बंधक ज़मानतनामा (02 ज़मानतदार सहित)
              </div>
            </div>

            {/* Reference & Date */}
            <div className="flex justify-between py-2 border-b border-slate-200 font-mono text-[11px]">
              <div>स्वीकृति क्र.: <strong>{loan.loanAccountNo}</strong></div>
              <div>ऋण स्वीकृति तिथि: <strong>{loan.loanDate}</strong></div>
            </div>

            {/* Borrower Details Table */}
            <div className="space-y-2 pt-2">
              <h3 className="font-bold text-slate-900 underline text-xs">1. ऋणी (सदस्य) का विवरण:</h3>
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded border border-slate-200">
                <div>ऋणी का नाम: <strong>{loan.borrowerName}</strong></div>
                <div>सदस्यता क्रमांक: <strong className="font-mono text-emerald-900">{loan.memberNo}</strong></div>
                <div>पिता/पति का नाम: <strong>{loan.fatherSpouseName || '-'}</strong></div>
                <div>मोबाइल नंबर: <strong className="font-mono">{loan.mobile || '-'}</strong></div>
                <div className="col-span-2">स्थायी पता: <strong>{loan.address}</strong></div>
              </div>
            </div>

            {/* Loan Specs Table & Deductions Breakdown */}
            <div className="space-y-2 pt-2">
              <h3 className="font-bold text-slate-900 underline text-xs">2. ऋण आवंटन, घटते क्रम किश्त एवं चेक कटौतियां:</h3>
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded border border-slate-200">
                <div>आवेदन राशि: <strong className="font-mono">{formatCurrency(loan.appliedAmount)}</strong></div>
                <div>स्वीकृत कुल ऋण राशि: <strong className="font-mono text-emerald-900 font-bold">{formatCurrency(loan.sanctionedAmount)}</strong></div>
                <div>वार्षिक ब्याज दर: <strong className="font-mono">{loan.interestRate}% वार्षिक</strong></div>
                <div>किश्त प्रणाली: <strong className="text-emerald-800">घटते क्रम में किश्त (Reducing Schedule)</strong></div>
                <div>ऋण अवधि: <strong className="font-mono">{loan.tenureMonths} माह</strong></div>
                <div>प्रथम माह किश्त: <strong className="font-mono text-emerald-900 font-bold">{formatCurrency(loan.monthlyEmi)}</strong> (अग्रिम प्री-ईएमआई समायोजित)</div>
                <div>ऋणी का अग्रिम सुरक्षा चेक नं.: <strong className="font-mono font-bold text-slate-900">{loan.advanceChequeNo}</strong></div>
                <div>खाते में ट्रांसफर तिथि: <strong className="font-mono">{loan.disbursementDate}</strong></div>
                <div className="col-span-2">बैंक / खाता: <strong className="font-mono">{loan.bankName} (A/C: {loan.accountNumber}, IFSC: {loan.ifscCode})</strong></div>
              </div>

              {/* Deductions & Net Cheque Box */}
              <div className="bg-emerald-50/60 border border-emerald-200 rounded p-2.5 space-y-1 text-[11px]">
                <div className="font-bold text-emerald-950">संस्था द्वारा ऋण स्वीकृति पर की गई अधिकृत कटौतियां:</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono">
                  <div>1. प्री-ईएमआई (1 किश्त): <strong className="text-rose-700">₹{(loan.preEmiDeduction || 5000).toLocaleString('en-IN')}</strong></div>
                  <div>2. प्रोसेसिंग फीस: <strong className="text-rose-700">₹{(loan.processingFee || 500).toLocaleString('en-IN')}</strong></div>
                  <div>3. भवन निर्माण कोष: <strong className="text-rose-700">₹{(loan.buildingFund || 300).toLocaleString('en-IN')}</strong></div>
                  <div>4. कुल कटौती: <strong className="text-rose-800 font-bold">₹{((loan.preEmiDeduction || 5000) + (loan.processingFee || 500) + (loan.buildingFund || 300)).toLocaleString('en-IN')}</strong></div>
                </div>
                <div className="pt-1 border-t border-emerald-200 flex justify-between items-center text-xs">
                  <span className="font-bold text-emerald-950">
                    ग्राहक को दिया गया शुद्ध चेक (Net Cheque Given):
                  </span>
                  <span className="font-mono font-bold text-sm text-emerald-900">
                    {formatCurrency(loan.netDisbursedAmount || 94200)} (चेक क्र.: {loan.disbursedChequeNo || 'CHQ-890214'})
                  </span>
                </div>
                <div className="text-[10px] text-slate-600">
                  शब्दों में: <strong>{numberToHindiWords(loan.netDisbursedAmount || 94200)}</strong>
                </div>
              </div>
            </div>

            {/* 02 Guarantors Undertaking */}
            <div className="space-y-2 pt-2">
              <h3 className="font-bold text-slate-900 underline text-xs">3. दो ज़मानतदारों का विवरण एवं बंधक घोषणा:</h3>
              <p className="text-[11px] text-slate-700">
                हम निम्न दोनों ज़मानतदार प्रमाणित करते हैं कि हम ऋणी श्री <strong>{loan.borrowerName}</strong> को भली-भांति जानते हैं एवं इनके द्वारा लिए गए उक्त ऋण के नियमित भुगतान की व्यक्तिगत एवं संयुक्त गारंटी लेते हैं। ऋणी द्वारा किश्त न चुकाने पर हमारे सुरक्षा चेकों से वसूली का पूर्ण अधिकार संस्था को रहेगा।
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Guarantor 1 */}
                <div className="border border-slate-300 p-2.5 rounded bg-white">
                  <div className="font-bold text-slate-900 border-b pb-1 mb-1">
                    प्रथम ज़मानतदार: {loan.guarantor1.name}
                  </div>
                  <div>सदस्यता क्र.: <span className="font-mono font-semibold">{loan.guarantor1.memberNo}</span></div>
                  <div>सुरक्षा चेक नं.: <strong className="font-mono text-emerald-800">{loan.guarantor1.chequeNo}</strong></div>
                  <div>मोबाइल: <span className="font-mono">{loan.guarantor1.mobile}</span></div>
                  <div>पता: <span className="text-slate-600">{loan.guarantor1.address}</span></div>
                </div>

                {/* Guarantor 2 */}
                <div className="border border-slate-300 p-2.5 rounded bg-white">
                  <div className="font-bold text-slate-900 border-b pb-1 mb-1">
                    द्वितीय ज़मानतदार: {loan.guarantor2.name}
                  </div>
                  <div>सदस्यता क्र.: <span className="font-mono font-semibold">{loan.guarantor2.memberNo}</span></div>
                  <div>सुरक्षा चेक नं.: <strong className="font-mono text-emerald-800">{loan.guarantor2.chequeNo}</strong></div>
                  <div>मोबाइल: <span className="font-mono">{loan.guarantor2.mobile}</span></div>
                  <div>पता: <span className="text-slate-600">{loan.guarantor2.address}</span></div>
                </div>
              </div>
            </div>

            {/* Signatures */}
            <div className="mt-8 pt-6 border-t border-slate-300 grid grid-cols-4 text-center text-[11px]">
              <div>
                <div className="h-10"></div>
                <div className="border-t border-slate-400 pt-1 font-semibold">
                  हस्ताक्षर ऋणी
                </div>
              </div>
              <div>
                <div className="h-10"></div>
                <div className="border-t border-slate-400 pt-1 font-semibold">
                  हस्ताक्षर ज़मानतदार 01
                </div>
              </div>
              <div>
                <div className="h-10"></div>
                <div className="border-t border-slate-400 pt-1 font-semibold">
                  हस्ताक्षर ज़मानतदार 02
                </div>
              </div>
              <div>
                <div className="h-10"></div>
                <div className="border-t border-slate-400 pt-1 font-semibold text-emerald-900">
                  हस्ताक्षर प्रबंधक / अध्यक्ष<br />(संस्था सील सहित)
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-100 p-3 flex justify-end print:hidden border-t">
          <button
            onClick={onClose}
            className="px-5 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-semibold"
          >
            बंद करें
          </button>
        </div>
      </div>
    </div>
  );
};
