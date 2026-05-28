export type AdvisorySharePayload = {
  title: string;
  content: string;
  locationLabel?: string;
  diseaseLabel?: string;
  riskLevel?: string;
  issuedAt?: string;
};

function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Opens a print dialog so the user can save as PDF (browser "Save as PDF"). */
export function openAdvisoryPrintDialog(payload: AdvisorySharePayload): boolean {
  // Do not use noopener/noreferrer: some browsers leave the tab as about:blank because
  // the opener cannot write to the document reliably.
  const w = window.open('', '_blank', 'width=900,height=1200,scrollbars=yes');
  if (!w) return false;

  const meta = [
    payload.locationLabel && `Location: ${payload.locationLabel}`,
    payload.diseaseLabel && `Disease: ${payload.diseaseLabel}`,
    payload.riskLevel && `Risk: ${payload.riskLevel}`,
    payload.issuedAt && `Issued: ${payload.issuedAt}`,
  ]
    .filter(Boolean)
    .join(' • ');

  const paragraphs = payload.content
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
  const bodyHtml =
    paragraphs.length > 0
      ? paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join('')
      : `<p>${escapeHtml(payload.content.trim())}</p>`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>${escapeHtml(payload.title)}</title>
  <style>
    body { font-family: system-ui, "Noto Sans Ethiopic", sans-serif; padding: 24mm; max-width: 880px; margin: 0 auto; line-height: 1.55; color: #111; }
    h1 { font-size: 22px; margin: 0 0 12px 0; }
    .meta { font-size: 12px; color: #444; margin-bottom: 20px; }
    .body { font-size: 14px; }
    .body p { margin: 0 0 12px 0; }
    @media print {
      body { padding: 0; }
      @page { margin: 16mm; }
    }
  </style>
</head>
<body>
  <h1>${escapeHtml(payload.title)}</h1>
  ${meta ? `<p class="meta">${escapeHtml(meta)}</p>` : ''}
  <div class="body">${bodyHtml}</div>
  <script>
    function finish() {
      try {
        window.focus();
        window.print();
      } catch (e) {}
      setTimeout(function() { try { window.close(); } catch (e2) {} }, 800);
    }
    if (document.readyState === 'complete') setTimeout(finish, 100);
    else window.addEventListener('load', function() { setTimeout(finish, 100); });
  </script>
</body>
</html>`;

  try {
    w.document.open();
    w.document.write(html);
    w.document.close();
  } catch {
    w.close();
    return false;
  }
  return true;
}

export async function shareAdvisoryNative(
  payload: AdvisorySharePayload,
  pageUrl: string,
): Promise<'shared' | 'clipboard' | 'unavailable'> {
  const excerpt =
    payload.content.length > 800
      ? `${payload.content.slice(0, 800)}…`
      : payload.content;
  const text = `${payload.title}\n\n${excerpt}`;

  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ title: payload.title, text, url: pageUrl });
      return 'shared';
    } catch (e: unknown) {
      if (
        typeof e !== 'undefined' &&
        typeof (e as { name?: string }).name === 'string' &&
        (e as { name: string }).name === 'AbortError'
      ) {
        return 'unavailable';
      }
    }
  }

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(`${payload.title}\n\n${pageUrl}`);
      return 'clipboard';
    }
  } catch {
    /* fall through */
  }

  try {
    const ta = document.createElement('textarea');
    ta.value = `${payload.title}\n\n${pageUrl}`;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    return 'clipboard';
  } catch {
    return 'unavailable';
  }
}
