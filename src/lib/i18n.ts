export type Language = "en" | "am" | "om";

export const languages: Array<{ code: Language; label: string }> = [
  { code: "en", label: "EN" },
  { code: "am", label: "አማ" },
  { code: "om", label: "AF" },
];

export const text = {
  en: {
    appName: "EthioHealth Sentinel",
    navCitizen: "Citizen Dashboard",
    navHew: "HEW Data Entry",
    navAdmin: "Admin Panel",
    language: "Language",
  },
  am: {
    appName: "ኢትዮ ጤና ሰንቲኔል",
    navCitizen: "የዜጎች ዳሽቦርድ",
    navHew: "የጤና ሰራተኛ መመዝገቢያ",
    navAdmin: "አስተዳዳሪ ፓነል",
    language: "ቋንቋ",
  },
  om: {
    appName: "EthioHealth Sentinel",
    navCitizen: "Daashboordii Lammiilee",
    navHew: "Galmee Hojjettuu Fayyaa",
    navAdmin: "Paanaalii Bulchiinsaa",
    language: "Afaan",
  },
} as const;
