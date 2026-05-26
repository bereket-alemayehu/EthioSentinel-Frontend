import type { ReactNode } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import type { Advisory } from "../types";
import type { RiskLevel } from "@/shared/types";
import {
  openAdvisoryPrintDialog,
  shareAdvisoryNative,
  type AdvisorySharePayload,
} from "@/shared/utils/advisorySharing";
import {
  parsePublicAdvisoryBlocks,
  publicAdvisoryTitle,
  resolvePublicDiseaseLabel,
  type AdvisoryContentBlock,
} from "@/shared/utils/healthMessaging";

const RISK_CONFIG: Record<
  RiskLevel,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  CRITICAL: {
    label: "Critical",
    bg: "bg-red-50 dark:bg-red-950/30",
    text: "text-red-700 dark:text-red-400",
    border: "border-red-200 dark:border-red-800",
    dot: "bg-red-500",
  },
  HIGH: {
    label: "High",
    bg: "bg-orange-50 dark:bg-orange-950/30",
    text: "text-orange-700 dark:text-orange-400",
    border: "border-orange-200 dark:border-orange-800",
    dot: "bg-orange-500",
  },
  MODERATE: {
    label: "Moderate",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    text: "text-amber-700 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-800",
    dot: "bg-amber-500",
  },
  LOW: {
    label: "Low",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    text: "text-emerald-700 dark:text-emerald-400",
    border: "border-emerald-200 dark:border-emerald-800",
    dot: "bg-emerald-500",
  },
};

function buildPayload(item: Advisory, t: (k: string) => string): AdvisorySharePayload {
  const issued = item.createdAt
    ? new Date(item.createdAt).toLocaleString(undefined, {
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : t("recentAdvisory");
  const disease =
    resolvePublicDiseaseLabel(item.disease?.name, item.diseaseType, item.title) ||
    t("generalHealth");
  return {
    title: publicAdvisoryTitle(item.title),
    content: parsePublicAdvisoryBlocks(item.content)
      .map((b) =>
        b.kind === "list"
          ? b.items.map((it, i) => `${i + 1}. ${it}`).join("\n")
          : b.kind === "heading"
            ? `${b.text}:`
            : b.text,
      )
      .join("\n\n"),
    locationLabel: item.district?.name ?? item.region?.name ?? t("national"),
    diseaseLabel: disease,
    riskLevel: item.riskLevel,
    issuedAt: issued,
  };
}

function AdvisoryBody({ blocks }: { blocks: AdvisoryContentBlock[] }) {
  if (blocks.length === 0) return null;

  return (
    <div className="space-y-6 text-slate-700 dark:text-slate-300 leading-relaxed">
      {blocks.map((block, i) => {
        if (block.kind === "heading") {
          return (
            <h3
              key={i}
              className="text-base font-black uppercase tracking-wide text-teal-800 dark:text-teal-300 pt-2"
            >
              {block.text}
            </h3>
          );
        }
        if (block.kind === "list") {
          const ListTag = block.ordered ? "ol" : "ul";
          return (
            <ListTag
              key={i}
              className={
                block.ordered
                  ? "list-decimal list-outside pl-6 space-y-3 text-[16px] sm:text-[17px] font-medium"
                  : "list-disc list-outside pl-6 space-y-3 text-[16px] sm:text-[17px] font-medium"
              }
            >
              {block.items.map((item, j) => (
                <li key={j} className="pl-1 leading-[1.65]">
                  {item}
                </li>
              ))}
            </ListTag>
          );
        }
        return (
          <p
            key={i}
            className={`text-[16px] sm:text-[17px] font-medium leading-[1.75] ${
              i === 0
                ? "first-letter:text-3xl first-letter:font-bold first-letter:text-primary first-letter:mr-1.5"
                : ""
            }`}
          >
            {block.text}
          </p>
        );
      })}
    </div>
  );
}

interface AdvisoryArticlesProps {
  items: Advisory[];
  loading?: boolean;
  emptyHint?: ReactNode;
}

export function AdvisoryArticles({ items, loading, emptyHint }: AdvisoryArticlesProps) {
  const { t } = useTranslation();

  const handleShare = async (item: Advisory) => {
    const payload = buildPayload(item, t);
    const pageUrl =
      typeof window !== "undefined" ? `${window.location.origin}/advisory` : "";
    const result = await shareAdvisoryNative(payload, pageUrl);
    if (result === "shared") toast.success(t("shareSuccess"));
    else if (result === "clipboard") toast.success(t("linkCopiedShort"));
    else toast.error(t("shareUnavailable"));
  };

  const handlePdf = (item: Advisory) => {
    const payload = buildPayload(item, t);
    const ok = openAdvisoryPrintDialog(payload);
    if (!ok) {
      toast.error(t("popupBlocked"));
      return;
    }
    toast.info(t("printPdfHint"));
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-40 rounded-2xl bg-muted" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-border bg-card py-20 text-center">
        <span className="text-5xl opacity-40">📭</span>
        <p className="text-lg font-semibold text-foreground">{t("noApprovedAdvisories")}</p>
        <p className="text-sm text-muted-foreground max-w-sm">
          {emptyHint ?? t("noActiveAdvisoriesNow")}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full divide-y divide-border/60">
      {items.map((item) => {
        const cfg = RISK_CONFIG[item.riskLevel];
        const date = item.createdAt
          ? new Date(item.createdAt).toLocaleDateString(undefined, {
              month: "long",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : t("recentAdvisory");
        const diseaseLabel =
          resolvePublicDiseaseLabel(item.disease?.name, item.diseaseType, item.title) ||
          t("generalHealth");

        return (
          <article key={item.id} className="py-12 first:pt-0 group transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-xl">
                  🏥
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-foreground tracking-tight">
                    {t("ministryOfHealth")} • {t("verifiedAdvisory")}
                  </span>
                  <span className="text-[11px] text-muted-foreground uppercase font-black tracking-widest">
                    {date}
                  </span>
                </div>
              </div>
              <div
                className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-xs ${cfg.bg} ${cfg.text} ${cfg.border}`}
              >
                {item.riskLevel} {t("risk")}
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-[1.1] mb-2 tracking-tight group-hover:text-primary transition-colors">
                {publicAdvisoryTitle(item.title)}
              </h2>
              <div className="flex flex-wrap gap-2 items-center text-xs font-bold text-teal-700 dark:text-emerald-400">
                <span className="flex items-center gap-1">
                  📍 {item.district?.name || item.region?.name || t("national")}
                </span>
                <span>•</span>
                <span>🦠 {diseaseLabel}</span>
              </div>
            </div>

            <AdvisoryBody blocks={parsePublicAdvisoryBlocks(item.content)} />

            <div className="mt-10 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-4 text-muted-foreground">
                <button
                  type="button"
                  onClick={() => void handleShare(item)}
                  className="flex items-center gap-1.5 text-xs font-bold hover:text-primary transition-colors"
                >
                  <span>↗️</span> {t("share")}
                </button>
                <button
                  type="button"
                  onClick={() => handlePdf(item)}
                  className="flex items-center gap-1.5 text-xs font-bold hover:text-primary transition-colors"
                >
                  <span>⬇️</span> {t("downloadPdf")}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  {t("activeAdvisory")}
                </span>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
