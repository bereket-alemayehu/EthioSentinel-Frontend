/**
 * Google reCAPTCHA v2 test site key (pairs with test secret on backend).
 * @see https://developers.google.com/recaptcha/docs/faq#id-like-to-run-automated-tests-with-recaptcha-v2-what-should-i-do
 */
export const RECAPTCHA_V2_TEST_SITEKEY =
  "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL?.trim() || "http://localhost:5001";

let cachedRemoteSiteKey: string | null = null;

export function isRecaptchaTestSiteKey(key: string): boolean {
  return key.trim() === RECAPTCHA_V2_TEST_SITEKEY;
}

/** Site key from Vite env only (sync). */
export function getRecaptchaSiteKeyFromEnv(): string {
  const fromEnv = import.meta.env.VITE_RECAPTCHA_SITE_KEY?.trim() ?? "";
  if (fromEnv) return fromEnv;
  if (import.meta.env.DEV && import.meta.env.VITE_RECAPTCHA_ALLOW_TEST === "true") {
    return RECAPTCHA_V2_TEST_SITEKEY;
  }
  return "";
}

/** Prefer Vite env; otherwise load once from backend `RECAPTCHA_SITE_KEY`. */
export async function resolveRecaptchaSiteKey(): Promise<string> {
  const fromEnv = getRecaptchaSiteKeyFromEnv();
  if (fromEnv && !isRecaptchaTestSiteKey(fromEnv)) {
    return fromEnv;
  }
  if (fromEnv && isRecaptchaTestSiteKey(fromEnv)) {
    return fromEnv;
  }
  if (cachedRemoteSiteKey) return cachedRemoteSiteKey;

  try {
    const res = await fetch(`${API_BASE}/api/config/public`);
    if (!res.ok) return fromEnv;
    const json = (await res.json()) as {
      data?: { recaptchaSiteKey?: string };
    };
    const remote = json?.data?.recaptchaSiteKey?.trim() ?? "";
    if (remote) {
      cachedRemoteSiteKey = remote;
      return remote;
    }
  } catch {
    // Backend down or offline — fall through
  }

  return fromEnv;
}

/** @deprecated Use `resolveRecaptchaSiteKey` or `useRecaptchaSiteKey`. */
export function getRecaptchaSiteKey(): string {
  return getRecaptchaSiteKeyFromEnv() || cachedRemoteSiteKey || "";
}
