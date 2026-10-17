import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Link, Navigate, useLocation, useNavigate } from "react-router";

import { Alert, Button, Input } from "@/components/ui";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { SawaLogo } from "@/shell/Shell";
import { ApiError, useAuth } from "@/lib/auth";

export default function LoginPage() {
  const { t } = useTranslation();
  const { status, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (status === "authenticated") {
    return <Navigate to={from} replace />;
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError(t("auth.invalidCredentials"));
      } else {
        setError(t("auth.networkError"));
      }
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-page flex flex-col items-center justify-center px-4 relative">
      <div className="absolute top-4 end-4">
        <LanguageSwitch fullLabel />
      </div>
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <SawaLogo />
        </div>
        <div className="bg-white border border-border rounded-xl shadow-sm p-6 md:p-8">
          <h1 className="text-h2 text-text-primary mb-1">{t("auth.signIn")}</h1>
          <p className="text-body-sm text-text-secondary mb-6">
            {t("auth.subtitle")}
          </p>

          {error && (
            <Alert variant="error" className="mb-4" onDismiss={() => setError(null)}>
              {error}
            </Alert>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <Input
              label={t("auth.email")}
              type="email"
              dir="ltr"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("auth.emailPlaceholder")}
            />
            <Input
              label={t("auth.password")}
              type="password"
              dir="ltr"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("auth.passwordPlaceholder")}
            />
            <Button type="submit" fullWidth loading={submitting}>
              {t("auth.signIn")}
            </Button>
          </form>
        </div>
        <p className="text-center text-caption mt-6">{t("auth.footer")}</p>
        <div className="flex justify-center">
          <Link
            to="/welcome"
            className="inline-flex min-h-11 items-center text-small text-brand-600 hover:text-brand-700 hover:underline underline-offset-2"
          >
            {t("auth.whatIsSawa")}
          </Link>
        </div>
      </div>
    </div>
  );
}
