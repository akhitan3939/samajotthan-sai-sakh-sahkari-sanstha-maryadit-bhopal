import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { LoanListView } from './components/LoanListView';
import { AddLoanView } from './components/AddLoanView';
import { CollectPaymentView } from './components/CollectPaymentView';
import { OverdueAlertsView } from './components/OverdueAlertsView';
import { ReportsView } from './components/ReportsView';
import { FormulaSettingsView } from './components/FormulaSettingsView';
import { LoanCalculatorView } from './components/LoanCalculatorView';
import { PrintReceiptModal } from './components/PrintReceiptModal';
import { PrintSanctionModal } from './components/PrintSanctionModal';
import { Storage } from './utils/storage';
import { LoanRecord, LoanScheme, InstallmentItem, PaymentReceipt, CalculationMethod } from './types';

function MainApp() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [loans, setLoans] = useState<LoanRecord[]>(() => Storage.getLoans());
  
  // Modals and contextual states
  const [selectedScheme, setSelectedScheme] = useState<LoanScheme | null>(null);
  const [selectedCalculation, setSelectedCalculation] = useState<{
    sanctionedAmount: number;
    tenureMonths: number;
    interestRate: number;
    calculationMethod: CalculationMethod;
    preEmiDeduction: number;
    processingFee: number;
    buildingFund: number;
    shareCapitalDeduction: number;
    netDisbursedAmount: number;
  } | null>(null);

  const [paymentLoan, setPaymentLoan] = useState<LoanRecord | null>(null);
  const [paymentInstallment, setPaymentInstallment] = useState<InstallmentItem | null>(null);
  const [printReceipt, setPrintReceipt] = useState<PaymentReceipt | null>(null);
  const [printSanctionLoan, setPrintSanctionLoan] = useState<LoanRecord | null>(null);

  const refreshLoans = () => {
    setLoans([...Storage.getLoans()]);
  };

  // Add new loan handler
  const handleSaveLoan = (newLoan: LoanRecord) => {
    Storage.addLoan(newLoan);
    refreshLoans();
    setSelectedScheme(null);
    setSelectedCalculation(null);
    setActiveTab('loans');
    // Prompt to view sanction letter
    setPrintSanctionLoan(newLoan);
  };

  // Record payment handler
  const handleRecordPayment = (receipt: PaymentReceipt, updatedLoan: LoanRecord) => {
    Storage.addReceipt(receipt);
    Storage.updateLoan(updatedLoan);
    refreshLoans();
    setPrintReceipt(receipt);
  };

  // Delete loan handler (Admin)
  const handleDeleteLoan = (loanId: string) => {
    Storage.deleteLoan(loanId);
    refreshLoans();
  };

  // Quick apply from dashboard scheme card
  const handleApplyScheme = (scheme: LoanScheme) => {
    setSelectedScheme(scheme);
    setSelectedCalculation(null);
    setActiveTab('add-loan');
  };

  // Navigate to payment view with preselected loan
  const handleSelectPayment = (loan: LoanRecord, installment?: InstallmentItem) => {
    setPaymentLoan(loan);
    setPaymentInstallment(installment || null);
    setActiveTab('payments');
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 font-sans flex flex-col selection:bg-emerald-200">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'add-loan') {
            // Keep if already set from calculator
          }
        }}
        onDataRefresh={refreshLoans}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-6 flex-1 w-full print:p-0">
        {activeTab === 'dashboard' && (
          <Dashboard
            loans={loans}
            onSelectTab={setActiveTab}
            onApplyScheme={handleApplyScheme}
          />
        )}

        {activeTab === 'calculator' && (
          <LoanCalculatorView
            onApplyCalculation={(calc) => {
              setSelectedCalculation(calc);
              setSelectedScheme(null);
              setActiveTab('add-loan');
            }}
          />
        )}

        {activeTab === 'loans' && (
          <LoanListView
            loans={loans}
            onSelectPayment={handleSelectPayment}
            onPrintSanction={(l) => setPrintSanctionLoan(l)}
            onDeleteLoan={handleDeleteLoan}
            onSendReminder={() => setActiveTab('overdue')}
          />
        )}

        {activeTab === 'add-loan' && (
          <AddLoanView
            initialScheme={selectedScheme}
            initialCalculation={selectedCalculation}
            onSaveLoan={handleSaveLoan}
            onCancel={() => {
              setSelectedCalculation(null);
              setSelectedScheme(null);
              setActiveTab('dashboard');
            }}
          />
        )}

        {activeTab === 'payments' && (
          <CollectPaymentView
            loans={loans}
            initialLoan={paymentLoan}
            initialInstallment={paymentInstallment}
            onRecordPayment={handleRecordPayment}
            onCancel={() => setActiveTab('dashboard')}
          />
        )}

        {activeTab === 'overdue' && (
          <OverdueAlertsView
            loans={loans}
            onSelectPayment={handleSelectPayment}
            onRefreshData={refreshLoans}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsView loans={loans} />
        )}

        {activeTab === 'formulas' && (
          <FormulaSettingsView />
        )}
      </main>

      {/* Official Payment Receipt Modal */}
      {printReceipt && (
        <PrintReceiptModal
          receipt={printReceipt}
          onClose={() => setPrintReceipt(null)}
        />
      )}

      {/* Official Loan Sanction Letter & Guarantor Bond Modal */}
      {printSanctionLoan && (
        <PrintSanctionModal
          loan={printSanctionLoan}
          onClose={() => setPrintSanctionLoan(null)}
        />
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-6 text-center text-xs text-slate-500 print:hidden mt-auto">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div>
            <strong>समोत्थान सांई साख सहकारी संस्था मर्यादित, भोपाल (म.प्र.)</strong> • सर्वाधिकार सुरक्षित
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-600">
            <span>पंजीयन क्र.: Bhopal-Coop-2024</span>
            <span>•</span>
            <span className="font-mono text-emerald-800">ईमेल: sssssmbhopal@gmail.com</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
