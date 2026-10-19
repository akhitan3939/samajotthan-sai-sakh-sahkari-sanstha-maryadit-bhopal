import React, { useState } from 'react';
import { 
  Building2, 
  ShieldCheck, 
  UserCheck, 
  Download, 
  Upload, 
  KeyRound, 
  X, 
  Check,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Storage } from '../utils/storage';
import { UserRole } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onDataRefresh: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, onDataRefresh }) => {
  const { currentUser, switchRole, availableRoles } = useAuth();
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>(currentUser.role);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  // Backup Export
  const handleExportBackup = () => {
    const jsonStr = Storage.exportDatabase();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SSSSM_Bhopal_Loan_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Backup Restore
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = Storage.importDatabase(content);
      if (success) {
        alert('डेटाबेस सफलतापूर्वक रीस्टोर कर लिया गया है!');
        onDataRefresh();
      } else {
        alert('अमान्य बैकअप फ़ाइल। कृपया सही फ़ाइल चुनें।');
      }
    };
    reader.readAsText(file);
  };

  const handleRoleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = switchRole(selectedRole, pinInput);
    if (ok) {
      setShowRoleModal(false);
      setPinInput('');
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  return (
    <header className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white shadow-xl sticky top-0 z-40 border-b border-emerald-700/40 print:hidden">
      {/* Top Bar with Registration & Contact */}
      <div className="border-b border-emerald-800/60 bg-emerald-950/60 text-xs px-4 py-1.5 flex flex-wrap items-center justify-between text-emerald-200">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-amber-300">पंजीकृत सहकारी संस्था</span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:inline">म.प्र. सहकारी सोसायटीज अधिनियम के अंतर्गत पंजीकृत</span>
          <span>•</span>
          <span>मुख्यालय: भोपाल (म.प्र.)</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-emerald-300 font-mono">ईमेल: sssssmbhopal@gmail.com</span>
          <span className="bg-emerald-800/80 text-emerald-100 px-2 py-0.5 rounded text-[11px] font-mono">
            आज: 19 अक्टूबर 2026
          </span>
        </div>
      </div>

      {/* Main Header */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 p-0.5 shadow-lg flex items-center justify-center shrink-0">
            <div className="w-full h-full bg-emerald-950 rounded-[10px] flex items-center justify-center">
              <Building2 className="w-7 h-7 text-amber-400" />
            </div>
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-bold tracking-tight text-white flex items-center gap-2">
              समोत्थान सांई साख सहकारी संस्था मर्यादित
              <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded font-normal">
                भोपाल
              </span>
            </h1>
            <p className="text-xs text-emerald-200/80">
              ऋण वितरण, किश्त (EMI) ट्रैकिंग, 02 ज़मानतदार अभिलेख एवं वसूली प्रबंधन प्रणाली
            </p>
          </div>
        </div>

        {/* Right Action Tools: Role & Backup */}
        <div className="flex items-center gap-2.5">
          {/* Data Backup Button */}
          <button
            onClick={handleExportBackup}
            title="सम्पूर्ण ऋण डेटा डाउनलोड करें"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-800/70 hover:bg-emerald-700 text-emerald-100 border border-emerald-600/40 transition shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden md:inline">बैकअप डाउनलोड</span>
          </button>

          {/* Data Restore Button */}
          <label
            title="बैकअप फ़ाइल रीस्टोर करें"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-800/70 hover:bg-emerald-700 text-emerald-100 border border-emerald-600/40 cursor-pointer transition shadow-sm"
          >
            <Upload className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden md:inline">डेटा रीस्टोर</span>
            <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
          </label>

          {/* Role Indicator / Switcher */}
          <button
            onClick={() => {
              setSelectedRole(currentUser.role);
              setPinInput('');
              setPinError(false);
              setShowRoleModal(true);
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500/20 to-emerald-600/30 border border-amber-400/40 hover:border-amber-400 text-xs font-medium text-amber-200 transition"
          >
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <div className="text-left leading-tight">
              <div className="text-[10px] text-emerald-300 uppercase tracking-wider font-semibold">सक्रिय पदभार</div>
              <div className="font-semibold text-white truncate max-w-[150px]">{currentUser.hindiTitle.split('(')[0]}</div>
            </div>
            <KeyRound className="w-3.5 h-3.5 text-amber-300 ml-1" />
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav className="bg-emerald-950/80 border-t border-emerald-800/50 px-4">
        <div className="max-w-7xl mx-auto flex items-center gap-1 overflow-x-auto py-1 scrollbar-none text-xs md:text-sm font-medium">
          {[
            { id: 'dashboard', label: '📊 डैशबोर्ड (Dashboard)' },
            { id: 'calculator', label: '🧮 ऋण व चेक कैलकुलेटर' },
            { id: 'loans', label: '📋 ऋण खाते एवं सदस्य' },
            { id: 'add-loan', label: '➕ नया ऋण जोड़ें' },
            { id: 'payments', label: '💰 किश्त जमा (EMI)' },
            { id: 'overdue', label: '⚠️ बकाया व तगादा अलर्ट' },
            { id: 'reports', label: '📑 रिपोर्ट्स व पंजी' },
            { id: 'formulas', label: '⚙️ फॉर्मूला व नियम' },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 rounded-lg whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-amber-400 text-emerald-950 font-bold shadow-md shadow-amber-400/20'
                    : 'text-emerald-100 hover:bg-emerald-800/50 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Role Switcher Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 text-white rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={() => setShowRoleModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">पदभार / भूमिका चयन (Role Access)</h3>
                <p className="text-xs text-slate-400">सुरक्षित कार्य हेतु कृपया पद और सुरक्षा पिन (PIN) दर्ज करें</p>
              </div>
            </div>

            <form onSubmit={handleRoleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">पदभार चुनें:</label>
                <div className="grid grid-cols-1 gap-2">
                  {availableRoles.map((r) => (
                    <button
                      type="button"
                      key={r.role}
                      onClick={() => {
                        setSelectedRole(r.role);
                        setPinError(false);
                      }}
                      className={`text-left p-3 rounded-xl border transition flex items-start justify-between ${
                        selectedRole === r.role
                          ? 'border-amber-400 bg-amber-500/10 text-amber-200'
                          : 'border-slate-800 bg-slate-800/50 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-sm flex items-center gap-1.5">
                          <UserCheck className="w-4 h-4 text-amber-400" />
                          {r.title}
                        </div>
                        <div className="text-xs text-slate-400 mt-1">{r.desc}</div>
                        <div className="text-[11px] text-amber-400/80 mt-1 font-mono">
                          डिफ़ॉल्ट पिन: {r.defaultPin}
                        </div>
                      </div>
                      {selectedRole === r.role && <Check className="w-5 h-5 text-amber-400 shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  सुरक्षा पिन दर्ज करें (4-अंक):
                </label>
                <input
                  type="password"
                  maxLength={4}
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                    setPinError(false);
                  }}
                  placeholder="जैसे: 1234"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-center text-lg tracking-widest font-mono text-amber-300 focus:outline-none focus:border-amber-400"
                  autoFocus
                />
                {pinError && (
                  <p className="text-xs text-rose-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> गलत पिन! कृपया सही पिन दर्ज करें।
                  </p>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRoleModal(false)}
                  className="flex-1 py-2.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-medium"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20"
                >
                  पुष्टि करें व लॉग-इन करें
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
