import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Send, 
  Mail, 
  MessageSquare, 
  Printer, 
  Clock, 
  CheckCircle2, 
  CreditCard, 
  Phone, 
  ShieldAlert, 
  Users,
  Copy,
  Check
} from 'lucide-react';
import { LoanRecord, NotificationLog } from '../types';
import { formatCurrency } from '../utils/calculations';
import { Storage } from '../utils/storage';

interface OverdueAlertsViewProps {
  loans: LoanRecord[];
  onSelectPayment: (loan: LoanRecord) => void;
  onRefreshData: () => void;
}

export const OverdueAlertsView: React.FC<OverdueAlertsViewProps> = ({
  loans,
  onSelectPayment,
  onRefreshData,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedNoticeLoan, setSelectedNoticeLoan] = useState<LoanRecord | null>(null);

  // Filter overdue loans
  const overdueLoans = loans.filter((loan) =>
    loan.emiSchedule.some((s) => s.status === 'overdue')
  );

  const notifications = Storage.getNotifications();

  // Create notice letter text
  const generateNoticeText = (loan: LoanRecord, recipientType: 'borrower' | 'guarantor1' | 'guarantor2') => {
    const overdueItems = loan.emiSchedule.filter((s) => s.status === 'overdue');
    const overdueEmiSum = overdueItems.reduce((sum, s) => sum + (s.totalEmi - s.paidAmount), 0);
    const penaltySum = overdueItems.reduce((sum, s) => sum + (s.penalty || 0), 0);
    const totalDue = overdueEmiSum + penaltySum;
    const maxDays = Math.max(...overdueItems.map((s) => s.daysOverdue), 0);

    let recipientTitle = `श्री ${loan.borrowerName} (ऋणी)`;
    if (recipientType === 'guarantor1') recipientTitle = `श्री ${loan.guarantor1.name} (प्रथम ज़मानतदार)`;
    if (recipientType === 'guarantor2') recipientTitle = `श्री ${loan.guarantor2.name} (द्वितीय ज़मानतदार)`;

    return `प्रति,
${recipientTitle}
समोत्थान सांई साख सहकारी संस्था मर्यादित, भोपाल
विषय: ऋण खाता क्र. ${loan.loanAccountNo} की बकाया किश्त एवं विलंब दंड जमा करने बाबत तगादा सूचना।

महोदय,
आपको सूचित किया जाता है कि समोत्थान सांई साख सहकारी संस्था मर्यादित, भोपाल द्वारा स्वीकृत ऋण खाता संख्या ${loan.loanAccountNo} (सदस्यता क्र. ${loan.memberNo}) की ${overdueItems.length} मासिक किश्तें विगत ${maxDays} दिनों से विलंबित हैं।

• कुल बकाया किश्त राशि: ₹${overdueEmiSum.toLocaleString('en-IN')}
• नियमानुसार विलंब दंड: ₹${penaltySum.toLocaleString('en-IN')}
• कुल देय राशि: ₹${totalDue.toLocaleString('en-IN')}

02 ज़मानतदार:
1. ${loan.guarantor1.name} (चेक: ${loan.guarantor1.chequeNo})
2. ${loan.guarantor2.name} (चेक: ${loan.guarantor2.chequeNo})

अतः आपसे अनुरोध है कि पत्र प्राप्ति के 07 दिवस के भीतर संस्था कार्यालय में उपस्थित होकर बकाया राशि जमा करें। अन्यथा नियमानुसार सुरक्षा चेक बैंक में प्रस्तुत किए जाने हेतु संस्था स्वतंत्र होगी।

भवदीय,
प्रबंधक / अधिकृत अधिकारी
समोत्थान सांई साख सहकारी संस्था मर्यादित, भोपाल
ईमेल: sssssmbhopal@gmail.com`;
  };

  // Automated Email Dispatch
  const handleSendEmail = (loan: LoanRecord, recipientType: 'borrower' | 'guarantor1' | 'guarantor2') => {
    let email = loan.email;
    let name = loan.borrowerName;
    if (recipientType === 'guarantor1') {
      name = loan.guarantor1.name;
      email = 'sssssmbhopal@gmail.com'; // official society copy
    }
    if (recipientType === 'guarantor2') {
      name = loan.guarantor2.name;
      email = 'sssssmbhopal@gmail.com';
    }

    const subject = encodeURIComponent(
      `[तगादा सूचना पत्र] समोत्थान सांई साख सहकारी संस्था भोपाल - ऋण खाता ${loan.loanAccountNo}`
    );
    const body = encodeURIComponent(generateNoticeText(loan, recipientType));

    // Log notification
    const log: NotificationLog = {
      id: `notif-${Date.now()}`,
      loanId: loan.id,
      loanAccountNo: loan.loanAccountNo,
      borrowerName: loan.borrowerName,
      recipientType,
      recipientName: name,
      recipientContact: email || 'sssssmbhopal@gmail.com',
      channel: 'email',
      subject: `ऋण किश्त स्मरण पत्र (${loan.loanAccountNo})`,
      message: generateNoticeText(loan, recipientType).slice(0, 150) + '...',
      sentAt: new Date().toISOString(),
      status: 'sent',
    };
    Storage.addNotification(log);
    onRefreshData();

    // Trigger user mail client or inform
    window.open(`mailto:${email || 'sssssmbhopal@gmail.com'}?subject=${subject}&body=${body}`, '_blank');
  };

  // WhatsApp reminder
  const handleSendWhatsApp = (loan: LoanRecord, phone: string, recipientType: 'borrower' | 'guarantor1' | 'guarantor2') => {
    const text = encodeURIComponent(generateNoticeText(loan, recipientType));
    const cleanPhone = phone.replace(/\D/g, '');
    const fullPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

    const log: NotificationLog = {
      id: `notif-${Date.now()}`,
      loanId: loan.id,
      loanAccountNo: loan.loanAccountNo,
      borrowerName: loan.borrowerName,
      recipientType,
      recipientName: loan.borrowerName,
      recipientContact: phone,
      channel: 'whatsapp',
      subject: `व्हाट्सएप तगादा अलर्ट (${loan.loanAccountNo})`,
      message: `बकाया किश्त सूचना प्रेषित`,
      sentAt: new Date().toISOString(),
      status: 'sent',
    };
    Storage.addNotification(log);
    onRefreshData();

    window.open(`https://wa.me/${fullPhone}?text=${text}`, '_blank');
  };

  // Copy notice text to clipboard
  const handleCopyNotice = (loan: LoanRecord) => {
    const text = generateNoticeText(loan, 'borrower');
    navigator.clipboard.writeText(text);
    setCopiedId(loan.id);
    setTimeout(() => setCopiedId(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-rose-700 uppercase tracking-wider bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
            डिफाल्टर व बकाया नियंत्रण कक्ष
          </span>
          <h2 className="text-xl font-bold text-slate-900 mt-1 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            विलंबित किश्तें, दंड गणना एवं स्वचालित तगादा सूचना
          </h2>
          <p className="text-xs text-slate-500">
            समोत्थान सांई साख सहकारी संस्था मर्यादित, भोपाल • ऋणी एवं दोनों ज़मानतदारों को पूर्व सूचना व अलर्ट
          </p>
        </div>

        <div className="text-right">
          <div className="text-xs text-slate-500">कुल विलंबित ऋण खाते:</div>
          <div className="text-xl font-mono font-bold text-rose-600">
            {overdueLoans.length} खाते
          </div>
        </div>
      </div>

      {/* Overdue Loans List */}
      <div className="space-y-4">
        {overdueLoans.map((loan) => {
          const overdueItems = loan.emiSchedule.filter((s) => s.status === 'overdue');
          const overdueEmiSum = overdueItems.reduce((sum, s) => sum + (s.totalEmi - s.paidAmount), 0);
          const penaltySum = overdueItems.reduce((sum, s) => sum + (s.penalty || 0), 0);
          const totalOverduePayable = overdueEmiSum + penaltySum;
          const maxDays = Math.max(...overdueItems.map((s) => s.daysOverdue), 0);

          return (
            <div
              key={loan.id}
              className="bg-white border-2 border-rose-200/80 rounded-2xl p-5 shadow-xs space-y-4 hover:border-rose-300 transition"
            >
              {/* Top row */}
              <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold bg-rose-600 text-white px-2 py-0.5 rounded">
                      {loan.memberNo}
                    </span>
                    <span className="text-xs font-mono text-slate-500">{loan.loanAccountNo}</span>
                    <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                      {maxDays} दिन विलंबित ({overdueItems.length} किश्तें)
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-1">{loan.borrowerName}</h3>
                  <p className="text-xs text-slate-600">{loan.address}</p>
                </div>

                <div className="text-right">
                  <div className="text-[11px] text-slate-500">कुल देय बकाया (दंड सहित)</div>
                  <div className="text-xl font-bold font-mono text-rose-700">
                    {formatCurrency(totalOverduePayable)}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    किश्त: {formatCurrency(overdueEmiSum)} + पेनल्टी: {formatCurrency(penaltySum)}
                  </div>
                </div>
              </div>

              {/* Guarantors & Advance Cheque Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <div className="text-slate-500 font-semibold">ऋणी सुरक्षा चेक:</div>
                  <div className="font-mono font-bold text-slate-800">
                    चेक क्र.: {loan.advanceChequeNo}
                  </div>
                  <div className="text-slate-600 mt-0.5 flex items-center gap-1 font-mono">
                    <Phone className="w-3 h-3 text-slate-400" />
                    {loan.mobile || 'उपलब्ध नहीं'}
                  </div>
                </div>

                <div>
                  <div className="text-emerald-800 font-semibold">प्रथम ज़मानतदार:</div>
                  <div className="font-bold text-slate-800">{loan.guarantor1.name}</div>
                  <div className="font-mono text-[11px] text-slate-600">
                    चेक: {loan.guarantor1.chequeNo} • मो: {loan.guarantor1.mobile}
                  </div>
                </div>

                <div>
                  <div className="text-emerald-800 font-semibold">द्वितीय ज़मानतदार:</div>
                  <div className="font-bold text-slate-800">{loan.guarantor2.name}</div>
                  <div className="font-mono text-[11px] text-slate-600">
                    चेक: {loan.guarantor2.chequeNo} • मो: {loan.guarantor2.mobile}
                  </div>
                </div>
              </div>

              {/* Actions row: Email alert, WhatsApp alert, Print Notice, Collect EMI */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                <div className="flex flex-wrap items-center gap-2">
                  {/* Send Email Notice */}
                  <button
                    onClick={() => handleSendEmail(loan, 'borrower')}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>ईमेल तगादा भेजें</span>
                  </button>

                  {/* Send WhatsApp to Borrower */}
                  {loan.mobile && (
                    <button
                      onClick={() => handleSendWhatsApp(loan, loan.mobile, 'borrower')}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>व्हाट्सएप अलर्ट (ऋणी)</span>
                    </button>
                  )}

                  {/* Send WhatsApp to Guarantor 1 */}
                  {loan.guarantor1.mobile && (
                    <button
                      onClick={() => handleSendWhatsApp(loan, loan.guarantor1.mobile, 'guarantor1')}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                      title="ज़मानतदार 1 को अलर्ट"
                    >
                      <span>ज़मानतदार 1 अलर्ट</span>
                    </button>
                  )}

                  {/* Send WhatsApp to Guarantor 2 */}
                  {loan.guarantor2.mobile && (
                    <button
                      onClick={() => handleSendWhatsApp(loan, loan.guarantor2.mobile, 'guarantor2')}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                      title="ज़मानतदार 2 को अलर्ट"
                    >
                      <span>ज़मानतदार 2 अलर्ट</span>
                    </button>
                  )}

                  {/* Copy Notice */}
                  <button
                    onClick={() => handleCopyNotice(loan)}
                    className="px-2.5 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1 transition"
                  >
                    {copiedId === loan.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700 font-bold">कॉपी हो गया!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                        <span>सूचना कॉपी करें</span>
                      </>
                    )}
                  </button>

                  {/* View Printable Notice Modal */}
                  <button
                    onClick={() => setSelectedNoticeLoan(loan)}
                    className="px-2.5 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1 transition"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-500" />
                    <span>तगादा पत्र प्रिंट</span>
                  </button>
                </div>

                {/* Direct Pay Button */}
                <button
                  onClick={() => onSelectPayment(loan)}
                  className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 transition ml-auto"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>किश्त जमा करें</span>
                </button>
              </div>
            </div>
          );
        })}

        {overdueLoans.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-2" />
            <h3 className="text-base font-bold text-slate-800">कोई भी ऋण खाता विलंबित नहीं है</h3>
            <p className="text-xs text-slate-500 mt-1">
              सभी सदस्यों द्वारा समय पर किश्तों का भुगतान किया जा रहा है।
            </p>
          </div>
        )}
      </div>

      {/* Notification Dispatch History Table */}
      {notifications.length > 0 && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-600" />
            हाल ही में प्रेषित तगादा सूचना लॉग (Notice Dispatch Log)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="py-2 px-3">समय / दिनांक</th>
                  <th className="py-2 px-3">ऋणी / खाता क्र.</th>
                  <th className="py-2 px-3">प्राप्तकर्ता</th>
                  <th className="py-2 px-3">माध्यम</th>
                  <th className="py-2 px-3">स्थिति</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {notifications.slice(0, 5).map((n) => (
                  <tr key={n.id} className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-mono text-slate-500">
                      {new Date(n.sentAt).toLocaleString('hi-IN')}
                    </td>
                    <td className="py-2 px-3 font-medium text-slate-900">
                      {n.borrowerName} ({n.loanAccountNo})
                    </td>
                    <td className="py-2 px-3 text-slate-700">
                      {n.recipientName} ({n.recipientType === 'borrower' ? 'ऋणी' : 'ज़मानतदार'})
                    </td>
                    <td className="py-2 px-3 font-semibold capitalize text-emerald-800">
                      {n.channel}
                    </td>
                    <td className="py-2 px-3">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        प्रेषित (Dispatched)
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Printable Formal Demand Notice Modal */}
      {selectedNoticeLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden print:shadow-none print:w-full print:max-w-none print:m-0">
            {/* Top Toolbar */}
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between print:hidden">
              <span className="font-bold text-sm">तगादा सूचना पत्र (Overdue Notice Letter)</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>प्रिंट करें</span>
                </button>
                <button
                  onClick={() => setSelectedNoticeLoan(null)}
                  className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Letter Content */}
            <div className="p-8 overflow-y-auto text-xs font-serif leading-relaxed text-slate-900 print:p-4">
              <div className="text-center border-b-2 border-slate-800 pb-3">
                <h1 className="text-xl font-bold text-emerald-950">
                  समोत्थान सांई साख सहकारी संस्था मर्यादित, भोपाल
                </h1>
                <p className="text-[11px] text-slate-600">
                  पंजीकृत कार्यालय: भोपाल (मध्य प्रदेश) • ईमेल: sssssmbhopal@gmail.com
                </p>
                <div className="inline-block mt-2 px-3 py-0.5 bg-rose-700 text-white font-bold text-xs rounded">
                  ऋण किश्त वसूली हेतु तगादा सूचना पत्र
                </div>
              </div>

              <div className="mt-4 whitespace-pre-line text-slate-800">
                {generateNoticeText(selectedNoticeLoan, 'borrower')}
              </div>

              <div className="mt-8 pt-4 border-t border-slate-300 grid grid-cols-2 text-center">
                <div>
                  <div className="text-[11px] text-slate-500">प्रतिलिपि प्रेषित:</div>
                  <div className="text-[11px] text-slate-700">1. {selectedNoticeLoan.guarantor1.name} (ज़मानतदार 1)</div>
                  <div className="text-[11px] text-slate-700">2. {selectedNoticeLoan.guarantor2.name} (ज़मानतदार 2)</div>
                </div>
                <div>
                  <div className="h-10"></div>
                  <div className="border-t border-slate-400 pt-1 font-bold">
                    अधिकृत हस्ताक्षरकर्ता / प्रबंधक<br />
                    समोत्थान सांई साख सहकारी संस्था, भोपाल
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-3 flex justify-end print:hidden border-t">
              <button
                onClick={() => setSelectedNoticeLoan(null)}
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
