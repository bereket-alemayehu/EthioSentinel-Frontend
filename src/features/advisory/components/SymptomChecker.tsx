import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Stethoscope,
} from "lucide-react";
import { cn } from "@/shared/utils/cn";
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

function riskTheme(level: SymptomResult["riskLevel"]) {
  if (level === "HIGH") {
    return {
      card: "border-red-300/80 bg-gradient-to-br from-red-50 via-white to-red-50/40 dark:from-red-950/40 dark:via-slate-900 dark:to-red-950/20 dark:border-red-800",
      badge: "bg-red-600 text-white shadow-sm shadow-red-900/20",
      icon: ShieldAlert,
      iconWrap: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
      advice: "text-slate-800 dark:text-slate-100",
    };
  }
  if (level === "MODERATE") {
    return {
      card: "border-amber-300/80 bg-gradient-to-br from-amber-50 via-white to-amber-50/40 dark:from-amber-950/40 dark:via-slate-900 dark:to-amber-950/20 dark:border-amber-800",
      badge: "bg-amber-600 text-white shadow-sm shadow-amber-900/20",
      icon: AlertTriangle,
      iconWrap:
        "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300",
      advice: "text-slate-800 dark:text-slate-100",
    };
  }
  return {
    card: "border-emerald-300/80 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/40 dark:from-emerald-950/40 dark:via-slate-900 dark:to-emerald-950/20 dark:border-emerald-800",
    badge: "bg-emerald-600 text-white shadow-sm shadow-emerald-900/20",
    icon: CheckCircle2,
    iconWrap:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300",
    advice: "text-slate-800 dark:text-slate-100",
  };
}

function SymptomResultCard({
  result,
  isAmharic,
}: {
  result: SymptomResult;
  isAmharic: boolean;
}) {
  const theme = riskTheme(result.riskLevel);
  const Icon = theme.icon;

  return (
    <article
      className={cn(
        "rounded-2xl border-2 p-5 sm:p-6 shadow-md ring-1 ring-black/5 dark:ring-white/10",
        theme.card,
      )}
      aria-live="polite"
    >
      <div className="flex flex-wrap items-start gap-4">
        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
            theme.iconWrap,
          )}
        >
          <Icon className="h-6 w-6" aria-hidden />
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                {isAmharic ? "የሚገመተ ሁኔታ" : "Likely condition"}
              </p>
              <h3 className="mt-1 text-xl sm:text-2xl font-black leading-tight text-slate-900 dark:text-white">
                {result.probableDisease}
              </h3>
            </div>
            <span
              className={cn(
                "inline-flex rounded-full px-3 py-1.5 text-xs font-black uppercase tracking-wide",
                theme.badge,
              )}
            >
              {result.riskLevel}
            </span>
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-white/90 px-4 py-3.5 dark:border-slate-700 dark:bg-slate-900/70">
            <p className="text-[11px] font-bold uppercase tracking-widest text-teal-700 dark:text-teal-400">
              {isAmharic ? "ምክር" : "What to do"}
            </p>
            <p
              className={cn(
                "mt-2 text-base sm:text-lg leading-relaxed font-medium",
                theme.advice,
              )}
            >
              {result.advice}
            </p>
          </div>

          <p className="rounded-lg bg-slate-100/90 px-3 py-2.5 text-xs sm:text-sm leading-relaxed text-slate-600 dark:bg-slate-800/80 dark:text-slate-400">
            {result.disclaimer}
          </p>
        </div>
      </div>
    </article>
  );
}

export function SymptomChecker() {
  const { t, i18n } = useTranslation();
  const [selected, setSelected] = useState<string[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const mutation = useSymptomCheckMutation();
  const loading = mutation.isPending;

  const lang = (i18n.language || "en").toString();
  const apiLang = lang.toLowerCase().startsWith("am") ? "AMHARIC" : "ENGLISH";
  const isAmharic = apiLang === "AMHARIC";

  const latestResult = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.sender === "bot") return m.result;
    }
    return null;
  }, [messages]);

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
    <section className="rounded-2xl border border-border/80 p-5 sm:p-6 bg-card text-card-foreground space-y-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300">
          <Stethoscope className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <h2 className="text-lg sm:text-xl font-bold">{t("aiSymptomChecker")}</h2>
          <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
            {t("symptomCheckerDesc")}
          </p>
        </div>
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

      {loading && (
        <div
          className="rounded-2xl border-2 border-dashed border-teal-200 bg-teal-50/50 px-5 py-8 text-center dark:border-teal-900 dark:bg-teal-950/20"
          aria-busy="true"
        >
          <p className="text-sm font-semibold text-teal-800 dark:text-teal-200">
            {isAmharic ? "ምልክቶችዎን በመተንተን ላይ…" : "Analyzing your symptoms…"}
          </p>
        </div>
      )}

      {!loading && latestResult && (
        <SymptomResultCard result={latestResult} isAmharic={isAmharic} />
      )}

      {messages.some((m) => m.sender === "user") && (
        <div className="space-y-2 max-h-40 overflow-auto pr-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {isAmharic ? "የእርስዎ ጥያቄ" : "Your check"}
          </p>
          {messages.map((message) =>
            message.sender === "user" ? (
              <div key={message.id} className="flex justify-end">
                <div className="max-w-[90%] rounded-2xl rounded-tr-sm bg-primary text-primary-foreground px-4 py-2 text-sm font-medium">
                  {message.text}
                </div>
              </div>
            ) : null,
          )}
        </div>
      )}
    </section>
  );
}
