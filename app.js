// data.js - ALL 16 BOTSWANA INSURANCE PRODUCTS
window.allProducts = [
  {
    id: 1,
    name: "Boago Funeral Plan",
    category: "funeral",
    company: { name: "Liberty Life Botswana (Pty) Limited" },
    sum_assured: "P10,000-P50,000",
    premiums: [{monthly_premium: 43}, {monthly_premium: 70}, {monthly_premium: 98}, {monthly_premium: 154}],
    waiting_period_natural: "6 months",
    waiting_period_accidental: "immediate",
    key_features: ["Two plan options", "Family cover", "Double accidental death benefit"],
    annual_limit: null,
    co_payment: null
  },
  {
    id: 2,
    name: "Hospital Cash Back Benefit",
    category: "hospital_cash",
    company: { name: "Liberty Life Botswana (Pty) Limited" },
    sum_assured: "Daily benefit up to P1000",
    premiums: [{monthly_premium: 49}, {monthly_premium: 79}, {monthly_premium: 167}, {monthly_premium: 314}],
    waiting_period_natural: "6 months",
    waiting_period_accidental: "immediate",
    key_features: ["Daily cash for hospital stays", "Family cover", "Double ICU payout"],
    annual_limit: null,
    co_payment: null
  },
  {
    id: 3,
    name: "Mothusi Life Cover - Lifeline",
    category: "life",
    company: { name: "Metropolitan Life Botswana" },
    sum_assured: "BWP 200,000 to 10,000,000",
    premiums: [],
    waiting_period_natural: "No waiting period",
    key_features: ["Whole life cover", "Accidental Death Cover", "Cash-Back Benefit"],
    annual_limit: null,
    co_payment: null
  },
  {
    id: 4,
    name: "Mothusi Life Cover - Term Shield",
    category: "life",
    company: { name: "Metropolitan Life Botswana" },
    sum_assured: "BWP 200,000 to 10,000,000",
    premiums: [],
    waiting_period_natural: "No waiting period",
    key_features: ["Fixed term cover", "Accidental Death Cover", "Cash-Back Benefit"],
    annual_limit: null,
    co_payment: null
  },
  {
    id: 5,
    name: "Mothusi Life Cover - Home Secure",
    category: "life",
    company: { name: "Metropolitan Life Botswana" },
    sum_assured: "Up to BWP 2,500,000",
    premiums: [],
    waiting_period_natural: "No waiting period",
    key_features: ["Mortgage protection", "No medical underwriting", "Accidental Death Cover"],
    annual_limit: null,
    co_payment: null
  },
  {
    id: 6,
    name: "Diamond",
    category: "medical",
    company: { name: "Botsogo Health Plan" },
    annual_limit: 2215000,
    premiums: [],
    co_payment: "Diamond 10 attracts 10% co-payment",
    hospital_network: "Private Ward; May obtain service in RSA",
    waiting_period_natural: "9 months for maternity",
    key_features: ["High annual limit", "Private ward access", "South Africa coverage"],
    sum_assured: null
  },
  {
    id: 7,
    name: "Platinum",
    category: "medical",
    company: { name: "Botsogo Health Plan" },
    annual_limit: 1448000,
    premiums: [],
    co_payment: "Platinum 10 attracts 10% co-payment",
    hospital_network: "General medical and surgical wards",
    waiting_period_natural: "Standard industry periods apply",
    key_features: ["Good coverage", "General ward access"],
    sum_assured: null
  },
  {
    id: 8,
    name: "Ruby",
    category: "medical",
    company: { name: "Botsogo Health Plan" },
    annual_limit: 1105000,
    premiums: [],
    co_payment: "Ruby 10 attracts 10% co-payment",
    hospital_network: "General medical and surgical wards",
    waiting_period_natural: "Standard industry periods apply",
    key_features: ["Basic coverage", "General ward access"],
    sum_assured: null
  },
  {
    id: 9,
    name: "Bronze",
    category: "medical",
    company: { name: "Botsogo Health Plan" },
    annual_limit: 169000,
    premiums: [],
    co_payment: "Standard 10% co-payment",
    hospital_network: "General medical and surgical wards only",
    waiting_period_natural: "Standard industry periods apply",
    key_features: ["Basic coverage", "Local coverage only"],
    sum_assured: null
  },
  {
    id: 10,
    name: "Standard Benefit Option",
    category: "medical",
    company: { name: "Botswana Public Officers Medical Aid Scheme (BPOMAS)" },
    annual_limit: 30000,
    premiums: [
      {min_salary: 0, max_salary: 3500, monthly_premium: 101},
      {min_salary: 3501, max_salary: 5500, monthly_premium: 251},
      {min_salary: 5501, max_salary: 8000, monthly_premium: 251},
      {min_salary: 8001, max_salary: null, monthly_premium: 251}
    ],
    co_payment: "No 10% co-payment",
    hospital_network: "Government and private hospitals",
    waiting_period_natural: "9 months for maternity",
    key_features: ["Government rates", "Basic coverage"],
    sum_assured: null
  },
  {
    id: 11,
    name: "High Benefit Option",
    category: "medical",
    company: { name: "Botswana Public Officers Medical Aid Scheme (BPOMAS)" },
    annual_limit: 150000,
    premiums: [
      {min_salary: 0, max_salary: 3500, monthly_premium: 448},
      {min_salary: 3501, max_salary: 5500, monthly_premium: 577},
      {min_salary: 5501, max_salary: 8000, monthly_premium: 676},
      {min_salary: 8001, max_salary: null, monthly_premium: 711}
    ],
    co_payment: "10% co-payment",
    hospital_network: "Government and private hospitals",
    waiting_period_natural: "9 months for maternity",
    key_features: ["Enhanced coverage", "Private hospital access"],
    sum_assured: null
  },
  {
    id: 12,
    name: "Premium Benefit Option",
    category: "medical",
    company: { name: "Botswana Public Officers Medical Aid Scheme (BPOMAS)" },
    annual_limit: 200000,
    premiums: [
      {min_salary: 0, max_salary: 3500, monthly_premium: 710},
      {min_salary: 3501, max_salary: 5500, monthly_premium: 913},
      {min_salary: 5501, max_salary: 8000, monthly_premium: 1066},
      {min_salary: 8001, max_salary: null, monthly_premium: 1124}
    ],
    co_payment: "10% co-payment",
    hospital_network: "Government and private hospitals",
    waiting_period_natural: "9 months for maternity",
    key_features: ["Premium coverage", "Best benefits"],
    sum_assured: null
  },
  {
    id: 13,
    name: "Executive",
    category: "medical",
    company: { name: "Pula Medical Aid Fund (Pulamed)" },
    annual_limit: 2300000,
    premiums: [
      {min_salary: 0, max_salary: 10000, monthly_premium: 1391},
      {min_salary: 10001, max_salary: 20000, monthly_premium: 1547},
      {min_salary: 20001, max_salary: 30000, monthly_premium: 1693},
      {min_salary: 30001, max_salary: 1000000, monthly_premium: 1845}
    ],
    co_payment: "10% for out-patient services",
    hospital_network: "All private hospitals in Botswana and RSA",
    waiting_period_natural: "3 months general, 9 months maternity",
    key_features: ["Highest coverage", "RSA access", "Comprehensive"],
    sum_assured: null
  },
  {
    id: 14,
    name: "Deluxe",
    category: "medical",
    company: { name: "Pula Medical Aid Fund (Pulamed)" },
    annual_limit: 1000000,
    premiums: [
      {min_salary: 0, max_salary: 10000, monthly_premium: 1064},
      {min_salary: 10001, max_salary: 20000, monthly_premium: 1184},
      {min_salary: 20001, max_salary: 30000, monthly_premium: 1300},
      {min_salary: 30001, max_salary: 1000000, monthly_premium: 1417}
    ],
    co_payment: "10% for out-patient services",
    hospital_network: "All private hospitals in Botswana",
    waiting_period_natural: "3 months general, 9 months maternity",
    key_features: ["Great coverage", "Private hospitals", "Good value"],
    sum_assured: null
  },
  {
    id: 15,
    name: "Galaxy",
    category: "medical",
    company: { name: "Pula Medical Aid Fund (Pulamed)" },
    annual_limit: 125000,
    premiums: [
      {min_salary: 0, max_salary: 5000, monthly_premium: 425},
      {min_salary: 5001, max_salary: 10000, monthly_premium: 472},
      {min_salary: 10001, max_salary: 1000000, monthly_premium: 521}
    ],
    co_payment: "10% for all services",
    hospital_network: "Public Hospitals and DSPs",
    waiting_period_natural: "3 months general, 9 months maternity",
    key_features: ["Budget option", "Basic coverage", "Affordable"],
    sum_assured: null
  },
  {
    id: 16,
    name: "Flexi",
    category: "medical",
    company: { name: "Pula Medical Aid Fund (Pulamed)" },
    annual_limit: 50000,
    premiums: [
      {min_salary: 0, max_salary: 1000000, monthly_premium: 250}
    ],
    co_payment: "25% for out-patient visits",
    hospital_network: "Public Hospitals and mission hospitals",
    waiting_period_natural: "3 months general, 12 months specialized",
    key_features: ["Most affordable", "Basic care", "Entry level"],
    sum_assured: null
  }
];

console.log("✅ Loaded all 16 Botswana insurance products");