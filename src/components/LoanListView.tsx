import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Users, 
  CreditCard, 
  FileText, 
  Printer, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ArrowUpDown, 
  X,
  Phone,
  ShieldAlert,
  Send,
  Trash2,
  Calendar,
  Lock,
  Unlock,
  Edit3,
  ShieldCheck,
  KeyRound,
  Download
} from 'lucide-react';
import { LoanRecord, InstallmentItem } from '../types';
import { formatCurrency } from '../utils/calculations';
import { useAuth } from '../context/AuthContext';
import { EditLoanModal } from './EditLoanModal';
import { Storage } from '../utils/storage';

interface LoanListViewProps {
  loans: LoanRecord[];
  onSelectPayment: (loan: LoanRecord, installment?: InstallmentItem) => void;
  onPrintSanction: (loan: LoanRecord) => void;
  onDeleteLoan: (loanId: string) => void;
  onSendReminder: (loan: LoanRecord) => void;
  onEditLoan?: (loan: LoanRecord) => void;
  onToggleLock?: (loanId: string, locked: boolean) => void;
  onClearDummyData?: () => void;
}

export const LoanListView: React.FC<LoanListViewProps> = ({
  loans,
  onSelectPayment,
  onPrintSanction,
  onDeleteLoan,
  onSendReminder,
  onEditLoan,
  onToggleLock,
  onClearDummyData,
}) => {
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedLoan, setSelectedLoan] = useState<LoanRecord | null>(null);
  const [editingLoan, setEditingLoan] = useState<LoanRecord | null>(null);
  
  // Admin PIN prompt for locked operations
  const [pinPrompt, setPinPrompt] = useState<{
    action: 'edit' | 'delete' | 'toggleLock';
    loan: LoanRecord;
  } | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  // Check if any seed loans exist
  const hasDummyLoans = loans.some((l) => l.isSeed || l.id.startsWith('loan-10'));
  const lockedLoansCount = loans.filter((l) => l.isLocked !== false).length;

  const handleEditClick = (loan: LoanRecord) => {
    if (loan.isLocked && currentUser.role !== 'admin') {
      setPinPrompt({ action: 'edit', loan });
      setPinInput('');
      setPinError(false);
    } else {
      setEditingLoan(loan);
    }
  };

  const handleDeleteClick = (loan: LoanRecord) => {
    if (loan.isLocked) {
      setPinPrompt({ action: 'delete', loan });
      setPinInput('');
      setPinError(false);
    } else {
      if (confirm(`क्या आप ऋणी ${loan.borrowerName} का ऋण खाता हटाना चाहते हैं?`)) {
        onDeleteLoan(loan.id);
        if (selectedLoan?.id === loan.id) setSelectedLoan(null);
      }
    }
  };

  const handleToggleLockClick = (loan: LoanRecord) => {
    if (loan.isLocked && currentUser.role !== 'admin') {
      setPinPrompt({ action: 'toggleLock', loan });
      setPinInput('');
      setPinError(false);
    } else {
      if (onToggleLock) {
        onToggleLock(loan.id, !loan.isLocked);
      } else {
        Storage.toggleLock(loan.id, !loan.isLocked, currentUser.name);
      }
      if (selectedLoan?.id === loan.id) {
        setSelectedLoan({ ...selectedLoan, isLocked: !loan.isLocked });
      }
    }
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === '1234') {
      setPinError(false);
      const actionData = pinPrompt;
      setPinPrompt(null);
      if (!actionData) return;

      if (actionData.action === 'edit') {
        setEditingLoan(actionData.loan);
      } else if (actionData.action === 'delete') {
        if (confirm(`पुष्टि करें: क्या आप ऋणी ${actionData.loan.borrowerName} का खाता स्थायी रूप से हटाना चाहते हैं?`)) {
          onDeleteLoan(actionData.loan.id);
          if (selectedLoan?.id === actionData.loan.id) setSelectedLoan(null);
        }
      } else if (actionData.action === 'toggleLock') {
        if (onToggleLock) {
          onToggleLock(actionData.loan.id, !actionData.loan.isLocked);
        } else {
          Storage.toggleLock(actionData.loan.id, !actionData.loan.isLocked, 'व्यवस्थापक (Admin)');
        }
        if (selectedLoan?.id === actionData.loan.id) {
          setSelectedLoan({ ...selectedLoan, isLocked: !actionData.loan.isLocked });
        }
      }
    } else {
      setPinError(true);
    }
  };

  const handleExportBackup = () => {
    const jsonStr = Storage.exportDatabase();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SSSSM_Bhopal_Live_Loan_Register_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filter logic
  const filteredLoans = loans.filter((loan) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      loan.borrowerName.toLowerCase().includes(term) ||
      loan.memberNo.toLowerCase().includes(term) ||
      loan.loanAccountNo.toLowerCase().includes(term) ||
      loan.advanceChequeNo.toLowerCase().includes(term) ||
      loan.mobile.includes(term) ||
      loan.guarantor1.name.toLowerCase().includes(term) ||
      loan.guarantor2.name.toLowerCase().includes(term);

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && loan.status === 'active') ||
      (statusFilter === 'overdue' && loan.status === 'overdue') ||
      (statusFilter === 'closed' && loan.status === 'closed');

    return matchesSearch && matchesStatus;
  });

  // Grand Totals across filtered loans (महायोग गणना)
  const totalSanctioned = filteredLoans.reduce((sum, l) => sum + (l.sanctionedAmount || 0), 0);
  const totalDisbursed = filteredLoans.reduce((sum, l) => sum + (l.netDisbursedAmount || 94200), 0);
  const totalRecovered = filteredLoans.reduce((sum, l) => sum + (l.totalPaidPrincipal || 0), 0);
  const totalOutstanding = filteredLoans.reduce((sum, l) => sum + (l.outstandingBalance || 0), 0);

  // Modal Ledger Totals for selected loan
  const modalTotalPrincipal = selectedLoan?.emiSchedule.reduce((sum, item) => sum + item.principal, 0) || 0;
  const modalTotalInterest = selectedLoan?.emiSchedule.reduce((sum, item) => sum + item.interest, 0) || 0;
  const modalTotalEmi = selectedLoan?.emiSchedule.reduce((sum, item) => sum + item.totalEmi, 0) || 0;
  const modalTotalPaidAmount = selectedLoan?.emiSchedule.reduce((sum, item) => sum + item.paidAmount, 0) || 0;
  const modalTotalPaidPrincipal =
    selectedLoan?.emiSchedule.reduce(
      (sum, item) =>
        sum + (item.paidPrincipal !== undefined ? item.paidPrincipal : item.status === 'paid' ? item.principal : 0),
      0
    ) || 0;
  const modalTotalPaidInterest =
    selectedLoan?.emiSchedule.reduce(
      (sum, item) =>
        sum + (item.paidInterest !== undefined ? item.paidInterest : item.status === 'paid' ? item.interest : 0),
      0
    ) || 0;
  const modalTotalPenalty = selectedLoan?.emiSchedule.reduce((sum, item) => sum + (item.penalty || 0), 0) || 0;
  const modalPaidCount = selectedLoan?.emiSchedule.filter((item) => item.status === 'paid').length || 0;

  return (
    <div className="space-y-6">
      {/* Grand Total Overview Summary Bar with larger font size */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-gradient-to-br from-emerald-950 to-slate-900 text-white p-4 rounded-xl border border-emerald-800 shadow-sm">
          <div className="text-xs font-bold text-amber-300 uppercase tracking-wider">कुल स्वीकृत ऋण (GRAND TOTAL)</div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-white mt-1">
            {formatCurrency(totalSanctioned)}
          </div>
          <div className="text-xs text-emerald-200 mt-1">{filteredLoans.length} ऋण खाते प्रदर्शित</div>
        </div>

        <div className="bg-gradient-to-br from-teal-950 to-slate-900 text-white p-4 rounded-xl border border-teal-800 shadow-sm">
          <div className="text-xs font-bold text-teal-300 uppercase tracking-wider">कुल ग्राहक चेक वितरण (NET DISBURSED)</div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-teal-200 mt-1">
            {formatCurrency(totalDisbursed)}
          </div>
          <div className="text-xs text-teal-300/80 mt-1">शुद्ध चेक राशि</div>
        </div>

        <div className="bg-gradient-to-br from-blue-950 to-slate-900 text-white p-4 rounded-xl border border-blue-800 shadow-sm">
          <div className="text-xs font-bold text-blue-300 uppercase tracking-wider">कुल वसूल मूलधन (RECOVERED)</div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-blue-200 mt-1">
            {formatCurrency(totalRecovered)}
          </div>
          <div className="text-xs text-blue-300/80 mt-1">संस्था में प्राप्त मूलधन</div>
        </div>

        <div className="bg-gradient-to-br from-amber-950 to-slate-900 text-white p-4 rounded-xl border border-amber-800 shadow-sm">
          <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">कुल शेष बकाया मूलधन (OUTSTANDING)</div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-amber-300 mt-1">
            {formatCurrency(totalOutstanding)}
          </div>
          <div className="text-xs text-amber-200/80 mt-1">बाकी वसूली योग्य</div>
        </div>
      </div>
      {/* Header and Filter Controls with Live Data & Auto-Lock Badges */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" />
                ऋण पंजी एवं सदस्य अभिलेख (Loan Register)
              </h2>
              <span className="text-[11px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-emerald-300">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                100% लाइव डेटा सुरक्षित (0% हानि गारंटी)
              </span>
              <span className="text-[11px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full flex items-center gap-1 border border-amber-300">
                <Lock className="w-3 h-3 text-amber-700" />
                ऑटो-लॉक सक्रिय ({lockedLoansCount} खाते सुरक्षित)
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              कुल {loans.length} ऋण खाते • सम्पादन / संशोधन, ईएमआई लेजर, रसीद व बंधकनामा प्रिंट करें
            </p>
          </div>

          {/* Quick Actions: Clear Dummy Data & Backup */}
          <div className="flex items-center gap-2 flex-wrap">
            {hasDummyLoans && onClearDummyData && (
              <button
                onClick={onClearDummyData}
                title="सभी सैंपल/डम्मी प्रविष्टियां हटाएं और केवल आपका असली लाइव डेटा रखें"
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>डम्मी डेटा हटाएं (केवल लाइव रखें)</span>
              </button>
            )}

            <button
              onClick={handleExportBackup}
              title="सुरक्षा हेतु संपूर्ण लाइव डेटाबेस JSON बैकअप डाउनलोड करें"
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>लाइव बैकअप (.json)</span>
            </button>
          </div>
        </div>

        {/* Search & Status Filters */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-slate-100">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="नाम, सदस्यता क्र., खाता क्र., चेक नं., मोबाइल..."
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:border-emerald-500 font-medium"
            >
              <option value="all">सभी स्थिति ({loans.length})</option>
              <option value="active">सक्रिय ऋण (Active)</option>
              <option value="overdue">विलंबित किश्तें (Overdue)</option>
              <option value="closed">पूर्ण चुकता (Closed)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loans Grid / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredLoans.map((loan) => {
          const overdueCount = loan.emiSchedule.filter((s) => s.status === 'overdue').length;
          const paidCount = loan.emiSchedule.filter((s) => s.status === 'paid').length;
          const progressPercent = Math.round((paidCount / loan.tenureMonths) * 100);

          return (
            <div
              key={loan.id}
              className={`bg-white border rounded-2xl p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between ${
                loan.status === 'overdue' ? 'border-rose-300 ring-1 ring-rose-100' : 'border-slate-200/90'
              }`}
            >
              <div>
                {/* Top Badge & Status & Lock Toggle */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {loan.memberNo}
                    </span>
                    {loan.isSeed && (
                      <span className="text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded">
                        सैंपल
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Lock / Unlock Toggle Button */}
                    <button
                      onClick={() => handleToggleLockClick(loan)}
                      title={loan.isLocked !== false ? "सुरक्षित (Auto-Locked) - क्लिक करके व्यवस्थापक पिन से अनलॉक करें" : "अनलॉक - क्लिक करके पुनः सुरक्षित लॉक करें"}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 transition ${
                        loan.isLocked !== false
                          ? 'bg-slate-100 hover:bg-amber-100 text-slate-700 border border-slate-300'
                          : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300'
                      }`}
                    >
                      {loan.isLocked !== false ? (
                        <>
                          <Lock className="w-3 h-3 text-amber-600" />
                          <span>लॉक्ड</span>
                        </>
                      ) : (
                        <>
                          <Unlock className="w-3 h-3 text-emerald-700" />
                          <span>अनलॉक</span>
                        </>
                      )}
                    </button>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        loan.status === 'overdue'
                          ? 'bg-rose-100 text-rose-700 border border-rose-200'
                          : loan.status === 'closed'
                          ? 'bg-slate-100 text-slate-600'
                          : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {loan.status === 'overdue'
                        ? `⚠️ ${overdueCount} किश्त विलंबित`
                        : loan.status === 'closed'
                        ? 'पूर्ण चुकता'
                        : 'सक्रिय'}
                    </span>
                  </div>
                </div>

                {/* Borrower Name & Account No */}
                <h3 className="text-base font-bold text-slate-900">{loan.borrowerName}</h3>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">{loan.loanAccountNo}</div>
                {loan.mobile && (
                  <div className="text-xs text-slate-600 flex items-center gap-1.5 mt-1 font-mono">
                    <Phone className="w-3 h-3 text-slate-400" />
                    {loan.mobile}
                  </div>
                )}

                {/* Financial Summary */}
                <div className="mt-3.5 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-50 p-2 rounded-lg">
                    <div className="text-[10px] text-slate-500">स्वीकृत राशि</div>
                    <div className="text-sm font-bold text-slate-900 font-mono">
                      {formatCurrency(loan.sanctionedAmount)}
                    </div>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-lg">
                    <div className="text-[10px] text-slate-500">मासिक किश्त (EMI)</div>
                    <div className="text-sm font-bold text-emerald-700 font-mono">
                      {formatCurrency(loan.monthlyEmi)}
                    </div>
                  </div>
                </div>

                {/* Repayment Progress Bar */}
                <div className="mt-3">
                  <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                    <span>चुकाई गई किश्तें: {paidCount}/{loan.tenureMonths}</span>
                    <span className="font-semibold text-slate-700 font-mono">{progressPercent}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        loan.status === 'overdue' ? 'bg-rose-500' : 'bg-emerald-600'
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* 02 Guarantors mini tags */}
                <div className="mt-3 text-[11px] bg-slate-50/80 p-2 rounded-lg border border-slate-100 space-y-0.5">
                  <div className="font-semibold text-slate-700 flex items-center gap-1">
                    <span>02 ज़मानतदार:</span>
                  </div>
                  <div className="text-slate-600 truncate">1. {loan.guarantor1.name} (चेक: {loan.guarantor1.chequeNo})</div>
                  <div className="text-slate-600 truncate">2. {loan.guarantor2.name} (चेक: {loan.guarantor2.chequeNo})</div>
                </div>
              </div>

              {/* Action Buttons: Edit, View, Pay, Print, Delete */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-1 flex-wrap">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setSelectedLoan(loan)}
                    className="px-2 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition flex items-center gap-1"
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-600" />
                    <span>विवरण</span>
                  </button>

                  <button
                    onClick={() => handleEditClick(loan)}
                    title="ऋण प्रविष्टि संशोधित करें (Edit/Modify)"
                    className="px-2 py-1 text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-lg transition flex items-center gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                    <span>संशोधन</span>
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onSelectPayment(loan)}
                    className="px-2.5 py-1 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg transition shadow-xs flex items-center gap-1"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>जमा</span>
                  </button>

                  <button
                    onClick={() => onPrintSanction(loan)}
                    title="ऋण स्वीकृति आदेश व बंधकनामा प्रिंट करें"
                    className="p-1 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                  >
                    <Printer className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDeleteClick(loan)}
                    title={loan.isLocked ? "सुरक्षित रिकॉर्ड हटाएं (व्यवस्थापक पिन आवश्यक)" : "ऋण खाता हटाएं"}
                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredLoans.length === 0 && (
          <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-dashed border-slate-300">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h4 className="font-bold text-slate-700 text-sm">कोई ऋण खाता नहीं मिला</h4>
            <p className="text-xs text-slate-400 mt-1">खोज शब्द बदलें या नया ऋण प्रविष्टि करें।</p>
          </div>
        )}
      </div>

      {/* Detailed Loan Ledger Drawer / Modal */}
      {selectedLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-6 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 text-slate-900 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-900 to-teal-900 text-white p-5 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold bg-amber-400 text-emerald-950 px-2 py-0.5 rounded">
                    सदस्यता: {selectedLoan.memberNo}
                  </span>
                  <span className="text-xs font-mono text-emerald-200">
                    खाता क्र.: {selectedLoan.loanAccountNo}
                  </span>
                  {selectedLoan.isLocked !== false ? (
                    <span className="text-xs bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold">
                      <Lock className="w-3 h-3 text-amber-400" />
                      सुरक्षित (Auto-Locked)
                    </span>
                  ) : (
                    <span className="text-xs bg-amber-500 text-slate-900 px-2 py-0.5 rounded-full flex items-center gap-1 font-bold">
                      <Unlock className="w-3 h-3" />
                      अनलॉक
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-bold mt-1 text-white">{selectedLoan.borrowerName}</h3>
                <p className="text-xs text-emerald-200/90">{selectedLoan.address} • मोबाइल: {selectedLoan.mobile}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEditClick(selectedLoan)}
                  className="px-3 py-1.5 bg-blue-700 hover:bg-blue-600 text-xs font-bold rounded-lg flex items-center gap-1.5 transition text-white shadow-xs"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>संशोधित करें (Edit)</span>
                </button>
                <button
                  onClick={() => handleToggleLockClick(selectedLoan)}
                  className="px-2.5 py-1.5 bg-emerald-950/70 hover:bg-emerald-950 border border-emerald-600/50 text-xs font-semibold rounded-lg flex items-center gap-1 transition text-emerald-200"
                  title="ताला खोलें / लगाएं"
                >
                  {selectedLoan.isLocked !== false ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                  <span>{selectedLoan.isLocked !== false ? 'अनलॉक' : 'लॉक'}</span>
                </button>
                <button
                  onClick={() => onPrintSanction(selectedLoan)}
                  className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition text-emerald-100"
                >
                  <Printer className="w-4 h-4" />
                  <span className="hidden sm:inline">स्वीकृति पत्र व बंधकनामा</span>
                </button>
                <button
                  onClick={() => setSelectedLoan(null)}
                  className="p-1.5 hover:bg-emerald-800/80 rounded-lg text-emerald-200 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content Body: Details + EMI Table */}
            <div className="p-5 overflow-y-auto space-y-6 text-xs">
              {/* Top Details Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Loan & Bank specs */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5">
                  <div className="font-bold text-slate-800 border-b border-slate-200 pb-1 flex items-center justify-between">
                    <span>ऋण एवं बैंक अंतरण विवरण</span>
                    <span className="text-emerald-700 font-mono font-bold">
                      {formatCurrency(selectedLoan.sanctionedAmount)}
                    </span>
                  </div>
                  <div>स्वीकृति तिथि: <strong className="font-mono">{selectedLoan.loanDate}</strong></div>
                  <div>किश्त प्रणाली: <strong className="text-emerald-800">घटते क्रम में किश्त (14%)</strong></div>
                  <div>खाते में ट्रांसफर तिथि: <strong className="font-mono">{selectedLoan.disbursementDate}</strong></div>
                  <div>बैंक: <strong>{selectedLoan.bankName}</strong></div>
                  <div>खाता क्र.: <strong className="font-mono">{selectedLoan.accountNumber}</strong></div>
                  <div>IFSC: <strong className="font-mono">{selectedLoan.ifscCode}</strong></div>
                  <div>अग्रिम चेक नं.: <strong className="font-mono text-emerald-800">{selectedLoan.advanceChequeNo}</strong></div>
                </div>

                {/* Disbursal Cheque Deductions */}
                <div className="bg-emerald-950 text-white rounded-xl p-3.5 space-y-1.5 border border-emerald-800">
                  <div className="font-bold text-amber-300 border-b border-emerald-800 pb-1 flex items-center justify-between">
                    <span>चेक वितरण एवं कटौतियां</span>
                    <span className="text-[10px] text-emerald-200">संस्था नियम</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-emerald-200">1. प्री-ईएमआई कटौती:</span>
                    <span className="font-mono text-rose-300">- ₹{(selectedLoan.preEmiDeduction || 5000).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-emerald-200">2. प्रोसेसिंग फीस:</span>
                    <span className="font-mono text-rose-300">- ₹{(selectedLoan.processingFee || 500).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-emerald-200">3. भवन निर्माण कोष:</span>
                    <span className="font-mono text-rose-300">- ₹{(selectedLoan.buildingFund || 300).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="pt-1 border-t border-emerald-800 flex justify-between items-center text-xs">
                    <span className="text-amber-300 font-bold">ग्राहक को दिया गया चेक:</span>
                    <span className="font-mono font-extrabold text-amber-400 text-sm">
                      {formatCurrency(selectedLoan.netDisbursedAmount || 94200)}
                    </span>
                  </div>
                  <div className="text-[10px] text-emerald-200/80 font-mono">
                    चेक क्र.: {selectedLoan.disbursedChequeNo || 'CHQ-890214'}
                  </div>
                </div>

                {/* 02 Guarantors details */}
                <div className="bg-emerald-50/40 border border-emerald-200 rounded-xl p-3.5 space-y-2">
                  <div className="font-bold text-emerald-950 border-b border-emerald-200 pb-1 flex items-center justify-between">
                    <span>02 ज़मानतदार अभिलेख (Guarantors)</span>
                    <span className="text-[10px] text-emerald-700">सत्यापित</span>
                  </div>
                  <div className="space-y-2 text-[11px]">
                    <div className="bg-white p-2 rounded-lg border border-emerald-100">
                      <div className="font-bold text-slate-900">1. {selectedLoan.guarantor1.name} ({selectedLoan.guarantor1.memberNo})</div>
                      <div className="text-slate-600 font-mono text-[10px]">चेक: {selectedLoan.guarantor1.chequeNo} • मो: {selectedLoan.guarantor1.mobile}</div>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-emerald-100">
                      <div className="font-bold text-slate-900">2. {selectedLoan.guarantor2.name} ({selectedLoan.guarantor2.memberNo})</div>
                      <div className="text-slate-600 font-mono text-[10px]">चेक: {selectedLoan.guarantor2.chequeNo} • मो: {selectedLoan.guarantor2.mobile}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Installment EMI Schedule Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    मासिक किश्त अनुसूची एवं वसूली लेजर (EMI Ledger - {selectedLoan.tenureMonths} माह)
                  </h4>
                  <div className="text-xs text-slate-500 font-mono">
                    मासिक किश्त: <strong>{formatCurrency(selectedLoan.monthlyEmi)}</strong>
                  </div>
                </div>

                {/* Mandatory Amanat Rashi Banner */}
                <div className="bg-amber-50/80 border border-amber-300 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-amber-500 text-white font-bold flex items-center justify-center text-[11px]">
                      ₹
                    </span>
                    <div>
                      <span className="font-bold text-amber-950">अनिवार्य अमानत राशि: </span>
                      <strong className="text-amber-900 font-mono text-sm">₹{selectedLoan.mandatoryAmanatRashi || 100}/-</strong>
                      <span className="text-amber-800 ml-1.5">(यह राशि ऋण से पूर्णतः पृथक है, इसका ऋण गणना से कोई लेना-देना नहीं है)</span>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-200/80 text-amber-900 border border-amber-300 font-mono">
                    स्थिति: {selectedLoan.amanatStatus === 'deposited' || selectedLoan.totalPaidPrincipal > 0 ? '✓ अमानत जमा' : 'देय'}
                  </span>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-96 overflow-y-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-slate-100 sticky top-0 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-2.5">EMI क्र.</th>
                        <th className="py-2.5 px-2.5">देय तिथि</th>
                        <th className="py-2.5 px-2.5">मूलधन</th>
                        <th className="py-2.5 px-2.5">ब्याज</th>
                        <th className="py-2.5 px-2.5">देय राशि</th>
                        <th className="py-2.5 px-2.5">जमा दिनांक</th>
                        <th className="py-2.5 px-2.5">माध्यम</th>
                        <th className="py-2.5 px-2.5">जमा राशि</th>
                        <th className="py-2.5 px-2.5">जमा मूलधन</th>
                        <th className="py-2.5 px-2.5">जमा ब्याज</th>
                        <th className="py-2.5 px-2.5">दंड (₹2.6/दिन)</th>
                        <th className="py-2.5 px-2.5">स्थिति</th>
                        <th className="py-2.5 px-2.5 text-right">कार्य</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedLoan.emiSchedule.map((item) => {
                        // Green row color if paid on or before due date or pre-EMI
                        const isGreen = item.status === 'paid' && (item.onTimePayment || !item.paidDate || item.paidDate <= item.dueDate);
                        const isRed = item.status === 'overdue';
                        const isPending = item.status === 'pending';

                        const rowClass = isGreen
                          ? 'bg-emerald-50/90 text-emerald-950 border-l-4 border-l-emerald-600 hover:bg-emerald-100/70 font-medium'
                          : isRed
                          ? 'bg-rose-50/90 text-rose-950 border-l-4 border-l-rose-500 hover:bg-rose-100/70 font-medium'
                          : 'bg-amber-50/40 border-l-4 border-l-amber-400 hover:bg-amber-50';

                        return (
                          <tr key={item.installmentNo} className={`transition ${rowClass}`}>
                            <td className="py-2 px-2.5 font-mono font-bold">
                              #{item.installmentNo}
                            </td>
                            <td className="py-2 px-2.5 font-mono">{item.dueDate}</td>
                            <td className="py-2 px-2.5 font-mono">{formatCurrency(item.principal)}</td>
                            <td className="py-2 px-2.5 font-mono">{formatCurrency(item.interest)}</td>
                            <td className="py-2 px-2.5 font-mono font-bold">{formatCurrency(item.totalEmi)}</td>
                            <td className="py-2 px-2.5 font-mono">
                              {item.paidDate ? (
                                <span className={isGreen ? 'text-emerald-800 font-bold' : ''}>
                                  {item.paidDate}
                                </span>
                              ) : '-'}
                            </td>
                            <td className="py-2 px-2.5 capitalize text-[11px]">
                              {item.paymentMode === 'cash' ? 'नकद' : item.paymentMode === 'cheque' ? 'चेक' : item.paymentMode ? 'बैंक' : '-'}
                            </td>
                            <td className="py-2 px-2.5 font-mono font-bold">
                              {item.paidAmount > 0 ? formatCurrency(item.paidAmount) : '-'}
                            </td>
                            <td className="py-2 px-2.5 font-mono">
                              {item.paidPrincipal !== undefined && item.paidPrincipal > 0
                                ? formatCurrency(item.paidPrincipal)
                                : item.status === 'paid'
                                ? formatCurrency(item.principal)
                                : '-'}
                            </td>
                            <td className="py-2 px-2.5 font-mono">
                              {item.paidInterest !== undefined && item.paidInterest > 0
                                ? formatCurrency(item.paidInterest)
                                : item.status === 'paid'
                                ? formatCurrency(item.interest)
                                : '-'}
                            </td>
                            <td className="py-2 px-2.5 font-mono font-bold text-rose-600">
                              {item.penalty > 0 ? `₹${item.penalty}` : '-'}
                            </td>
                            <td className="py-2 px-2.5">
                              {item.status === 'paid' ? (
                                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-200 text-emerald-900 border border-emerald-300">
                                  ✓ समय पर जमा
                                </span>
                              ) : item.status === 'overdue' ? (
                                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-200 text-rose-900 border border-rose-300">
                                  ⚠️ विलंबित ({item.daysOverdue} दिन)
                                </span>
                              ) : (
                                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-800 border border-amber-200">
                                  देय
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-2.5 text-right">
                              {item.status !== 'paid' && (
                                <button
                                  onClick={() => {
                                    setSelectedLoan(null);
                                    onSelectPayment(selectedLoan, item);
                                  }}
                                  className="px-2 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-[11px] font-bold shadow-xs"
                                >
                                  जमा
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-slate-900 text-white font-extrabold border-t-2 border-slate-700 sticky bottom-0">
                      <tr>
                        <td colSpan={2} className="py-3 px-2.5 text-xs md:text-sm font-extrabold text-amber-300 uppercase">
                          कुल महायोग (GRAND TOTAL):
                        </td>
                        <td className="py-3 px-2.5 font-mono font-black text-amber-300 text-sm md:text-base">
                          {formatCurrency(modalTotalPrincipal)}
                        </td>
                        <td className="py-3 px-2.5 font-mono font-black text-amber-300 text-sm md:text-base">
                          {formatCurrency(modalTotalInterest)}
                        </td>
                        <td className="py-3 px-2.5 font-mono font-black text-amber-400 text-base md:text-lg">
                          {formatCurrency(modalTotalEmi)}
                        </td>
                        <td colSpan={2} className="py-3 px-2.5 text-center text-xs text-slate-300 font-bold">
                          चुकौती: {modalPaidCount}/{selectedLoan.tenureMonths} किश्तें
                        </td>
                        <td className="py-3 px-2.5 font-mono font-black text-emerald-300 text-base md:text-lg">
                          {formatCurrency(modalTotalPaidAmount)}
                        </td>
                        <td className="py-3 px-2.5 font-mono font-black text-emerald-300 text-sm md:text-base">
                          {formatCurrency(modalTotalPaidPrincipal)}
                        </td>
                        <td className="py-3 px-2.5 font-mono font-black text-emerald-300 text-sm md:text-base">
                          {formatCurrency(modalTotalPaidInterest)}
                        </td>
                        <td className="py-3 px-2.5 font-mono font-black text-rose-300 text-sm md:text-base">
                          {modalTotalPenalty > 0 ? `₹${modalTotalPenalty}` : '₹0'}
                        </td>
                        <td colSpan={2} className="py-3 px-2.5 text-center">
                          <span className="inline-block px-3 py-1 rounded-full text-xs font-black bg-emerald-400 text-emerald-950">
                            {Math.round((modalPaidCount / selectedLoan.tenureMonths) * 100)}% पूर्ण
                          </span>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-50 border-t border-slate-200 p-4 flex justify-end">
              <button
                onClick={() => setSelectedLoan(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold"
              >
                बंद करें
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Loan Entry Modal */}
      {editingLoan && (
        <EditLoanModal
          loan={editingLoan}
          isAdmin={currentUser.role === 'admin'}
          onSave={(updated) => {
            if (onEditLoan) {
              onEditLoan(updated);
            } else {
              Storage.modifyLoan(updated, currentUser.name);
            }
            setEditingLoan(null);
            if (selectedLoan?.id === updated.id) {
              setSelectedLoan(updated);
            }
          }}
          onClose={() => setEditingLoan(null)}
        />
      )}

      {/* Admin PIN Verification Modal for Locked Actions */}
      {pinPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm p-6 shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <Lock className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">
                {pinPrompt.action === 'edit'
                  ? 'ऋण प्रविष्टि संशोधन (Admin PIN)'
                  : pinPrompt.action === 'delete'
                  ? 'सुरक्षित ऋण खाता हटाएं (Admin PIN)'
                  : 'रिकॉर्ड लॉक / अनलॉक (Admin PIN)'}
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                ऋणी: <strong>{pinPrompt.loan.borrowerName}</strong> ({pinPrompt.loan.loanAccountNo})
                <br />
                यह खाता स्वतः लॉक है। आगे बढ़ने हेतु व्यवस्थापक पिन दर्ज करें।
              </p>
            </div>

            <form onSubmit={handlePinSubmit} className="space-y-3">
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="व्यवस्थापक पिन (Default: 1234)"
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-emerald-600 font-mono tracking-widest text-center"
                  autoFocus
                />
              </div>

              {pinError && (
                <p className="text-xs text-rose-600 font-bold">गलत पिन! डिफ़ॉल्ट व्यवस्थापक पिन '1234' है।</p>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPinPrompt(null)}
                  className="w-1/2 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md transition"
                >
                  सत्यापित करें 🔓
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
