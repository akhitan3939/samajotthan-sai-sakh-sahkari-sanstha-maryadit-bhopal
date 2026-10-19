import { InstallmentItem, LoanScheme, PenaltySettings, CalculationMethod } from '../types';

export const DEFAULT_SCHEMES: LoanScheme[] = [
  {
    id: 'scheme-50k',
    name: '₹50,000/- ऋण योजना (24 माह)',
    amount: 50000,
    interestRate: 14,
    tenureMonths: 24,
    interestType: 'reducing',
    description: 'लघु व्यक्तिगत/व्यवसाय ऋण, घटते क्रम किश्त में सुलभ देय।',
    popular: true,
  },
  {
    id: 'scheme-100k',
    name: '₹1,00,000/- ऋण योजना (24 माह)',
    amount: 100000,
    interestRate: 14,
    tenureMonths: 24,
    interestType: 'reducing',
    description: 'सामान्य साख ऋण, 14% वार्षिक दर, घटती किश्त व प्री-ईएमआई व्यवस्था।',
    popular: true,
  },
  {
    id: 'scheme-150k',
    name: '₹1,50,000/- ऋण योजना (24 माह)',
    amount: 150000,
    interestRate: 14,
    tenureMonths: 24,
    interestType: 'reducing',
    description: 'मध्यम व्यवसाय ऋण, 24 माह की घटती किश्तें।',
    popular: false,
  },
  {
    id: 'scheme-200k',
    name: '₹2,00,000/- ऋण योजना (24 माह)',
    amount: 200000,
    interestRate: 14,
    tenureMonths: 24,
    interestType: 'reducing',
    description: 'विशेष साख योजना, 24 महीने, त्वरित चेक अंतरण।',
    popular: true,
  },
  {
    id: 'scheme-350k',
    name: '₹3,50,000/- ऋण योजना (36 माह)',
    amount: 350000,
    interestRate: 14,
    tenureMonths: 36,
    interestType: 'reducing',
    description: 'दीर्घकालीन साख ऋण, 36 घटती मासिक किश्तें।',
    popular: false,
  },
  {
    id: 'scheme-400k',
    name: '₹4,00,000/- ऋण योजना (36 माह)',
    amount: 400000,
    interestRate: 14,
    tenureMonths: 36,
    interestType: 'reducing',
    description: 'अधिकतम साख सीमा, 36 माह की अवधि, 14% वार्षिक दर।',
    popular: true,
  },
];

export const DEFAULT_PENALTY_SETTINGS: PenaltySettings = {
  gracePeriodDays: 0, // देय तारीख से मिस हो जाने पर अगले दिन से चालू
  monthlyPenaltyRate: 2.0,
  fixedDailyPenalty: 2.6, // ₹2.60 प्रति दिन नियमानुसार
  penaltyMode: 'fixed_daily',
  shareCapitalRate: 0,
  processingFeeRate: 0,
};

// Standard Sanstha Disbursal Deduction defaults as requested
export const DEFAULT_DISBURSAL_CHARGES = {
  processingFee: 500, // ₹500 प्रोसेसिंग फीस (हर ऋण में समान)
  buildingFund: 300,  // ₹300 भवन निर्माण कोष (हर ऋण में समान)
  mandatoryAmanatRashi: 100, // ₹100 अनिवार्य अमानत राशि (लोन से अलग)
};

/**
 * Exact Pre-EMI amount per slab requested by Sanstha:
 * 50,000 -> 2,500
 * 1,00,000 -> 5,000
 * 1,50,000 -> 7,500
 * 2,00,000 -> 10,000
 * 3,50,000 -> 17,500
 * 4,00,000 -> 20,000
 */
export function getPreEmiForAmount(amount: number): number {
  if (amount === 50000) return 2500;
  if (amount === 100000) return 5000;
  if (amount === 150000) return 7500;
  if (amount === 200000) return 10000;
  if (amount === 350000) return 17500;
  if (amount === 400000) return 20000;
  return Math.round(amount * 0.05); // exactly 5%
}

/**
 * Calculates First / Indicative monthly EMI or installment
 */
export function calculateEmi(
  principal: number,
  annualRate: number,
  months: number,
  method: CalculationMethod | 'reducing' | 'flat' = 'reducing_installment'
): number {
  if (principal <= 0 || months <= 0) return 0;
  
  if (method === 'flat') {
    const totalInterest = principal * (annualRate / 100) * (months / 12);
    return Math.round((principal + totalInterest) / months);
  }

  // 1. घटते क्रम में किश्त (Reducing Installments: समान मूलधन + प्रथम माह का ब्याज)
  if (method === 'reducing_installment' || method === 'reducing') {
    const monthlyPrincipal = Math.round(principal / months);
    const firstMonthInterest = Math.round(principal * (annualRate / 12 / 100));
    return monthlyPrincipal + firstMonthInterest;
  }

  // 2. समान ईएमआई (Standard Reducing Balance formula)
  const monthlyRate = annualRate / 12 / 100;
  if (monthlyRate === 0) return Math.round(principal / months);

  const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
  return Math.round(emi);
}

/**
 * Calculate net cheque amount given to customer at disbursement
 * Processing Fee = ₹500 (fixed)
 * Building Fund = ₹300 (fixed)
 * Pre-EMI = 50k->2500, 100k->5000, 150k->7500, 350k->17500, 400k->20000
 * Example: 1,00,000 - 5,000 Pre-EMI - 500 Processing - 300 Building Fund = 94,200 Cheque!
 */
export function calculateNetDisbursedCheque(
  sanctionedAmount: number,
  preEmi?: number,
  processingFee: number = 500,
  buildingFund: number = 300,
  shareCapital: number = 0
): {
  sanctionedAmount: number;
  preEmi: number;
  processingFee: number;
  buildingFund: number;
  shareCapital: number;
  totalDeductions: number;
  netChequeAmount: number;
} {
  const effectivePreEmi = preEmi !== undefined ? preEmi : getPreEmiForAmount(sanctionedAmount);
  const totalDeductions = effectivePreEmi + processingFee + buildingFund + shareCapital;
  const netChequeAmount = Math.max(0, sanctionedAmount - totalDeductions);
  return {
    sanctionedAmount,
    preEmi: effectivePreEmi,
    processingFee,
    buildingFund,
    shareCapital,
    totalDeductions,
    netChequeAmount,
  };
}

/**
 * Add months to date string (YYYY-MM-DD)
 */
export function addMonths(dateStr: string, monthsToAdd: number): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  
  const currentDay = d.getDate();
  d.setMonth(d.getMonth() + monthsToAdd);
  if (d.getDate() !== currentDay) {
    d.setDate(0);
  }
  return d.toISOString().split('T')[0];
}

/**
 * Days difference between two dates
 */
export function getDaysDiff(pastDateStr: string, currentDateStr: string): number {
  const past = new Date(pastDateStr);
  const cur = new Date(currentDateStr);
  const diffTime = cur.getTime() - past.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Calculate late penalty: ₹2.60 per day starting next day of due date miss
 */
export function calculatePenalty(
  unpaidEmi: number,
  dueDate: string,
  asOfDate: string,
  settings: PenaltySettings = DEFAULT_PENALTY_SETTINGS
): { daysOverdue: number; penalty: number } {
  const totalDaysDiff = getDaysDiff(dueDate, asOfDate);
  if (totalDaysDiff <= 0) {
    return { daysOverdue: 0, penalty: 0 };
  }

  // Starts next day of due date: ₹2.60 per day
  const dailyRate = settings.fixedDailyPenalty || 2.6;
  const penalty = Math.round(totalDaysDiff * dailyRate * 10) / 10;

  return {
    daysOverdue: totalDaysDiff,
    penalty: Math.max(0, Math.round(penalty)),
  };
}

/**
 * Generate full EMI schedule table (supports 'reducing_installment' घटते क्रम किश्त)
 */
export function generateEmiSchedule(
  principal: number,
  annualRate: number,
  tenureMonths: number,
  method: CalculationMethod | 'reducing' | 'flat',
  startDate: string,
  settings: PenaltySettings = DEFAULT_PENALTY_SETTINGS,
  asOfDate: string = new Date().toISOString().split('T')[0],
  isPreEmiDeducted: boolean = false,
  preEmiAmount?: number
): InstallmentItem[] {
  const schedule: InstallmentItem[] = [];
  const monthlyRate = annualRate / 12 / 100;
  
  const standardEmi = calculateEmi(principal, annualRate, tenureMonths, 'reducing_balance');
  const baseMonthlyPrincipal = Math.floor(principal / tenureMonths);
  const principalRemainder = principal - (baseMonthlyPrincipal * tenureMonths);

  let remainingPrincipal = principal;

  for (let i = 1; i <= tenureMonths; i++) {
    const dueDate = addMonths(startDate, i);
    let principalPart = 0;
    let interestPart = 0;
    let totalEmiForMonth = 0;

    if (method === 'flat') {
      interestPart = Math.round((principal * (annualRate / 100) * (tenureMonths / 12)) / tenureMonths);
      principalPart = Math.round(principal / tenureMonths);
      totalEmiForMonth = principalPart + interestPart;
      remainingPrincipal = Math.max(0, remainingPrincipal - principalPart);
    } else if (method === 'reducing_balance') {
      interestPart = Math.round(remainingPrincipal * monthlyRate);
      principalPart = standardEmi - interestPart;
      if (i === tenureMonths || remainingPrincipal - principalPart < 0) {
        principalPart = remainingPrincipal;
      }
      totalEmiForMonth = principalPart + interestPart;
      remainingPrincipal = Math.max(0, remainingPrincipal - principalPart);
    } else {
      // 'reducing_installment' (घटते क्रम में किश्त / Equal Principal + Reducing Interest)
      interestPart = Math.round(remainingPrincipal * monthlyRate);
      principalPart = baseMonthlyPrincipal + (i === 1 ? principalRemainder : 0);
      if (i === tenureMonths || remainingPrincipal - principalPart < 0) {
        principalPart = remainingPrincipal;
      }
      totalEmiForMonth = principalPart + interestPart;
      remainingPrincipal = Math.max(0, remainingPrincipal - principalPart);
    }

    const { daysOverdue, penalty } = calculatePenalty(totalEmiForMonth, dueDate, asOfDate, settings);
    const isOverdue = daysOverdue > 0;

    // Check if Installment #1 is paid via Pre-EMI deduction at disbursal
    const isPaidByPreEmi = i === 1 && isPreEmiDeducted;
    const effectivePreEmi = preEmiAmount !== undefined ? preEmiAmount : getPreEmiForAmount(principal);

    schedule.push({
      installmentNo: i,
      dueDate,
      principal: principalPart,
      interest: interestPart,
      totalEmi: totalEmiForMonth,
      paidAmount: isPaidByPreEmi ? effectivePreEmi : 0,
      paidPrincipal: isPaidByPreEmi ? principalPart : 0,
      paidInterest: isPaidByPreEmi ? interestPart : 0,
      paidDate: isPaidByPreEmi ? startDate : undefined,
      paymentMode: isPaidByPreEmi ? 'bank_transfer' : undefined,
      receiptNo: isPaidByPreEmi ? 'PRE-EMI-DISB' : undefined,
      penalty: isPaidByPreEmi ? 0 : (isOverdue ? penalty : 0),
      daysOverdue: isPaidByPreEmi ? 0 : Math.max(0, daysOverdue),
      status: isPaidByPreEmi ? 'paid' : (isOverdue ? 'overdue' : 'pending'),
      onTimePayment: isPaidByPreEmi ? true : false,
      remarks: isPaidByPreEmi ? 'अग्रिम प्री-ईएमआई चेक में से काटी गई' : undefined,
    });
  }

  return schedule;
}

/**
 * Format Indian Currency (e.g. ₹ 1,50,000)
 */
export function formatCurrency(amount: number): string {
  if (isNaN(amount)) return '₹0';
  return '₹' + amount.toLocaleString('en-IN');
}

/**
 * Number to Hindi Words for official cooperative society receipts
 */
export function numberToHindiWords(num: number): string {
  if (!num || isNaN(num) || num <= 0) return 'शून्य रुपये मात्र';

  const units = ['', 'एक', 'दो', 'तीन', 'चार', 'पाँच', 'छह', 'सात', 'आठ', 'नौ', 'दस',
    'ग्यारह', 'बारह', 'तेरह', 'चौदह', 'पंद्रह', 'सोलह', 'सत्रह', 'अठारह', 'उन्नीस', 'बीस',
    'इक्कीस', 'बाईस', 'तेईस', 'चौबीस', 'पच्चीस', 'छब्बीस', 'सत्ताईस', 'अट्ठाईस', 'उनतीस', 'तीस',
    'इकतीस', 'बत्तीस', 'तैंतीस', 'चौंतीस', 'पैंतीस', 'छत्तीस', 'सैंतीस', 'अड़तीस', 'उनतालीस', 'चालीस',
    'इकतालीस', 'बयालीस', 'तैंतालीस', 'चवालीस', 'पैंतालीस', 'छियालीस', 'सैंतालीस', 'अड़तालीस', 'उनचास', 'पचास',
    'इक्यावन', 'बावन', 'तिरेपन', 'चौवन', 'पचपन', 'छप्पन', 'सत्तावन', 'अट्ठावन', 'उनसठ', 'साठ',
    'इकसठ', 'बासठ', 'तिरेसठ', 'चौंसठ', 'पैंसठ', 'छियासठ', 'सरसठ', 'अड़सठ', 'उनहत्तर', 'सत्तर',
    'इकहत्तर', 'बहत्तर', 'तिहत्तर', 'चौहत्तर', 'पचहत्तर', 'छिहत्तर', 'सतहत्तर', 'अठहत्तर', 'उनासी', 'अस्सी',
    'इक्यासी', 'बयासी', 'तिरासी', 'चौरासी', 'पचासी', 'छियासी', 'सत्तासी', 'अट्ठासी', 'नवासी', 'नब्बे',
    'इक्यानवे', 'बानवे', 'तिरानवे', 'चौरानवे', 'पंचानवे', 'छियानवे', 'सत्तानवे', 'अट्ठानवे', 'निन्यानवे'];

  let n = Math.floor(num);
  let words = '';

  // Crores
  const crores = Math.floor(n / 10000000);
  if (crores > 0) {
    words += (units[crores] || crores) + ' करोड़ ';
    n %= 10000000;
  }

  // Lakhs
  const lakhs = Math.floor(n / 100000);
  if (lakhs > 0) {
    words += (units[lakhs] || lakhs) + ' लाख ';
    n %= 100000;
  }

  // Thousands
  const thousands = Math.floor(n / 1000);
  if (thousands > 0) {
    words += (units[thousands] || thousands) + ' हजार ';
    n %= 1000;
  }

  // Hundreds
  const hundreds = Math.floor(n / 100);
  if (hundreds > 0) {
    words += (units[hundreds] || hundreds) + ' सौ ';
    n %= 100;
  }

  // Remainder (1-99)
  if (n > 0) {
    words += (units[n] || n) + ' ';
  }

  return words.trim() + ' रुपये मात्र';
}
