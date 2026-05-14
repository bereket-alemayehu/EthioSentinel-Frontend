import { useTranslation } from "react-i18next";
import { useTheme } from "next-themes";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { cn } from "@/shared/utils/cn";
import { languages } from "@/shared/lib/i18n";
import {
  areNotificationsEnabled,
  setNotificationsEnabled,
} from "@/shared/lib/notificationsPrefs";
import { dispatchNotificationsPrefChanged } from "@/shared/hooks/useNotifications";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Monitor, Moon, Sun, KeyRound } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Modal } from "@/shared/components/ui/Modal";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/app/providers/auth/AuthProvider";
import { changePasswordApi } from "@/features/auth/api/auth";
import { toast } from "sonner";

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, logout } = useAuth();
  const [notifOn, setNotifOn] = useState(areNotificationsEnabled);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwdModalOpen, setPwdModalOpen] = useState(false);
  const [pwdBusy, setPwdBusy] = useState(false);

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

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (newPassword.length < 8) {
      toast.error(t("passwordMinLength"));
      return;
    }
    setPwdBusy(true);
    try {
      await changePasswordApi(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setPwdModalOpen(false);
      toast.success(t("passwordChangedSignInAgain"));
      await logout();
      navigate("/login");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t("logoutFailed"));
    } finally {
      setPwdBusy(false);
    }
  };

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

      {user ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5" />
              {t("changePasswordSection")}
            </CardTitle>
            <CardDescription>{t("changePasswordNote")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button type="button" className="gap-2" onClick={() => setPwdModalOpen(true)}>
              <KeyRound className="h-4 w-4" />
              {t("changePasswordSubmit")}
            </Button>
            <Modal
              isOpen={pwdModalOpen}
              onClose={() => !pwdBusy && setPwdModalOpen(false)}
              title={t("changePasswordSection")}
            >
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    {t("currentPasswordLabel")}
                  </label>
                  <Input
                    type="password"
                    autoComplete="current-password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    {t("newPasswordLabel")}
                  </label>
                  <Input
                    type="password"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={pwdBusy}
                    onClick={() => setPwdModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={pwdBusy}>
                    {pwdBusy ? t("authenticating") : t("changePasswordSubmit")}
                  </Button>
                </div>
              </form>
            </Modal>
          </CardContent>
        </Card>
      ) : null}

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
