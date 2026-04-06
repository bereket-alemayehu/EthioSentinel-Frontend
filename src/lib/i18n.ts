import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

export type Language = "en" | "am";

export const languages: Array<{ code: Language; label: string }> = [
  { code: "en", label: "EN" },
  { code: "am", label: "አማ" },
];

const resources = {
  en: {
    translation: {
      appName: "EthioHealth Sentinel",
      navCitizen: "Citizen Dashboard",
      navHew: "HEW Data Entry",
      navAdmin: "Admin Panel",
      language: "Language",
      dashboard: "Dashboard",
      citizenService: "Citizen Service",
      healthWorker: "Health Worker",
      adminPanel: "Admin Panel",
      logout: "Log out",
      profile: "Profile",
      settings: "Settings",
      login: "Login",
      searchPlaceholder: "Search reports or health info...",
      notifications: "Notifications",
    },
  },
  am: {
    translation: {
      appName: "ኢትዮ ጤና ሰንቲኔል",
      navCitizen: "የዜጎች ዳሽቦርድ",
      navHew: "የጤና ሰራተኛ መመዝገቢያ",
      navAdmin: "አስተዳዳሪ ፓነል",
      language: "ቋንቋ",
      dashboard: "ዳሽቦርድ",
      citizenService: "የዜጎች አገልግሎት",
      healthWorker: "የጤና ሰራተኛ",
      adminPanel: "የአስተዳዳሪ ፓነል",
      logout: "ውጣ",
      profile: "ፕሮፋይል",
      settings: "ቅንብሮች",
      login: "ግባ",
      searchPlaceholder: "ሪፖርቶችን ወይም የጤና መረጃዎችን ይፈልጉ...",
      notifications: "ማሳወቂያዎች",
    },
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
    },
  });

export default i18n;
