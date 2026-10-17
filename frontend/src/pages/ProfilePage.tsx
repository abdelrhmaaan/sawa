import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";

import {
  Alert,
  Button,
  Card,
  CardHeader,
  Input,
} from "@/components/ui";
import { useToast } from "@/components/overlays";
import { PageHeader } from "@/shell/Shell";
import { ApiError, updateMe } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function ProfilePage() {
  const { t } = useTranslation();
  const { user, setUser } = useAuth();
  const { toast } = useToast();

  const [firstName, setFirstName] = useState(user?.first_name ?? "");
  const [lastName, setLastName] = useState(user?.last_name ?? "");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setError(null);
    setFieldErrors({});
    setSaving(true);
    try {
      const updated = await updateMe({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
      });
      setUser(updated);
      toast({ variant: "success", title: t("profile.updatedToast") });
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.fieldErrors) {
          const flat: Record<string, string> = {};
          for (const [k, v] of Object.entries(err.fieldErrors)) {
            flat[k] = v[0];
          }
          setFieldErrors(flat);
        } else {
          setError(err.detail ?? t("profile.saveError"));
        }
      } else {
        setError(t("common.networkError"));
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl">
      <PageHeader title={t("profile.title")} description={t("profile.description")} />

      <Card className="mb-6">
        <CardHeader title={t("profile.accountTitle")} description={t("profile.accountDescription")} />
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 mt-4">
          <div>
            <dt className="text-overline text-text-muted">{t("profile.email")}</dt>
            <dd className="text-body-sm text-text-primary mt-0.5">{user.email}</dd>
          </div>
          <div>
            <dt className="text-overline text-text-muted">{t("profile.role")}</dt>
            <dd className="text-body-sm text-text-primary mt-0.5">{t(`role.${user.role}`)}</dd>
          </div>
          <div>
            <dt className="text-overline text-text-muted">{t("profile.department")}</dt>
            <dd className="text-body-sm text-text-primary mt-0.5">{user.department || "—"}</dd>
          </div>
          <div>
            <dt className="text-overline text-text-muted">{t("profile.manager")}</dt>
            <dd className="text-body-sm text-text-primary mt-0.5">{user.manager?.name ?? "—"}</dd>
          </div>
        </dl>
      </Card>

      <Card>
        <CardHeader title={t("profile.nameTitle")} />
        <form onSubmit={onSubmit} className="mt-4 space-y-4">
          {error && (
            <Alert variant="error" onDismiss={() => setError(null)}>{error}</Alert>
          )}
          <Input
            label={t("profile.firstName")}
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            error={fieldErrors.first_name}
          />
          <Input
            label={t("profile.lastName")}
            required
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            error={fieldErrors.last_name}
          />
          <div className="flex justify-end">
            <Button type="submit" loading={saving}>{t("common.saveChanges")}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
