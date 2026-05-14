/**
 * Google reCAPTCHA v2 **test** site key (always passes when verified with the matching test secret).
 * Use only for local dev when `VITE_RECAPTCHA_SITE_KEY` is unset.
 * @see https://developers.google.com/recaptcha/docs/faq#id-like-to-run-automated-tests-with-recaptcha-v2-what-should-i-do
 */
export const RECAPTCHA_V2_TEST_SITEKEY =
  "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI";

/** Public reCAPTCHA site key for the browser widget. */
export function getRecaptchaSiteKey(): string {
  const fromEnv = import.meta.env.VITE_RECAPTCHA_SITE_KEY?.trim();
  if (fromEnv) return fromEnv;
  if (import.meta.env.DEV) return RECAPTCHA_V2_TEST_SITEKEY;
  return "";
}
