/** Citizen-facing advisory display — friendly, detailed, structured. */

const SKIP_LINE =
  /^(AI\s*Draft|AI anomaly|Current cases:|Historical|baseline|z-score|std dev|classification:|Suggested immediate actions:|This draft was generated|Source:|requires ADMIN review|spike detected)/i;

export type AdvisoryContentBlock =
  | { kind: "heading"; text: string }
  | { kind: "paragraph"; text: string }
  | { kind: "list"; items: string[]; ordered: boolean };

export function publicAdvisoryTitle(title: string): string {
  return title
    .replace(/^AI\s*Draft:\s*/i, "")
    .replace(/\s*[-–]?\s*spike detected\s*/gi, " ")
    .replace(/\s*\(z-?score[^)]*\)/gi, "")
    .replace(/\bbaseline\s+cases?\b/gi, "")
    .replace(/^Health advisory:\s*/i, "")
    .replace(/Health Advisory:\s*/i, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function cleanLine(line: string): string {
  return line
    .replace(/^AI anomaly signal detected for/i, "Health officials are monitoring")
    .replace(/Current cases:\s*\d+[^.]*\.?/gi, "")
    .replace(/baseline mean:[^.\n]*/gi, "")
    .replace(/z-score:[^.\n]*/gi, "")
    .replace(/This draft was generated automatically.*$/i, "")
    .replace(/^\d+\.\s*/, "")
    .replace(/^\d+\)\s*/, "")
    .replace(/^[-•*]\s*/, "")
    .trim();
}

export function parsePublicAdvisoryBlocks(content: string): AdvisoryContentBlock[] {
  const lines = content.split("\n").map((l) => l.trim());
  const blocks: AdvisoryContentBlock[] = [];
  let listItems: string[] = [];
  let listOrdered = true;

  const flushList = () => {
    if (listItems.length === 0) return;
    blocks.push({ kind: "list", items: [...listItems], ordered: listOrdered });
    listItems = [];
  };

  for (const raw of lines) {
    if (!raw) {
      flushList();
      continue;
    }
    if (
      SKIP_LINE.test(raw) ||
      /z-score|baseline mean|anomaly detection|AI draft|std dev/i.test(raw)
    ) {
      continue;
    }

    const numbered = raw.match(/^(\d+)[.)]\s+(.+)$/);
    const bullet = raw.match(/^[-•*]\s+(.+)$/);

    if (numbered) {
      listOrdered = true;
      listItems.push(cleanLine(numbered[2]));
      continue;
    }
    if (bullet) {
      listOrdered = false;
      listItems.push(cleanLine(bullet[1]));
      continue;
    }

    flushList();
    const text = cleanLine(raw);
    if (!text) continue;

    if (text.endsWith(":") && text.length < 80) {
      blocks.push({ kind: "heading", text: text.replace(/:$/, "") });
    } else {
      blocks.push({ kind: "paragraph", text });
    }
  }

  flushList();
  return blocks;
}

/** @deprecated Use parsePublicAdvisoryBlocks for rich layout */
export function publicAdvisoryParagraphs(content: string): string[] {
  return parsePublicAdvisoryBlocks(content)
    .filter((b): b is { kind: "paragraph"; text: string } => b.kind === "paragraph")
    .map((b) => b.text);
}

/** Strip technical jargon from chatbot replies before display. */
export function sanitizeChatReply(text: string): string {
  return text
    .split("\n")
    .map((line) =>
      line
        .replace(/\bz-?score\b/gi, "unusual increase")
        .replace(/\banomaly detection\b/gi, "illness monitoring")
        .replace(/\banomaly signal\b/gi, "health update")
        .replace(/\bbaseline mean\b/gi, "usual level")
        .replace(/\bAI draft\b/gi, "")
        .trim(),
    )
    .filter((line) => line.length > 0)
    .join("\n")
    .replace(/\badvisory\b/gi, "health guidance")
    .replace(/\badvisories\b/gi, "health updates")
    .trim();
}

export function resolvePublicDiseaseLabel(
  diseaseName?: string | null,
  diseaseType?: string | null,
  title?: string | null,
): string {
  if (diseaseName?.trim()) return diseaseName.trim();
  if (diseaseType?.trim()) return diseaseType.trim();
  const m = (title ?? "").match(/:\s*([^:]+?)(?:\s+Health Advisory|\s+in\s+)/i);
  if (m?.[1]) return m[1].replace(/^AI\s*Draft:\s*/i, "").trim();
  return "";
}
