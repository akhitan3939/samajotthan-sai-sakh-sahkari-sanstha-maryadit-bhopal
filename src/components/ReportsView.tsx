import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  Search, 
  Filter, 
  Calendar, 
  Building2, 
  AlertTriangle, 
  Users,
  CheckCircle2
} from 'lucide-react';
import { LoanRecord, PaymentReceipt } from '../types';
import { formatCurrency } from '../utils/calculations';
import { Storage } from '../utils/storage';

interface ReportsViewProps {
  loans: LoanRecord[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({ loans }) => {
  const [activeReport, setActiveReport] = useState<'loan_register' | 'collection' | 'defaulters' | 'guarantors' | 'emi_ledger'>('loan_register');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLoanIdForLedger, setSelectedLoanIdForLedger] = useState<string>(loans[0]?.id || '');

  const receipts = Storage.getReceipts();
  const activeLedgerLoan = loans.find((l) => l.id === selectedLoanIdForLedger) || loans[0];

  // Grand Totals across all loans (महायोग गणना)
  const totalSanctioned = loans.reduce((sum, l) => sum + (l.sanctionedAmount || 0), 0);
  const totalDeductions = loans.reduce(
    (sum, l) => sum + ((l.preEmiDeduction || 5000) + (l.processingFee || 500) + (l.buildingFund || 300)),
    0
  );
  const totalDisbursedCheques = loans.reduce((sum, l) => sum + (l.netDisbursedAmount || 94200), 0);
  const totalMonthlyEmis = loans.reduce((sum, l) => sum + (l.monthlyEmi || 0), 0);
  const totalOutstanding = loans.reduce((sum, l) => sum + (l.outstandingBalance || 0), 0);
  const totalRecoveredPrincipal = loans.reduce((sum, l) => sum + (l.totalPaidPrincipal || 0), 0);
  const totalRecoveredInterest = loans.reduce((sum, l) => sum + (l.totalPaidInterest || 0), 0);

  // Grand Totals for Collections
  const totalReceiptsPrincipal = receipts.reduce((sum, r) => sum + (r.principalAmount || 0), 0);
  const totalReceiptsInterest = receipts.reduce((sum, r) => sum + (r.interestAmount || 0), 0);
  const totalReceiptsPenalty = receipts.reduce((sum, r) => sum + (r.penaltyAmount || 0), 0);
  const totalReceiptsTotal = receipts.reduce((sum, r) => sum + (r.totalPaid || 0), 0);

  // Grand Totals for Defaulters
  const overdueLoansList = loans.filter((l) => l.emiSchedule.some((s) => s.status === 'overdue'));
  const totalOverdueInstallmentsCount = overdueLoansList.reduce(
    (sum, l) => sum + l.emiSchedule.filter((s) => s.status === 'overdue').length,
    0
  );
  const totalOverdueEmiSum = overdueLoansList.reduce(
    (sum, l) =>
      sum +
      l.emiSchedule
        .filter((s) => s.status === 'overdue')
        .reduce((sSum, s) => sSum + (s.totalEmi - s.paidAmount), 0),
    0
  );
  const totalOverduePenaltySum = overdueLoansList.reduce(
    (sum, l) =>
      sum +
      l.emiSchedule
        .filter((s) => s.status === 'overdue')
        .reduce((sSum, s) => sSum + (s.penalty || 0), 0),
    0
  );

  // Grand Totals for Active Ledger Loan
  const totalLedgerPrincipal = activeLedgerLoan?.emiSchedule.reduce((sum, item) => sum + item.principal, 0) || 0;
  const totalLedgerInterest = activeLedgerLoan?.emiSchedule.reduce((sum, item) => sum + item.interest, 0) || 0;
  const totalLedgerEmi = activeLedgerLoan?.emiSchedule.reduce((sum, item) => sum + item.totalEmi, 0) || 0;
  const totalLedgerPaidAmount = activeLedgerLoan?.emiSchedule.reduce((sum, item) => sum + item.paidAmount, 0) || 0;
  const totalLedgerPaidPrincipal =
    activeLedgerLoan?.emiSchedule.reduce(
      (sum, item) =>
        sum + (item.paidPrincipal !== undefined ? item.paidPrincipal : item.status === 'paid' ? item.principal : 0),
      0
    ) || 0;
  const totalLedgerPaidInterest =
    activeLedgerLoan?.emiSchedule.reduce(
      (sum, item) =>
        sum + (item.paidInterest !== undefined ? item.paidInterest : item.status === 'paid' ? item.interest : 0),
      0
    ) || 0;
  const totalLedgerPenalty = activeLedgerLoan?.emiSchedule.reduce((sum, item) => sum + (item.penalty || 0), 0) || 0;
  const totalPaidInstallmentsCount =
    activeLedgerLoan?.emiSchedule.filter((item) => item.status === 'paid').length || 0;

  // Export EMI Ledger CSV
  const handleExportEmiLedger = () => {
    if (!activeLedgerLoan) return;
    const headers = [
      'EMI क्र.',
      'EMI देय तिथि',
      'मूलधन',
      'ब्याज',
      'कुल देय राशि',
      'जमा दिनांक',
      'जमा करने का माध्यम',
      'कुल जमा राशि',
      'जमा मूलधन',
      'जमा ब्याज',
      'विलंब दंड (₹2.6/दिन)',
      'स्थिति',
    ];
    const rows = activeLedgerLoan.emiSchedule.map((item) => [
      item.installmentNo,
      item.dueDate,
      item.principal,
      item.interest,
      item.totalEmi,
      item.paidDate || '-',
      item.paymentMode || '-',
      item.paidAmount,
      item.paidPrincipal !== undefined ? item.paidPrincipal : item.status === 'paid' ? item.principal : 0,
      item.paidInterest !== undefined ? item.paidInterest : item.status === 'paid' ? item.interest : 0,
      item.penalty > 0 ? item.penalty : 0,
      item.status === 'paid' ? 'समय पर जमा' : item.status === 'overdue' ? `विलंबित (${item.daysOverdue} दिन)` : 'देय',
    ]);
    exportToCsv(`SSSSM_EMI_Ledger_${activeLedgerLoan.memberNo}`, headers, rows);
  };

  // CSV Export utility
  const exportToCsv = (filename: string, headers: string[], rows: (string | number)[][]) => {
    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 1. Export Loan Register
  const handleExportLoanRegister = () => {
    const headers = [
      'खाता क्र.',
      'सदस्यता क्र.',
      'ऋणी का नाम',
      'मोबाइल',
      'स्वीकृति तिथि',
      'खाते में ट्रांसफर तिथि',
      'अग्रिम चेक नं.',
      'स्वीकृत राशि',
      'प्री-ईएमआई कटौती',
      'प्रोसेसिंग फीस',
      'भवन निर्माण कोष',
      'ग्राहक को दिया गया चेक',
      'चेक नं.',
      'मासिक किश्त',
      'अवधि (माह)',
      'ज़मानतदार 1',
      'ज़मानतदार 1 चेक',
      'ज़मानतदार 2',
      'ज़मानतदार 2 चेक',
      'कुल जमा मूलधन',
      'शेष राशि',
      'स्थिति',
    ];
    const rows = loans.map((l) => [
      l.loanAccountNo,
      l.memberNo,
      l.borrowerName,
      l.mobile,
      l.loanDate,
      l.disbursementDate,
      l.advanceChequeNo,
      l.sanctionedAmount,
      l.preEmiDeduction || 5000,
      l.processingFee || 500,
      l.buildingFund || 300,
      l.netDisbursedAmount || 94200,
      l.disbursedChequeNo || '-',
      l.monthlyEmi,
      l.tenureMonths,
      l.guarantor1.name,
      l.guarantor1.chequeNo,
      l.guarantor2.name,
      l.guarantor2.chequeNo,
      l.totalPaidPrincipal,
      l.outstandingBalance,
      l.status,
    ]);
    exportToCsv('SSSSM_Bhopal_Loan_Register', headers, rows);
  };

  // 2. Export Collection Register
  const handleExportCollection = () => {
    const headers = ['रसीद क्र.', 'दिनांक', 'ऋणी का नाम', 'सदस्यता क्र.', 'किश्त क्र.', 'मूलधन', 'ब्याज', 'दंड', 'कुल प्राप्त', 'माध्यम', 'रोकड़िया'];
    const rows = receipts.map((r) => [
      r.receiptNo,
      r.paymentDate,
      r.borrowerName,
      r.memberNo,
      r.installmentNos.join(','),
      r.principalAmount,
      r.interestAmount,
      r.penaltyAmount,
      r.totalPaid,
      r.paymentMode,
      r.collectedBy,
    ]);
    exportToCsv('SSSSM_Bhopal_Collection_Register', headers, rows);
  };

  // 3. Export Defaulters List
  const handleExportDefaulters = () => {
    const overdueLoans = loans.filter((l) => l.emiSchedule.some((s) => s.status === 'overdue'));
    const headers = ['ऋणी का नाम', 'सदस्यता क्र.', 'मोबाइल', 'विलंबित किश्तें', 'विलंब दिन', 'बकाया किश्त राशि', 'दंड राशि', 'कुल देय', 'ज़मानतदार 1', 'ज़मानतदार 1 फोन', 'ज़मानतदार 2', 'ज़मानतदार 2 फोन'];
    const rows = overdueLoans.map((l) => {
      const overdues = l.emiSchedule.filter((s) => s.status === 'overdue');
      const emiSum = overdues.reduce((sum, s) => sum + (s.totalEmi - s.paidAmount), 0);
      const penaltySum = overdues.reduce((sum, s) => sum + (s.penalty || 0), 0);
      const maxDays = Math.max(...overdues.map((s) => s.daysOverdue), 0);
      return [
        l.borrowerName,
        l.memberNo,
        l.mobile,
        overdues.length,
        maxDays,
        emiSum,
        penaltySum,
        emiSum + penaltySum,
        l.guarantor1.name,
        l.guarantor1.mobile,
        l.guarantor2.name,
        l.guarantor2.mobile,
      ];
    });
    exportToCsv('SSSSM_Bhopal_Defaulters_Report', headers, rows);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div>
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider bg-emerald-50 px-2.5 py-0.5 rounded">
            लेखा व सांख्यिकी रिपोर्ट केंद्र
          </span>
          <h2 className="text-xl font-bold text-slate-900 mt-1 flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600" />
            सहकारी साख वित्तीय पंजी एवं विवरणियां (Reports)
          </h2>
          <p className="text-xs text-slate-500">
            समोत्थान सांई साख सहकारी संस्था मर्यादित, भोपाल
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Printer className="w-4 h-4" />
            <span>प्रिंट विवरणी</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-2 pb-1 print:hidden text-xs">
        {[
          { id: 'loan_register', label: '1. ऋण पंजी (Loan Master Register)' },
          { id: 'collection', label: '2. किश्त वसूली पंजी (Collection Register)' },
          { id: 'defaulters', label: '3. डिफाल्टर व बकायादार सूची (Defaulters)' },
          { id: 'guarantors', label: '4. 02 ज़मानतदार अभिलेख पंजी (Guarantors)' },
          { id: 'emi_ledger', label: '5. ईएमआई किश्त लेजर (ग्रीन कलर एवं ₹2.6/दिन पेनल्टी)' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveReport(tab.id as any)}
            className={`px-4 py-2 font-bold rounded-t-xl transition whitespace-nowrap ${
              activeReport === tab.id
                ? 'bg-white border-t-2 border-emerald-600 text-emerald-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Print-Only Society Header */}
      <div className="hidden print:block text-center border-b-2 border-slate-800 pb-3 mb-4">
        <h1 className="text-xl font-bold text-emerald-950">
          समोत्थान सांई साख सहकारी संस्था मर्यादित, भोपाल (म.प्र.)
        </h1>
        <p className="text-xs text-slate-600">
          सहकारी सोसायटीज अधिनियम अंतर्गत पंजीकृत • ईमेल: sssssmbhopal@gmail.com
        </p>
        <div className="text-xs font-bold mt-1 uppercase text-slate-800">
          {activeReport === 'loan_register' && 'समग्र ऋण पंजी (Master Loan Register)'}
          {activeReport === 'collection' && 'दैनिक / मासिक किश्त वसूली पंजी'}
          {activeReport === 'defaulters' && 'विलंबित किश्तें एवं डिफाल्टर सूची'}
          {activeReport === 'guarantors' && '02 ज़मानतदार विवरण पंजी'}
          {activeReport === 'emi_ledger' && 'ईएमआई किश्त वसूली लेजर विवरणी'}
        </div>
      </div>

      {/* Grand Total Quick Highlights Bar with large font size */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 print:border print:border-slate-400 print:p-2">
        <div className="bg-gradient-to-br from-emerald-950 to-slate-900 text-white p-4 rounded-xl border border-emerald-800 shadow-sm">
          <div className="text-xs font-bold text-amber-300 uppercase tracking-wider">कुल स्वीकृत ऋण (GRAND TOTAL)</div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-white mt-1">
            {formatCurrency(totalSanctioned)}
          </div>
          <div className="text-xs text-emerald-200 mt-1">{loans.length} ऋण खाते स्वीकृत</div>
        </div>

        <div className="bg-gradient-to-br from-teal-950 to-slate-900 text-white p-4 rounded-xl border border-teal-800 shadow-sm">
          <div className="text-xs font-bold text-teal-300 uppercase tracking-wider">कुल वितरित चेक (NET CHEQUES)</div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-teal-200 mt-1">
            {formatCurrency(totalDisbursedCheques)}
          </div>
          <div className="text-xs text-teal-300/80 mt-1">कुल कटौतियां: -{formatCurrency(totalDeductions)}</div>
        </div>

        <div className="bg-gradient-to-br from-blue-950 to-slate-900 text-white p-4 rounded-xl border border-blue-800 shadow-sm">
          <div className="text-xs font-bold text-blue-300 uppercase tracking-wider">कुल वसूल मूलधन (RECOVERED)</div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-blue-200 mt-1">
            {formatCurrency(totalRecoveredPrincipal)}
          </div>
          <div className="text-xs text-blue-300/80 mt-1">कुल ब्याज प्राप्ति: {formatCurrency(totalRecoveredInterest)}</div>
        </div>

        <div className="bg-gradient-to-br from-amber-950 to-slate-900 text-white p-4 rounded-xl border border-amber-800 shadow-sm">
          <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">कुल शेष बकाया मूलधन (OUTSTANDING)</div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-amber-300 mt-1">
            {formatCurrency(totalOutstanding)}
          </div>
          <div className="text-xs text-amber-200/80 mt-1">वसूली दर: {totalSanctioned > 0 ? Math.round((totalRecoveredPrincipal / totalSanctioned) * 100) : 0}%</div>
        </div>
      </div>

      {/* 1. Loan Master Register View */}
      {activeReport === 'loan_register' && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4 print:border-none print:p-0">
          <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
            <h3 className="font-bold text-slate-900 text-sm">
              समग्र ऋण आवंटन पंजी ({loans.length} ऋण अभिलेख)
            </h3>
            <button
              onClick={handleExportLoanRegister}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>एक्सेल (CSV) डाउनलोड करें</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold">
                <tr>
                  <th className="p-2">सदस्यता क्र.</th>
                  <th className="p-2">ऋणी का नाम</th>
                  <th className="p-2">स्वीकृति तिथि</th>
                  <th className="p-2">बैंक ट्रांसफर तिथि</th>
                  <th className="p-2">अग्रिम सुरक्षा चेक</th>
                  <th className="p-2">स्वीकृत राशि</th>
                  <th className="p-2">कटौतियां (प्री-EMI+फीस+कोष)</th>
                  <th className="p-2">ग्राहक को दिया गया चेक</th>
                  <th className="p-2">मासिक किश्त</th>
                  <th className="p-2">02 ज़मानतदार एवं चेक नं.</th>
                  <th className="p-2">शेष मूलधन</th>
                  <th className="p-2">स्थिति</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loans.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50">
                    <td className="p-2 font-mono font-bold text-emerald-800">{l.memberNo}</td>
                    <td className="p-2 font-medium text-slate-900">
                      <div>{l.borrowerName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{l.loanAccountNo}</div>
                    </td>
                    <td className="p-2 font-mono text-slate-600">{l.loanDate}</td>
                    <td className="p-2 font-mono text-slate-600">{l.disbursementDate}</td>
                    <td className="p-2 font-mono font-bold text-slate-700">{l.advanceChequeNo}</td>
                    <td className="p-2 font-mono font-bold text-slate-900">
                      {formatCurrency(l.sanctionedAmount)}
                    </td>
                    <td className="p-2 font-mono text-rose-700 text-[11px]">
                      - {formatCurrency((l.preEmiDeduction || 5000) + (l.processingFee || 500) + (l.buildingFund || 300))}
                    </td>
                    <td className="p-2 font-mono font-bold text-emerald-800">
                      <div>{formatCurrency(l.netDisbursedAmount || 94200)}</div>
                      <div className="text-[10px] text-slate-500">{l.disbursedChequeNo || 'चेक'}</div>
                    </td>
                    <td className="p-2 font-mono text-emerald-700 font-bold">
                      {formatCurrency(l.monthlyEmi)}
                    </td>
                    <td className="p-2 text-[11px] text-slate-600">
                      <div>1. {l.guarantor1.name} (चेक: {l.guarantor1.chequeNo})</div>
                      <div>2. {l.guarantor2.name} (चेक: {l.guarantor2.chequeNo})</div>
                    </td>
                    <td className="p-2 font-mono font-bold text-slate-700">
                      {formatCurrency(l.outstandingBalance)}
                    </td>
                    <td className="p-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 uppercase">
                        {l.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-900 text-white font-extrabold border-t-2 border-slate-700">
                <tr>
                  <td colSpan={5} className="p-3 text-xs md:text-sm font-extrabold text-amber-300 uppercase">
                    कुल महायोग (GRAND TOTAL - {loans.length} ऋण):
                  </td>
                  <td className="p-3 font-mono font-black text-amber-300 text-sm md:text-base">
                    {formatCurrency(totalSanctioned)}
                  </td>
                  <td className="p-3 font-mono font-bold text-rose-300 text-xs md:text-sm">
                    - {formatCurrency(totalDeductions)}
                  </td>
                  <td className="p-3 font-mono font-black text-emerald-300 text-sm md:text-base">
                    {formatCurrency(totalDisbursedCheques)}
                  </td>
                  <td className="p-3 font-mono font-bold text-emerald-200 text-xs md:text-sm">
                    {formatCurrency(totalMonthlyEmis)}
                  </td>
                  <td className="p-3 text-xs text-slate-300 font-semibold">
                    ज़मानतदार: {loans.length * 2} लोग
                  </td>
                  <td className="p-3 font-mono font-black text-amber-300 text-sm md:text-base">
                    {formatCurrency(totalOutstanding)}
                  </td>
                  <td className="p-3 text-xs font-black text-emerald-400">
                    सक्रिय
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* 2. Collection Register View */}
      {activeReport === 'collection' && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4 print:border-none print:p-0">
          <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
            <h3 className="font-bold text-slate-900 text-sm">
              किश्त वसूली विवरणी ({receipts.length} रसीदें जारी)
            </h3>
            {receipts.length > 0 && (
              <button
                onClick={handleExportCollection}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>एक्सेल (CSV) डाउनलोड करें</span>
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold">
                <tr>
                  <th className="p-2">रसीद क्र.</th>
                  <th className="p-2">जमा तिथि</th>
                  <th className="p-2">ऋणी का नाम / सदस्यता</th>
                  <th className="p-2">किश्त संख्या</th>
                  <th className="p-2">जमा मूलधन</th>
                  <th className="p-2">जमा ब्याज</th>
                  <th className="p-2">दंड शुल्क</th>
                  <th className="p-2">कुल प्राप्त राशि</th>
                  <th className="p-2">माध्यम</th>
                  <th className="p-2">रोकड़िया / अधिकृत</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {receipts.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="p-2 font-mono font-bold text-emerald-800">{r.receiptNo}</td>
                    <td className="p-2 font-mono text-slate-700">{r.paymentDate}</td>
                    <td className="p-2 font-medium text-slate-900">
                      <div>{r.borrowerName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{r.memberNo}</div>
                    </td>
                    <td className="p-2 font-mono">#{r.installmentNos.join(', #')}</td>
                    <td className="p-2 font-mono">{formatCurrency(r.principalAmount)}</td>
                    <td className="p-2 font-mono">{formatCurrency(r.interestAmount)}</td>
                    <td className="p-2 font-mono text-rose-600 font-bold">
                      {r.penaltyAmount > 0 ? formatCurrency(r.penaltyAmount) : '-'}
                    </td>
                    <td className="p-2 font-mono font-bold text-emerald-800">
                      {formatCurrency(r.totalPaid)}
                    </td>
                    <td className="p-2 capitalize text-slate-700 font-medium">
                      {r.paymentMode === 'cash' ? 'नकद' : r.paymentMode === 'cheque' ? 'चेक' : 'ऑनलाइन'}
                    </td>
                    <td className="p-2 text-slate-600">{r.collectedBy}</td>
                  </tr>
                ))}
                {receipts.length === 0 && (
                  <tr>
                    <td colSpan={10} className="p-6 text-center text-slate-400">
                      कोई रसीद जारी नहीं हुई है। किश्त जमा काउंटर से वसूली दर्ज करें।
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot className="bg-slate-900 text-white font-extrabold border-t-2 border-slate-700">
                <tr>
                  <td colSpan={4} className="p-3 text-xs md:text-sm font-extrabold text-amber-300 uppercase">
                    कुल महायोग (GRAND TOTAL - {receipts.length} रसीदें):
                  </td>
                  <td className="p-3 font-mono font-black text-emerald-300 text-sm md:text-base">
                    {formatCurrency(totalReceiptsPrincipal)}
                  </td>
                  <td className="p-3 font-mono font-black text-emerald-300 text-sm md:text-base">
                    {formatCurrency(totalReceiptsInterest)}
                  </td>
                  <td className="p-3 font-mono font-black text-rose-300 text-sm md:text-base">
                    {formatCurrency(totalReceiptsPenalty)}
                  </td>
                  <td className="p-3 font-mono font-black text-emerald-400 text-base md:text-lg">
                    {formatCurrency(totalReceiptsTotal)}
                  </td>
                  <td colSpan={2} className="p-3 text-xs text-slate-300 font-semibold">
                    कुल संस्था वसूली
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* 3. Defaulters Report View */}
      {activeReport === 'defaulters' && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4 print:border-none print:p-0">
          <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5 text-rose-700">
              <AlertTriangle className="w-4 h-4" />
              डिफाल्टर / विलंबित ऋण खाते (NPA Tracking Report)
            </h3>
            <button
              onClick={handleExportDefaulters}
              className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>डिफाल्टर सूची CSV डाउनलोड</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-rose-50 border-b border-rose-200 text-rose-900 font-semibold">
                <tr>
                  <th className="p-2">ऋणी का नाम</th>
                  <th className="p-2">सदस्यता</th>
                  <th className="p-2">मोबाइल</th>
                  <th className="p-2">विलंबित किश्तें</th>
                  <th className="p-2">अधिकतम विलंब</th>
                  <th className="p-2">बकाया किश्त राशि</th>
                  <th className="p-2">विलंब दंड</th>
                  <th className="p-2">कुल देयता</th>
                  <th className="p-2">02 ज़मानतदार विवरण</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loans
                  .filter((l) => l.emiSchedule.some((s) => s.status === 'overdue'))
                  .map((l) => {
                    const overdues = l.emiSchedule.filter((s) => s.status === 'overdue');
                    const emiSum = overdues.reduce((sum, s) => sum + (s.totalEmi - s.paidAmount), 0);
                    const penaltySum = overdues.reduce((sum, s) => sum + (s.penalty || 0), 0);
                    const maxDays = Math.max(...overdues.map((s) => s.daysOverdue), 0);

                    return (
                      <tr key={l.id} className="hover:bg-rose-50/40">
                        <td className="p-2 font-bold text-slate-900">{l.borrowerName}</td>
                        <td className="p-2 font-mono font-bold text-emerald-800">{l.memberNo}</td>
                        <td className="p-2 font-mono text-slate-700">{l.mobile}</td>
                        <td className="p-2 font-mono font-bold text-rose-700">{overdues.length} किश्तें</td>
                        <td className="p-2 font-mono font-bold text-rose-700">{maxDays} दिन</td>
                        <td className="p-2 font-mono font-semibold text-slate-900">{formatCurrency(emiSum)}</td>
                        <td className="p-2 font-mono font-bold text-rose-600">{formatCurrency(penaltySum)}</td>
                        <td className="p-2 font-mono font-bold text-rose-800 text-sm">
                          {formatCurrency(emiSum + penaltySum)}
                        </td>
                        <td className="p-2 text-[11px] text-slate-600">
                          <div>1. {l.guarantor1.name} (मो: {l.guarantor1.mobile})</div>
                          <div>2. {l.guarantor2.name} (मो: {l.guarantor2.mobile})</div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
              <tfoot className="bg-slate-900 text-white font-extrabold border-t-2 border-slate-700">
                <tr>
                  <td colSpan={3} className="p-3 text-xs md:text-sm font-extrabold text-amber-300 uppercase">
                    कुल डिफाल्टर महायोग ({overdueLoansList.length} खाते):
                  </td>
                  <td className="p-3 font-mono font-black text-rose-300 text-sm md:text-base">
                    {totalOverdueInstallmentsCount} किश्तें
                  </td>
                  <td className="p-3 text-slate-300 text-xs">
                    -
                  </td>
                  <td className="p-3 font-mono font-black text-amber-300 text-sm md:text-base">
                    {formatCurrency(totalOverdueEmiSum)}
                  </td>
                  <td className="p-3 font-mono font-black text-rose-300 text-sm md:text-base">
                    {formatCurrency(totalOverduePenaltySum)}
                  </td>
                  <td className="p-3 font-mono font-black text-rose-400 text-base md:text-lg">
                    {formatCurrency(totalOverdueEmiSum + totalOverduePenaltySum)}
                  </td>
                  <td className="p-3 text-xs text-rose-300 font-semibold">
                    वसूली तगादा प्रेषित
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* 4. Guarantors Directory View */}
      {activeReport === 'guarantors' && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4 print:border-none print:p-0">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
            <Users className="w-4 h-4 text-emerald-600" />
            02 ज़मानतदार क्रॉस-वेरिफिकेशन पंजी (Guarantor Verification Directory)
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold">
                <tr>
                  <th className="p-2">ऋणी का नाम</th>
                  <th className="p-2">ऋणी चेक नं.</th>
                  <th className="p-2">स्वीकृत राशि</th>
                  <th className="p-2">प्रथम ज़मानतदार</th>
                  <th className="p-2">ज़मानतदार 1 चेक</th>
                  <th className="p-2">द्वितीय ज़मानतदार</th>
                  <th className="p-2">ज़मानतदार 2 चेक</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loans.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50">
                    <td className="p-2 font-bold text-slate-900">
                      <div>{l.borrowerName}</div>
                      <div className="text-[10px] text-slate-500">{l.memberNo}</div>
                    </td>
                    <td className="p-2 font-mono font-bold text-slate-800">{l.advanceChequeNo}</td>
                    <td className="p-2 font-mono font-semibold">{formatCurrency(l.sanctionedAmount)}</td>
                    <td className="p-2">
                      <div className="font-semibold text-slate-900">{l.guarantor1.name}</div>
                      <div className="text-[10px] text-slate-500">क्र.: {l.guarantor1.memberNo} • {l.guarantor1.mobile}</div>
                    </td>
                    <td className="p-2 font-mono font-bold text-emerald-800">{l.guarantor1.chequeNo}</td>
                    <td className="p-2">
                      <div className="font-semibold text-slate-900">{l.guarantor2.name}</div>
                      <div className="text-[10px] text-slate-500">क्र.: {l.guarantor2.memberNo} • {l.guarantor2.mobile}</div>
                    </td>
                    <td className="p-2 font-mono font-bold text-emerald-800">{l.guarantor2.chequeNo}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-900 text-white font-extrabold border-t-2 border-slate-700">
                <tr>
                  <td colSpan={2} className="p-3 text-xs md:text-sm font-extrabold text-amber-300 uppercase">
                    कुल गारंटीकृत महायोग ({loans.length} ऋणी):
                  </td>
                  <td className="p-3 font-mono font-black text-amber-300 text-sm md:text-base">
                    {formatCurrency(totalSanctioned)}
                  </td>
                  <td colSpan={2} className="p-3 text-xs text-emerald-300 font-bold">
                    प्रथम ज़मानतदार: {loans.length} सत्यापित
                  </td>
                  <td colSpan={2} className="p-3 text-xs text-emerald-300 font-bold">
                    द्वितीय ज़मानतदार: {loans.length} सत्यापित (कुल: {loans.length * 2} ज़मानतदार)
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* 5. EMI Repayment Schedule & Passbook Ledger (Exact Columns & Green Row Styling) */}
      {activeReport === 'emi_ledger' && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4 print:border-none print:p-0">
          <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5 text-emerald-900">
                <Calendar className="w-4 h-4 text-emerald-600" />
                ईएमआई किश्त वसूली लेजर विवरणी (EMI Repayment Ledger)
              </h3>
              <p className="text-xs text-slate-500">
                सही समय पर जमा किश्तें <strong className="text-emerald-700">हरे रंग (Green)</strong> में प्रदर्शित हैं • दंड ₹2.60/दिन देय तारीख मिस होने पर अगले दिन से चालू
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <select
                value={selectedLoanIdForLedger}
                onChange={(e) => setSelectedLoanIdForLedger(e.target.value)}
                className="text-xs border border-emerald-400 bg-emerald-50/50 rounded-lg px-3 py-1.5 font-bold text-emerald-950 focus:outline-none"
              >
                {loans.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.borrowerName} ({l.memberNo}) - {formatCurrency(l.sanctionedAmount)}
                  </option>
                ))}
              </select>

              <button
                onClick={handleExportEmiLedger}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>लेजर CSV डाउनलोड</span>
              </button>
            </div>
          </div>

          {/* Member Banner with Mandatory Amanat Rashi ₹100/- */}
          {activeLedgerLoan && (
            <div className="space-y-2">
              <div className="bg-emerald-950 text-white p-4 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <div className="text-amber-300 font-mono font-bold">
                    सदस्यता: {activeLedgerLoan.memberNo} • खाता: {activeLedgerLoan.loanAccountNo}
                  </div>
                  <div className="text-base font-bold text-white mt-0.5">{activeLedgerLoan.borrowerName}</div>
                  <div className="text-[11px] text-emerald-200">
                    स्वीकृत राशि: {formatCurrency(activeLedgerLoan.sanctionedAmount)} • अवधि: {activeLedgerLoan.tenureMonths} माह (घटते क्रम किश्त)
                  </div>
                </div>

                {/* Mandatory Amanat Rashi ₹100 Badge */}
                <div className="bg-emerald-900/80 border border-amber-400/40 p-3 rounded-lg text-right">
                  <div className="text-amber-300 font-bold text-xs flex items-center justify-end gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    अनिवार्य अमानत राशि (Mandatory Deposit)
                  </div>
                  <div className="text-lg font-mono font-extrabold text-white">
                    ₹{activeLedgerLoan.mandatoryAmanatRashi || 100}/-
                  </div>
                  <div className="text-[10px] text-emerald-200/90 italic">
                    * यह राशि ऋण से पूर्णतः पृथक है, इसका ऋण गणना से कोई लेना-देना नहीं है।
                  </div>
                </div>
              </div>

              {/* Penalty Formula Indicator */}
              <div className="bg-rose-50 border border-rose-200 rounded-lg p-2.5 text-xs text-rose-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>
                  <strong>विलंब दंड नियम:</strong> नियत देय तारीख से किश्त मिस हो जाने पर अगले ही दिन से <strong>₹2.60 प्रति दिन (₹2.6/day)</strong> की दर से दंड प्रभार्य होता है।
                </span>
              </div>
            </div>
          )}

          {/* Detailed Schedule Table with Exact Columns & Green Row Styling */}
          {activeLedgerLoan && (
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold sticky top-0">
                  <tr>
                    <th className="p-2.5">EMI क्र.</th>
                    <th className="p-2.5">EMI देय तिथि</th>
                    <th className="p-2.5">मूलधन</th>
                    <th className="p-2.5">ब्याज</th>
                    <th className="p-2.5">देय राशि</th>
                    <th className="p-2.5">जमा दिनांक</th>
                    <th className="p-2.5">जमा करने का माध्यम</th>
                    <th className="p-2.5">कुल जमा राशि</th>
                    <th className="p-2.5">कुल उसमें से जमा मूलधन</th>
                    <th className="p-2.5">जमा ब्याज</th>
                    <th className="p-2.5">विलंब दंड (₹2.6/दिन)</th>
                    <th className="p-2.5">स्थिति / स्टेटस</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeLedgerLoan.emiSchedule.map((item) => {
                    const isGreen = item.status === 'paid' && (item.onTimePayment || !item.paidDate || item.paidDate <= item.dueDate);
                    const isRed = item.status === 'overdue';

                    const rowClass = isGreen
                      ? 'bg-emerald-50 text-emerald-950 font-semibold border-l-4 border-l-emerald-600 hover:bg-emerald-100/70'
                      : isRed
                      ? 'bg-rose-50 text-rose-950 font-semibold border-l-4 border-l-rose-500 hover:bg-rose-100/70'
                      : 'bg-amber-50/40 text-slate-800 border-l-4 border-l-amber-400 hover:bg-amber-50';

                    return (
                      <tr key={item.installmentNo} className={`transition ${rowClass}`}>
                        <td className="p-2.5 font-mono font-bold">
                          #{item.installmentNo}
                        </td>
                        <td className="p-2.5 font-mono">{item.dueDate}</td>
                        <td className="p-2.5 font-mono">{formatCurrency(item.principal)}</td>
                        <td className="p-2.5 font-mono">{formatCurrency(item.interest)}</td>
                        <td className="p-2.5 font-mono font-bold text-slate-900">{formatCurrency(item.totalEmi)}</td>
                        <td className="p-2.5 font-mono">
                          {item.paidDate ? (
                            <span className={isGreen ? 'text-emerald-800 font-bold' : ''}>
                              {item.paidDate}
                            </span>
                          ) : '-'}
                        </td>
                        <td className="p-2.5 capitalize text-[11px]">
                          {item.paymentMode === 'cash' ? 'नकद (Cash)' : item.paymentMode === 'cheque' ? 'चेक (Cheque)' : item.paymentMode ? 'बैंक अंतरण' : '-'}
                        </td>
                        <td className="p-2.5 font-mono font-bold">
                          {item.paidAmount > 0 ? formatCurrency(item.paidAmount) : '-'}
                        </td>
                        <td className="p-2.5 font-mono">
                          {item.paidPrincipal !== undefined && item.paidPrincipal > 0
                            ? formatCurrency(item.paidPrincipal)
                            : item.status === 'paid'
                            ? formatCurrency(item.principal)
                            : '-'}
                        </td>
                        <td className="p-2.5 font-mono">
                          {item.paidInterest !== undefined && item.paidInterest > 0
                            ? formatCurrency(item.paidInterest)
                            : item.status === 'paid'
                            ? formatCurrency(item.interest)
                            : '-'}
                        </td>
                        <td className="p-2.5 font-mono font-bold text-rose-600">
                          {item.penalty > 0 ? `₹${item.penalty}` : '-'}
                        </td>
                        <td className="p-2.5">
                          {item.status === 'paid' ? (
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-200 text-emerald-900 border border-emerald-400">
                              ✓ समय पर जमा
                            </span>
                          ) : item.status === 'overdue' ? (
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-200 text-rose-900 border border-rose-400">
                              ⚠️ विलंबित ({item.daysOverdue} दिन)
                            </span>
                          ) : (
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-800 border border-amber-300">
                              देय
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-slate-900 text-white font-extrabold border-t-2 border-slate-700 sticky bottom-0">
                  <tr>
                    <td colSpan={2} className="p-3 text-xs md:text-sm font-extrabold text-amber-300 uppercase">
                      कुल महायोग (GRAND TOTAL):
                    </td>
                    <td className="p-3 font-mono font-black text-amber-300 text-sm md:text-base">
                      {formatCurrency(totalLedgerPrincipal)}
                    </td>
                    <td className="p-3 font-mono font-black text-amber-300 text-sm md:text-base">
                      {formatCurrency(totalLedgerInterest)}
                    </td>
                    <td className="p-3 font-mono font-black text-amber-400 text-base md:text-lg">
                      {formatCurrency(totalLedgerEmi)}
                    </td>
                    <td colSpan={2} className="p-3 text-center text-xs text-slate-300 font-bold">
                      चुकौती: {totalPaidInstallmentsCount}/{activeLedgerLoan.tenureMonths} किश्तें
                    </td>
                    <td className="p-3 font-mono font-black text-emerald-300 text-base md:text-lg">
                      {formatCurrency(totalLedgerPaidAmount)}
                    </td>
                    <td className="p-3 font-mono font-black text-emerald-300 text-sm md:text-base">
                      {formatCurrency(totalLedgerPaidPrincipal)}
                    </td>
                    <td className="p-3 font-mono font-black text-emerald-300 text-sm md:text-base">
                      {formatCurrency(totalLedgerPaidInterest)}
                    </td>
                    <td className="p-3 font-mono font-black text-rose-300 text-sm md:text-base">
                      {totalLedgerPenalty > 0 ? `₹${totalLedgerPenalty}` : '₹0'}
                    </td>
                    <td className="p-3 text-center">
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-black bg-emerald-400 text-emerald-950">
                        {Math.round((totalPaidInstallmentsCount / activeLedgerLoan.tenureMonths) * 100)}% पूर्ण
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
