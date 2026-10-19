import React from 'react';
import { 
  TrendingUp, 
  Users, 
  AlertTriangle, 
  CreditCard, 
  PiggyBank, 
  ArrowUpRight, 
  Clock, 
  ShieldCheck, 
  FileText,
  BadgeAlert,
  CalendarCheck2
} from 'lucide-react';
import { LoanRecord, LoanScheme } from '../types';
import { formatCurrency, DEFAULT_SCHEMES, calculateEmi } from '../utils/calculations';

interface DashboardProps {
  loans: LoanRecord[];
  onSelectTab: (tab: string) => void;
  onApplyScheme: (scheme: LoanScheme) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ loans, onSelectTab, onApplyScheme }) => {
  // Aggregate metrics
  const totalDisbursed = loans.reduce((sum, l) => sum + (l.sanctionedAmount || 0), 0);
  const totalRecovered = loans.reduce((sum, l) => sum + (l.totalPaidPrincipal || 0) + (l.totalPaidInterest || 0), 0);
  const totalOutstanding = loans.reduce((sum, l) => sum + (l.outstandingBalance || 0), 0);
  
  // Overdue calculations
  const overdueLoans = loans.filter((l) => {
    return l.emiSchedule.some((s) => s.status === 'overdue' && (s.paidAmount < s.totalEmi));
  });

  const totalOverdueAmount = loans.reduce((sum, l) => {
    const overdueInsts = l.emiSchedule.filter((s) => s.status === 'overdue');
    const emiOverdue = overdueInsts.reduce((iSum, s) => iSum + Math.max(0, s.totalEmi - s.paidAmount) + (s.penalty || 0), 0);
    return sum + emiOverdue;
  }, 0);

  const activeLoansCount = loans.filter((l) => l.status === 'active' || l.status === 'overdue').length;
  const recoveryPercentage = totalDisbursed > 0 ? Math.round((totalRecovered / (totalDisbursed * 1.14)) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Society Headline & Notification Banner if Overdue exists */}
      {overdueLoans.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500/15 via-rose-500/10 to-amber-500/10 border-l-4 border-rose-500 p-4 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-rose-500/20 text-rose-700">
              <BadgeAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                बकाया किश्त चेतावनी ({overdueLoans.length} ऋण खाते विलंबित)
              </h4>
              <p className="text-xs text-slate-600">
                कुल विलंबित किश्त देयता: <strong className="text-rose-600 font-mono">{formatCurrency(totalOverdueAmount)}</strong> (विलंब दंड सहित)। ऋणी व दोनों ज़मानतदारों को तुरंत तगादा पत्र भेजें।
              </p>
            </div>
          </div>
          <button
            onClick={() => onSelectTab('overdue')}
            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition"
          >
            <span>तगादा सूचना जारी करें</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top 4 Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Disbursed */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">कुल स्वीकृत / वितरित ऋण</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <PiggyBank className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-slate-900">{formatCurrency(totalDisbursed)}</div>
            <div className="text-xs text-slate-600 mt-1 flex items-center gap-1">
              <span className="text-emerald-800 font-semibold">{loans.length} ऋण अभिलेख</span> • संस्था निधि से आवंटित
            </div>
          </div>
        </div>

        {/* Total Recovered */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">कुल वसूल राशि (मूलधन + ब्याज)</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-slate-900">{formatCurrency(totalRecovered)}</div>
            <div className="text-xs text-slate-600 mt-1 flex items-center gap-1">
              <span className="text-blue-800 font-semibold">{recoveryPercentage}% वसूली दर</span> • बैंक व नकद प्राप्त
            </div>
          </div>
        </div>

        {/* Total Outstanding */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">कुल वर्तमान शेष ऋण (Outstanding)</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-slate-900">{formatCurrency(totalOutstanding)}</div>
            <div className="text-xs text-slate-600 mt-1 flex items-center gap-1">
              <span className="text-amber-800 font-semibold">{activeLoansCount} सक्रिय खाते</span> • शेष मूलधन
            </div>
          </div>
        </div>

        {/* Total Overdue */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">कुल विलंबित किश्तें (Overdue)</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-rose-600">{formatCurrency(totalOverdueAmount)}</div>
            <div className="text-xs text-slate-600 mt-1 flex items-center gap-1">
              <span className="text-rose-800 font-semibold">{overdueLoans.length} खाते</span> • नियत तिथि व्यतीत
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Shortcuts */}
      <div className="bg-gradient-to-r from-emerald-900 to-teal-900 text-white rounded-2xl p-5 shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-base font-bold flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            समोत्थान सांई साख - त्वरित संचालन केंद्र
          </h3>
          <p className="text-xs text-emerald-200/90">
            घटते क्रम में किश्त, प्री-ईएमआई चेक कटौती, 2 ज़मानतदार एवं त्वरित रसीद प्रबंधन।
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onSelectTab('calculator')}
            className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-emerald-950 rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5"
          >
            <span>🧮 ऋण व चेक कैलकुलेटर</span>
          </button>
          <button
            onClick={() => onSelectTab('add-loan')}
            className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold border border-emerald-600/50 transition flex items-center gap-1.5"
          >
            <span>+ नया ऋण प्रविष्टि</span>
          </button>
          <button
            onClick={() => onSelectTab('payments')}
            className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold border border-emerald-600/50 transition flex items-center gap-1.5"
          >
            <CalendarCheck2 className="w-4 h-4 text-emerald-300" />
            <span>किश्त जमा करें</span>
          </button>
          <button
            onClick={() => onSelectTab('reports')}
            className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold border border-emerald-600/50 transition flex items-center gap-1.5"
          >
            <FileText className="w-4 h-4 text-emerald-300" />
            <span>ऋण पंजी / रिपोर्ट्स</span>
          </button>
        </div>
      </div>

      {/* Disbursal Cheque Formula Highlight Banner */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-amber-50 border border-emerald-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-800 text-amber-300 flex items-center justify-center font-bold text-lg shrink-0">
            ₹
          </div>
          <div>
            <div className="text-xs font-bold text-emerald-950 flex items-center gap-2">
              <span>संस्था चेक वितरण नियम:</span>
              <span className="bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded text-[10px] font-mono">
                किश्त घटते क्रम में + प्री-ईएमआई व्यवस्था
              </span>
            </div>
            <p className="text-xs text-slate-700 mt-0.5">
              जैसे ₹1,00,000 ऋण में: <strong>₹5,000 प्री-ईएमआई</strong>, <strong>₹500 प्रोसेसिंग फीस</strong>, <strong>₹300 भवन निर्माण कोष</strong> = <strong className="text-emerald-800 font-mono text-sm">₹94,200 का चेक</strong> ग्राहक को दिया जाता है।
            </p>
          </div>
        </div>
        <button
          onClick={() => onSelectTab('calculator')}
          className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shrink-0"
        >
          <span>कैलकुलेटर में गणना देखें</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Pre-configured Loan Schemes Matrix as specifically requested */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              मानक ऋण स्लैब एवं ऑटो-ईएमआई चार्ट (14% वार्षिक दर)
            </h3>
            <p className="text-xs text-slate-500">
              संस्था के निर्धारित स्लैब्स (₹50,000, ₹1,00,000, ₹1,50,000, ₹2,00,000, ₹3,50,000 व ₹4,00,000)
            </p>
          </div>
          <button
            onClick={() => onSelectTab('formulas')}
            className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold underline flex items-center gap-1"
          >
            <span>फॉर्मूला व दर बदलें</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {DEFAULT_SCHEMES.map((scheme) => {
            const emi = calculateEmi(scheme.amount, scheme.interestRate, scheme.tenureMonths, scheme.interestType);
            const totalRepayable = emi * scheme.tenureMonths;
            const totalInterest = totalRepayable - scheme.amount;

            return (
              <div
                key={scheme.id}
                className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs hover:border-emerald-500 hover:shadow-md transition relative group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {scheme.tenureMonths} माह अवधि
                    </span>
                    <span className="text-xs font-semibold text-slate-500 font-mono">
                      @ {scheme.interestRate}% घटती दर
                    </span>
                  </div>

                  <div className="text-lg font-bold text-slate-900 font-mono">
                    {formatCurrency(scheme.amount)}
                  </div>
                  <div className="text-xs text-slate-500 mt-1 line-clamp-1">{scheme.description}</div>

                  <div className="mt-3.5 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-50 p-2 rounded-lg">
                      <div className="text-[10px] text-slate-500">मासिक किश्त (EMI)</div>
                      <div className="text-sm font-bold text-emerald-700 font-mono">{formatCurrency(emi)}</div>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg">
                      <div className="text-[10px] text-slate-500">कुल देय ब्याज</div>
                      <div className="text-sm font-bold text-slate-700 font-mono">{formatCurrency(totalInterest)}</div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onApplyScheme(scheme)}
                  className="mt-4 w-full py-2 bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-800 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <span>इस स्लैब से आवेदन भरें</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Loans Preview & Summary Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm md:text-base font-bold text-slate-800">
              हाल के स्वीकृत ऋण खाते (समोत्थान साख अभिलेख)
            </h3>
          </div>
          <button
            onClick={() => onSelectTab('loans')}
            className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1"
          >
            <span>सभी {loans.length} ऋण देखें</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-semibold">
                <th className="py-2.5 px-3">ऋणी का नाम / खाता क्र.</th>
                <th className="py-2.5 px-3">सदस्यता क्र.</th>
                <th className="py-2.5 px-3">स्वीकृत राशि</th>
                <th className="py-2.5 px-3">मासिक किश्त</th>
                <th className="py-2.5 px-3">अग्रिम चेक</th>
                <th className="py-2.5 px-3">02 ज़मानतदार</th>
                <th className="py-2.5 px-3">स्थिति</th>
                <th className="py-2.5 px-3 text-right">कार्य</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loans.slice(0, 5).map((loan) => (
                <tr key={loan.id} className="hover:bg-slate-50/60 transition">
                  <td className="py-2.5 px-3 font-medium text-slate-900">
                    <div className="font-bold">{loan.borrowerName}</div>
                    <div className="text-[11px] font-mono text-slate-500">{loan.loanAccountNo}</div>
                  </td>
                  <td className="py-2.5 px-3 font-mono font-semibold text-emerald-800">
                    {loan.memberNo}
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                    {formatCurrency(loan.sanctionedAmount)}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-emerald-700 font-semibold">
                    {formatCurrency(loan.monthlyEmi)}/माह
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-600">
                    {loan.advanceChequeNo || '-'}
                  </td>
                  <td className="py-2.5 px-3 text-[11px] text-slate-600">
                    <div>1. {loan.guarantor1.name} ({loan.guarantor1.memberNo})</div>
                    <div>2. {loan.guarantor2.name} ({loan.guarantor2.memberNo})</div>
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        loan.status === 'overdue'
                          ? 'bg-rose-100 text-rose-700'
                          : loan.status === 'closed'
                          ? 'bg-slate-100 text-slate-600'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {loan.status === 'overdue' ? '⚠️ विलंबित' : loan.status === 'closed' ? 'बंद' : 'सक्रिय'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={() => onSelectTab('loans')}
                      className="text-emerald-700 hover:text-emerald-800 font-semibold underline"
                    >
                      विवरण
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-900 text-white font-extrabold border-t-2 border-slate-700">
              <tr>
                <td colSpan={2} className="py-3 px-3 text-xs md:text-sm font-extrabold text-amber-300 uppercase">
                  कुल महायोग (GRAND TOTAL - {loans.length} ऋण):
                </td>
                <td className="py-3 px-3 font-mono font-black text-amber-300 text-sm md:text-base">
                  {formatCurrency(totalDisbursed)}
                </td>
                <td className="py-3 px-3 font-mono font-black text-emerald-300 text-sm md:text-base">
                  {formatCurrency(loans.reduce((sum, l) => sum + (l.monthlyEmi || 0), 0))}/माह
                </td>
                <td className="py-3 px-3 text-slate-300 text-xs">
                  अग्रिम चेक संधारित
                </td>
                <td className="py-3 px-3 text-xs text-slate-300 font-semibold">
                  ज़मानतदार: {loans.length * 2} लोग
                </td>
                <td className="py-3 px-3 text-xs font-black text-emerald-400">
                  सक्रिय
                </td>
                <td className="py-3 px-3 text-right">
                  <button
                    onClick={() => onSelectTab('reports')}
                    className="text-amber-300 hover:text-white font-bold underline text-xs"
                  >
                    विस्तृत पंजी
                  </button>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
