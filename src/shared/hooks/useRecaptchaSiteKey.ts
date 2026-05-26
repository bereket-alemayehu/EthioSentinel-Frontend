import { useEffect, useState } from "react";
import {
  getRecaptchaSiteKeyFromEnv,
  isRecaptchaTestSiteKey,
  resolveRecaptchaSiteKey,
} from "@/shared/lib/recaptcha";

export function useRecaptchaSiteKey() {
  const envKey = getRecaptchaSiteKeyFromEnv();
  const [siteKey, setSiteKey] = useState(envKey);
  const [loading, setLoading] = useState(!envKey);
  const [ready, setReady] = useState(Boolean(envKey));

  useEffect(() => {
    if (envKey) {
      setReady(true);
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      const key = await resolveRecaptchaSiteKey();
      if (cancelled) return;
      if (key) {
        setSiteKey((prev) => (prev === key ? prev : key));
        setReady(true);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [envKey]);

  const isTestKey = siteKey ? isRecaptchaTestSiteKey(siteKey) : false;
  const isConfigured = Boolean(siteKey);

  return { siteKey, loading, ready, isConfigured, isTestKey };
}
