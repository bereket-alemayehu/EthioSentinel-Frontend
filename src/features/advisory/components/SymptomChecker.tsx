import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSymptomCheckMutation } from "../hooks/useAdvisory";
import type { SymptomResult } from "../types";


type ChatMessage =
  | { id: string; sender: "user"; text: string }
  | { id: string; sender: "bot"; result: SymptomResult };

const SYMPTOMS = [
  "Fever",
  "Cough",
  "Diarrhea",
  "Vomiting",
  "Headache",
  "Body pain",
  "Fatigue",
  "Sore throat",
] as const;

function riskClass(level: SymptomResult["riskLevel"]) {
  if (level === "HIGH") return "bg-red-100 text-red-700 font-bold";
  if (level === "MODERATE") return "bg-amber-100 text-amber-700 font-bold";
  return "bg-emerald-100 text-emerald-700 font-bold";
}

export function SymptomChecker() {
  const { t, i18n } = useTranslation();
  const [selected, setSelected] = useState<string[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const mutation = useSymptomCheckMutation();
  const loading = mutation.isPending;
  const language = i18n.language === "am" ? "AMHARIC" : "ENGLISH";

  const lang = (i18n.language || 'en').toString();
  const apiLang = lang.toLowerCase().startsWith('am') ? 'AMHARIC' : 'ENGLISH';

  const userPreview = useMemo(
    () =>
      selected.length === 0 
        ? (apiLang === "AMHARIC" ? "ምልክት አልተመረጠም" : "No symptoms selected") 
        : selected.join(", "),
    [selected, apiLang],
  );

  const toggleSymptom = (symptom: string) => {
    setSelected((prev) =>
      prev.includes(symptom)
        ? prev.filter((item) => item !== symptom)
        : [...prev, symptom],
    );
  };

  const submit = async () => {
    if (selected.length === 0 || loading) return;

    const userMessage: ChatMessage = {
      id: `${Date.now()}-u`,
      sender: "user",
      text: `${apiLang === "AMHARIC" ? "ምልክቶች፦" : "Symptoms:"} ${selected.join(", ")}`,
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const data = await mutation.mutateAsync({ 
        symptoms: selected,
        language: apiLang
      });

      const botMessage: ChatMessage = {
        id: `${Date.now()}-b`,
        sender: "bot",
        result: data,
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch {
      const botMessage: ChatMessage = {
        id: `${Date.now()}-e`,
        sender: "bot",
        result: {
          selectedSymptoms: selected,
          probableDisease: apiLang === "AMHARIC" ? "አልተገኘም" : "Unavailable",
          riskLevel: "LOW",
          advice: apiLang === "AMHARIC" 
            ? "የምልክት መመርመሪያ አገልግሎቱን ማግኘት አልተቻለም። እባክዎ እንደገና ይሞክሩ።"
            : "Unable to reach symptom checker service. Please try again.",
          disclaimer: apiLang === "AMHARIC"
            ? "ይህ የምልክት ምርመራ ለመመሪያ ብቻ ነው፤ የሕክምና ምርመራ አይደለም።"
            : "This symptom checker is for guidance only and is not a medical diagnosis.",
          language: apiLang,
        },
      };
      setMessages((prev) => [...prev, botMessage]);
    }
  };

  const SYMPTOMS_MAP: Record<string, string> = {
    Fever: "ትኩሳት",
    Cough: "ሳል",
    Diarrhea: "ተቅማጥ",
    Vomiting: "ትውከት",
    Headache: "ራስ ምታት",
    "Body pain": "የሰውነት ህመም",
    Fatigue: "ድካም",
    "Sore throat": "የጉሮሮ ህመም",
  };

  return (
    <section className="rounded-lg border p-4 bg-card text-card-foreground space-y-4">
      <div>
        <h2 className="text-lg font-semibold">{t("aiSymptomChecker")}</h2>
        <p className="text-sm text-muted-foreground">
          {t("symptomCheckerDesc")}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {SYMPTOMS.map((symptom) => {
          const active = selected.includes(symptom);
          return (
            <button
              key={symptom}
              type="button"
              onClick={() => toggleSymptom(symptom)}
              className={`rounded-full px-3 py-1.5 text-sm border transition ${
                active
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-foreground border-border"
              }`}
            >
              {apiLang === "AMHARIC" ? SYMPTOMS_MAP[symptom] || symptom : symptom}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void submit()}
          disabled={selected.length === 0 || loading}
          className="rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50 font-medium transition active:scale-95"
        >
          {loading 
            ? (apiLang === "AMHARIC" ? "በመፈተሽ ላይ..." : "Checking...") 
            : (apiLang === "AMHARIC" ? "ምልክቶችን ፈትሽ" : t("symptomCheck"))}
        </button>
        <span className="text-xs text-muted-foreground">{userPreview}</span>
      </div>

      <div className="space-y-3 max-h-96 overflow-auto pr-1">
        {messages.map((message) =>
          message.sender === "user" ? (
            <div key={message.id} className="flex justify-end">
              <div className="max-w-[90%] rounded-2xl rounded-tr-none bg-primary text-primary-foreground px-3 py-2 text-sm">
                {message.text}
              </div>
            </div>
          ) : (
            <div key={message.id} className="flex justify-start">
              <div className="max-w-[92%] rounded-2xl rounded-tl-none border bg-background px-3 py-3 text-sm space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold">
                    {message.result.probableDisease}
                  </p>
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${riskClass(message.result.riskLevel)}`}
                  >
                    {message.result.riskLevel}
                  </span>
                </div>
                <p className="text-muted-foreground">{message.result.advice}</p>
                <p className="text-xs text-muted-foreground border-t pt-2">
                  {message.result.disclaimer}
                </p>
              </div>
            </div>
          ),
        )}
      </div>
    </section>
  );
}
