import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card";
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar";
import { getMeApi } from "@/features/auth/api/auth";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/app/providers/auth/AuthProvider";
import { Button } from "@/shared/components/ui/button";
import { ArrowLeft, User } from "lucide-react";

export default function ProfilePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user: authUser } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["auth", "me", "profile"],
    queryFn: getMeApi,
    enabled: Boolean(authUser),
  });

  const user = data ?? authUser;

  const initials = user?.username
    ? user.username
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  if (!authUser) {
    return (
      <div className="p-10 text-center">
        <p className="text-muted-foreground">{t("loginForProfile")}</p>
        <Button className="mt-4" onClick={() => navigate("/login")}>
          {t("login")}
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg p-6 md:p-10 space-y-6">
      <Button variant="ghost" size="sm" className="-ml-2 gap-2" onClick={() => navigate(-1)}>
        <ArrowLeft className="w-4 h-4" />
        {t("back")}
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            {t("myProfile")}
          </CardTitle>
          <CardDescription>{t("profileViewOnly")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6 pt-2">
          <Avatar className="h-24 w-24 ring-2 ring-primary/20">
            <AvatarFallback className="text-2xl font-black bg-primary/10">{initials}</AvatarFallback>
          </Avatar>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">{t("authenticating")}</p>
          ) : (
            <dl className="w-full space-y-3 text-sm">
              <Row label={t("username")} value={user?.username} />
              <Row label={t("emailAddress")} value={user?.email} />
              <Row label={t("role")} value={user?.role?.toUpperCase()} />
              <Row label={t("region")} value={user?.region} />
              <Row label={t("district")} value={user?.assignedDistrict || t("notAssigned")} />
              {user?.phoneNumber ? (
                <Row label={t("phoneNumber")} value={user.phoneNumber} />
              ) : null}
              {user?.createdAt ? (
                <Row
                  label={t("memberSince")}
                  value={new Date(user.createdAt).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                />
              ) : null}
            </dl>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border/50 pb-2 last:border-0">
      <dt className="text-muted-foreground font-medium">{label}</dt>
      <dd className="font-semibold text-right truncate max-w-[60%]">{value ?? "—"}</dd>
    </div>
  );
}
