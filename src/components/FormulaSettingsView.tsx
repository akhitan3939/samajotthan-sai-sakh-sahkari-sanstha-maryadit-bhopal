import React, { useState } from 'react';
import { 
  Sliders, 
  Calculator, 
  CheckCircle2, 
  Percent, 
  Clock, 
  DollarSign, 
  ShieldCheck, 
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { PenaltySettings } from '../types';
import { Storage } from '../utils/storage';
import { calculateEmi, formatCurrency, numberToHindiWords } from '../utils/calculations';
import { useAuth } from '../context/AuthContext';

export const FormulaSettingsView: React.FC = () => {
  const { currentUser } = useAuth();
  const [settings, setSettings] = useState<PenaltySettings>(Storage.getSettings());
  const [isSaved, setIsSaved] = useState(false);

  // Live Formula Test Sandbox
  const [testAmount, setTestAmount] = useState<number>(100000);
  const [testRate, setTestRate] = useState<number>(14);
  const [testMonths, setTestMonths] = useState<number>(24);
  const [testType, setTestType] = useState<'reducing' | 'flat'>('reducing');
  const [testOverdueDays, setTestOverdueDays] = useState<number>(18);

  const testEmi = calculateEmi(testAmount, testRate, testMonths, testType);
  const testTotalPayable = testEmi * testMonths;
  const testTotalInterest = testTotalPayable - testAmount;

  // Test penalty calculation
  const billableDays = Math.max(0, testOverdueDays - settings.gracePeriodDays);
  let testPenalty = 0;
  if (billableDays > 0) {
    if (settings.penaltyMode === 'percentage') {
      testPenalty = Math.round(((testEmi * (settings.monthlyPenaltyRate / 100)) / 30) * billableDays);
    } else {
      testPenalty = Math.round(billableDays * settings.fixedDailyPenalty);
    }
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    Storage.saveSettings(settings);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider bg-emerald-50 px-2.5 py-0.5 rounded">
            सहकारी नियम व ब्याज विन्यास
          </span>
          <h2 className="text-xl font-bold text-slate-900 mt-1 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-emerald-600" />
            ऋण ईएमआई, अंश पूंजी एवं दंड ब्याज फॉर्मूला नियंत्रण
          </h2>
          <p className="text-xs text-slate-500">
            समोत्थान सांई साख सहकारी संस्था मर्यादित, भोपाल
          </p>
        </div>

        {currentUser.role !== 'admin' && (
          <div className="bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <span>फॉर्मूला सम्पादन हेतु 'प्रबंधक / Admin' पद आवश्यक है।</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Settings Configuration Form */}
        <form onSubmit={handleSave} className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-5">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
            <Percent className="w-4 h-4 text-emerald-600" />
            विलंब दंड एवं सहकारी कटौती नियम (Rules & Formulas)
          </h3>

          <div className="space-y-4 text-xs">
            {/* Grace Period */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                रियायत अवधि (Grace Period - दिन)
              </label>
              <input
                type="number"
                min={0}
                max={30}
                disabled={currentUser.role !== 'admin'}
                value={settings.gracePeriodDays}
                onChange={(e) =>
                  setSettings({ ...settings, gracePeriodDays: Number(e.target.value) })
                }
                className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono text-slate-900 focus:outline-none focus:border-emerald-500 disabled:bg-slate-100"
              />
              <p className="text-[11px] text-slate-500 mt-0.5">
                देय तिथि के बाद इतने दिन तक कोई दंड ब्याज नहीं लगेगा (मानक: 5 दिन)।
              </p>
            </div>

            {/* Penalty Calculation Mode */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                विलंब दंड गणना प्रणाली (Penalty Calculation Mode)
              </label>
              <select
                disabled={currentUser.role !== 'admin'}
                value={settings.penaltyMode}
                onChange={(e) =>
                  setSettings({ ...settings, penaltyMode: e.target.value as any })
                }
                className="w-full border border-slate-300 rounded-lg px-3 py-2 font-medium text-slate-900 focus:outline-none focus:border-emerald-500 disabled:bg-slate-100"
              >
                <option value="percentage">प्रतिशत आधारित (मासिक दर % के आधार पर - मानक)</option>
                <option value="fixed_daily">निश्चित दैनिक शुल्क (Fixed ₹ per day)</option>
              </select>
            </div>

            {/* Monthly Penalty Rate */}
            {settings.penaltyMode === 'percentage' ? (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  विलंब दंड दर (% प्रति माह)
                </label>
                <input
                  type="number"
                  step="0.1"
                  disabled={currentUser.role !== 'admin'}
                  value={settings.monthlyPenaltyRate}
                  onChange={(e) =>
                    setSettings({ ...settings, monthlyPenaltyRate: Number(e.target.value) })
                  }
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono font-bold text-rose-700 focus:outline-none focus:border-emerald-500 disabled:bg-slate-100"
                />
                <p className="text-[11px] text-slate-500 mt-0.5">
                  किश्त पर देय मासिक दंड ब्याज दर (मानक: 2.0% प्रति माह)।
                </p>
              </div>
            ) : (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  निश्चित दैनिक दंड राशि (₹ प्रति दिन)
                </label>
                <input
                  type="number"
                  disabled={currentUser.role !== 'admin'}
                  value={settings.fixedDailyPenalty}
                  onChange={(e) =>
                    setSettings({ ...settings, fixedDailyPenalty: Number(e.target.value) })
                  }
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono font-bold text-rose-700 focus:outline-none focus:border-emerald-500 disabled:bg-slate-100"
                />
              </div>
            )}

            {/* Share capital */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  अंश पूंजी कटौती (Share Capital %)
                </label>
                <input
                  type="number"
                  step="0.5"
                  disabled={currentUser.role !== 'admin'}
                  value={settings.shareCapitalRate}
                  onChange={(e) =>
                    setSettings({ ...settings, shareCapitalRate: Number(e.target.value) })
                  }
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono text-slate-900 focus:outline-none focus:border-emerald-500 disabled:bg-slate-100"
                />
                <p className="text-[10px] text-slate-500 mt-0.5">मानक: 5% ऋण राशि का</p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  फाइल चार्ज / प्रोसेसिंग (% या दर)
                </label>
                <input
                  type="number"
                  step="0.1"
                  disabled={currentUser.role !== 'admin'}
                  value={settings.processingFeeRate}
                  onChange={(e) =>
                    setSettings({ ...settings, processingFeeRate: Number(e.target.value) })
                  }
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono text-slate-900 focus:outline-none focus:border-emerald-500 disabled:bg-slate-100"
                />
                <p className="text-[10px] text-slate-500 mt-0.5">मानक: 1.0% ऋण राशि का</p>
              </div>
            </div>
          </div>

          {currentUser.role === 'admin' && (
            <div className="pt-2 flex items-center justify-between">
              {isSaved ? (
                <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> नियम व फॉर्मूला सुरक्षित कर लिया गया है!
                </span>
              ) : <div />}
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md transition"
              >
                नियम सुरक्षित करें
              </button>
            </div>
          )}
        </form>

        {/* Right: Live Interactive Formula Testing Sandbox */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
            <Calculator className="w-4 h-4 text-emerald-600" />
            लाइव फॉर्मूला एवं ईएमआई कैलकुलेटर टेस्ट बेंच
          </h3>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">परीक्षण ऋण राशि (₹)</label>
              <input
                type="number"
                step={10000}
                value={testAmount}
                onChange={(e) => setTestAmount(Number(e.target.value))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono font-bold"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">ब्याज दर (% वार्षिक)</label>
              <input
                type="number"
                step={0.5}
                value={testRate}
                onChange={(e) => setTestRate(Number(e.target.value))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono font-bold"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">अवधि (माह)</label>
              <input
                type="number"
                value={testMonths}
                onChange={(e) => setTestMonths(Number(e.target.value))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono font-bold"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">प्रणाली</label>
              <select
                value={testType}
                onChange={(e) => setTestType(e.target.value as any)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 font-semibold"
              >
                <option value="reducing">घटती शेष किश्त (Reducing)</option>
                <option value="flat">समतल ब्याज (Flat Rate)</option>
              </select>
            </div>
          </div>

          {/* Test Overdue Days for Penalty Simulation */}
          <div className="bg-rose-50/60 p-3 rounded-xl border border-rose-200 text-xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-semibold text-rose-900">विलंब दंड परीक्षण (Overdue Penalty Simulation):</span>
              <span className="font-mono font-bold text-rose-700">{testOverdueDays} दिन विलंबित</span>
            </div>
            <input
              type="range"
              min={0}
              max={90}
              value={testOverdueDays}
              onChange={(e) => setTestOverdueDays(Number(e.target.value))}
              className="w-full accent-rose-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>0 दिन (समय पर)</span>
              <span>5 दिन (रियायत सीमा)</span>
              <span>30 दिन</span>
              <span>60+ दिन</span>
            </div>
          </div>

          {/* Result Output Card */}
          <div className="bg-slate-900 text-white rounded-xl p-4 space-y-3 font-mono text-xs">
            <div className="flex justify-between items-center border-b border-slate-700 pb-2">
              <span className="text-slate-400">मासिक किश्त (Monthly EMI):</span>
              <span className="text-xl font-bold text-amber-300">{formatCurrency(testEmi)}</span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-slate-400">कुल देय ब्याज:</span>
              <span className="text-emerald-300">{formatCurrency(testTotalInterest)}</span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-slate-400">कुल पुनर्भुगतान:</span>
              <span className="text-slate-200">{formatCurrency(testTotalPayable)}</span>
            </div>
            <div className="flex justify-between items-center text-[11px] pt-1 border-t border-slate-800 text-rose-400">
              <span>आकलित विलंब दंड ({billableDays} दिन प्रभार्य):</span>
              <span className="font-bold text-sm">{formatCurrency(testPenalty)}</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 italic">
            * ईएमआई शब्दों में: {numberToHindiWords(testEmi)}
          </div>
        </div>
      </div>
    </div>
  );
};
