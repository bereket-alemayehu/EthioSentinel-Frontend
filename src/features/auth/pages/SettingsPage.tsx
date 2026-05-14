import { useTranslation } from "react-i18next";
import { useTheme } from "next-themes";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/utils/cn";
import { languages } from "@/shared/lib/i18n";
import {
  areNotificationsEnabled,
  setNotificationsEnabled,
} from "@/shared/lib/notificationsPrefs";
import { dispatchNotificationsPrefChanged } from "@/shared/hooks/useNotifications";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Monitor, Moon, Sun } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [notifOn, setNotifOn] = useState(areNotificationsEnabled);

  useEffect(() => {
    setNotifOn(areNotificationsEnabled());
  }, []);

  const toggleNotifications = useCallback(
    (checked: boolean) => {
      setNotificationsEnabled(checked);
      setNotifOn(checked);
      dispatchNotificationsPrefChanged();
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    [queryClient],
  );

  return (
    <div className="mx-auto max-w-lg p-6 md:p-10 space-y-6">
      <Button variant="ghost" size="sm" className="-ml-2 gap-2" onClick={() => navigate(-1)}>
        <ArrowLeft className="w-4 h-4" />
        {t("back")}
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>{t("appearance")}</CardTitle>
          <CardDescription>{t("appearanceDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-2">
          {(
            [
              { id: "light" as const, icon: Sun, label: t("themeLight") },
              { id: "dark" as const, icon: Moon, label: t("themeDark") },
              { id: "system" as const, icon: Monitor, label: t("themeSystem") },
            ] as const
          ).map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setTheme(opt.id)}
              className={cn(
                "flex flex-col items-center gap-2 rounded-xl border p-4 text-xs font-bold transition-all",
                theme === opt.id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:bg-muted/50",
              )}
            >
              <opt.icon className="w-5 h-5" />
              {opt.label}
            </button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("language")}</CardTitle>
          <CardDescription>{t("languageDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {languages.map((item) => (
            <Button
              key={item.code}
              type="button"
              variant={i18n.language === item.code ? "default" : "outline"}
              size="sm"
              className="rounded-full font-bold"
              onClick={() => i18n.changeLanguage(item.code)}
            >
              {item.label}
            </Button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("notificationsSection")}</CardTitle>
          <CardDescription>{t("notificationsSectionDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <label className="flex items-center justify-between gap-4 rounded-xl border border-border p-4 cursor-pointer">
            <span className="text-sm font-semibold">{t("enablePushNotifications")}</span>
            <input
              type="checkbox"
              className="h-4 w-4 accent-primary"
              checked={notifOn}
              onChange={(e) => toggleNotifications(e.target.checked)}
            />
          </label>
        </CardContent>
      </Card>
    </div>
  );
}
