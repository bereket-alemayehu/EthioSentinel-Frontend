/** Citizen-facing advisory display — friendly, detailed, structured. */

const SKIP_LINE =
  /^(AI anomaly|Current cases:|baseline mean|z-score|Suggested immediate actions:|This draft was generated|Source:|requires ADMIN review)/i;

export type AdvisoryContentBlock =
  | { kind: "heading"; text: string }
  | { kind: "paragraph"; text: string }
  | { kind: "list"; items: string[]; ordered: boolean };

export function publicAdvisoryTitle(title: string): string {
  return title
    .replace(/^AI\s*Draft:\s*/i, "")
    .replace(/\s*spike detected\s*/gi, " update ")
    .replace(/^Health advisory:\s*/i, "")
    .replace(/Health Advisory:\s*/i, "")
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
    if (SKIP_LINE.test(raw) || /z-score|baseline mean/i.test(raw)) continue;

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
