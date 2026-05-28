import { useState, type ReactNode } from "react";
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
  {
    label: string;
    bg: string;
    text: string;
    border: string;
    dot: string;
    accent: string;
    iconBg: string;
    icon: string;
    gradientFrom: string;
    gradientTo: string;
  }
> = {
  CRITICAL: {
    label: "Critical",
    bg: "bg-red-50 dark:bg-red-950/30",
    text: "text-red-700 dark:text-red-400",
    border: "border-red-200 dark:border-red-800",
    dot: "bg-red-500",
    accent: "bg-red-500",
    iconBg: "bg-red-100 dark:bg-red-900/40",
    icon: "🚨",
    gradientFrom: "from-red-500",
    gradientTo: "to-rose-600",
  },
  HIGH: {
    label: "High",
    bg: "bg-orange-50 dark:bg-orange-950/30",
    text: "text-orange-700 dark:text-orange-400",
    border: "border-orange-200 dark:border-orange-800",
    dot: "bg-orange-500",
    accent: "bg-orange-500",
    iconBg: "bg-orange-100 dark:bg-orange-900/40",
    icon: "⚠️",
    gradientFrom: "from-orange-500",
    gradientTo: "to-amber-600",
  },
  MODERATE: {
    label: "Moderate",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    text: "text-amber-700 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-800",
    dot: "bg-amber-500",
    accent: "bg-amber-500",
    iconBg: "bg-amber-100 dark:bg-amber-900/40",
    icon: "🔔",
    gradientFrom: "from-amber-500",
    gradientTo: "to-yellow-500",
  },
  LOW: {
    label: "Low",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    text: "text-emerald-700 dark:text-emerald-400",
    border: "border-emerald-200 dark:border-emerald-800",
    dot: "bg-emerald-500",
    accent: "bg-emerald-500",
    iconBg: "bg-emerald-100 dark:bg-emerald-900/40",
    icon: "✅",
    gradientFrom: "from-emerald-500",
    gradientTo: "to-teal-500",
  },
};

function advisoryBody(item: Advisory): string {
  return item.publicContent?.trim() || item.content;
}

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
    content: parsePublicAdvisoryBlocks(advisoryBody(item))
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
    <div className="space-y-5 text-slate-700 dark:text-slate-300 leading-relaxed">
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
                  ? "list-decimal list-outside pl-6 space-y-2.5 text-[15px] font-medium"
                  : "list-disc list-outside pl-6 space-y-2.5 text-[15px] font-medium"
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
          <p key={i} className="text-[15px] font-medium leading-[1.75]">
            {block.text}
          </p>
        );
      })}
    </div>
  );
}

/* ── Summary helper – extracts first paragraph text for the card preview ── */
function extractSummary(content: string, maxLen = 160): string {
  const blocks = parsePublicAdvisoryBlocks(content);
  for (const b of blocks) {
    if (b.kind === "paragraph" && b.text.length > 10) {
      return b.text.length > maxLen ? b.text.slice(0, maxLen).trimEnd() + "…" : b.text;
    }
  }
  // Fallback: just truncate raw content
  const clean = content.replace(/[#*_\->\n]+/g, " ").trim();
  return clean.length > maxLen ? clean.slice(0, maxLen).trimEnd() + "…" : clean;
}

/* ── Modal for expanded advisory details ── */
function AdvisoryModal({
  item,
  onClose,
  onShare,
  onPdf,
}: {
  item: Advisory;
  onClose: () => void;
  onShare: (item: Advisory) => void;
  onPdf: (item: Advisory) => void;
}) {
  const { t } = useTranslation();
  const cfg = RISK_CONFIG[item.riskLevel];
  const diseaseLabel =
    resolvePublicDiseaseLabel(item.disease?.name, item.diseaseType, item.title) ||
    t("generalHealth");
  const date = item.createdAt
    ? new Date(item.createdAt).toLocaleDateString(undefined, {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : t("recentAdvisory");

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gradient header */}
        <div
          className={`bg-gradient-to-r ${cfg.gradientFrom} ${cfg.gradientTo} px-8 py-6 text-white rounded-t-3xl`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{cfg.icon}</span>
              <span className="rounded-full bg-white/20 px-3 py-1 text-[11px] font-black uppercase tracking-widest">
                {item.riskLevel} {t("risk")}
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white transition hover:bg-white/30"
            >
              ✕
            </button>
          </div>
          <h2 className="text-xl sm:text-2xl font-black leading-tight tracking-tight">
            {publicAdvisoryTitle(item.title)}
          </h2>
          <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold text-white/80">
            <span className="flex items-center gap-1">📍 {item.district?.name || item.region?.name || t("national")}</span>
            <span>•</span>
            <span>🦠 {diseaseLabel}</span>
            <span>•</span>
            <span>📅 {date}</span>
          </div>
        </div>

        {/* Body */}
        <div className="px-8 py-6">
          <AdvisoryBody blocks={parsePublicAdvisoryBlocks(advisoryBody(item))} />

          {/* Actions */}
          <div className="mt-8 flex items-center gap-3 border-t border-border pt-5">
            <button
              type="button"
              onClick={() => onShare(item)}
              className="flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-xs font-bold text-foreground transition hover:bg-muted"
            >
              <span>↗️</span> {t("share")}
            </button>
            <button
              type="button"
              onClick={() => onPdf(item)}
              className="flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-xs font-bold text-foreground transition hover:bg-muted"
            >
              <span>⬇️</span> {t("downloadPdf")}
            </button>
            <div className="ml-auto flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                {t("activeAdvisory")}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Main card component ── */
interface AdvisoryArticlesProps {
  items: Advisory[];
  loading?: boolean;
  emptyHint?: ReactNode;
}

export function AdvisoryArticles({ items, loading, emptyHint }: AdvisoryArticlesProps) {
  const { t } = useTranslation();
  const [expandedId, setExpandedId] = useState<number | null>(null);

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
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 animate-pulse">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-64 rounded-2xl bg-muted" />
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

  const expandedItem = expandedId != null ? items.find((i) => i.id === expandedId) ?? null : null;

  return (
    <>
      {/* Card grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const cfg = RISK_CONFIG[item.riskLevel];
          const date = item.createdAt
            ? new Date(item.createdAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : t("recentAdvisory");
          const diseaseLabel =
            resolvePublicDiseaseLabel(item.disease?.name, item.diseaseType, item.title) ||
            t("generalHealth");
          const summary = extractSummary(advisoryBody(item));

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setExpandedId(item.id)}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card text-left shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 hover:border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {/* Colored accent strip at top */}
              <div className={`h-1.5 w-full bg-gradient-to-r ${cfg.gradientFrom} ${cfg.gradientTo}`} />

              {/* Card body */}
              <div className="flex flex-1 flex-col p-5">
                {/* Header row: icon + risk badge */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${cfg.iconBg} text-xl`}>
                    {cfg.icon}
                  </div>
                  <div
                    className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest border ${cfg.bg} ${cfg.text} ${cfg.border}`}
                  >
                    {cfg.label}
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-base font-bold text-foreground leading-snug tracking-tight mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                  {publicAdvisoryTitle(item.title)}
                </h3>

                {/* Summary */}
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 mb-4 flex-1">
                  {summary}
                </p>

                {/* Tags row */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
                    📍 {item.district?.name || item.region?.name || t("national")}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
                    🦠 {diseaseLabel}
                  </span>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-border pt-3">
                  <div className="flex items-center gap-2">
                    <div className={`h-1.5 w-1.5 rounded-full ${cfg.dot} animate-pulse`} />
                    <span className="text-[11px] font-semibold text-muted-foreground">{date}</span>
                  </div>
                  <span className="text-[11px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    {t("read") || "Read more"} →
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Expanded modal */}
      {expandedItem && (
        <AdvisoryModal
          item={expandedItem}
          onClose={() => setExpandedId(null)}
          onShare={(item) => void handleShare(item)}
          onPdf={handlePdf}
        />
      )}
    </>
  );
}
