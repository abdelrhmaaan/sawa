import { useState, type FormEvent } from "react";

import {
  Alert,
  Button,
  Card,
  CardHeader,
  Input,
} from "@/components/ui";
import { useToast } from "@/components/overlays";
import { PageHeader, roleLabels } from "@/shell/Shell";
import { ApiError, updateMe } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function ProfilePage() {
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
      toast({ variant: "success", title: "Profile updated." });
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.fieldErrors) {
          const flat: Record<string, string> = {};
          for (const [k, v] of Object.entries(err.fieldErrors)) {
            flat[k] = v[0];
          }
          setFieldErrors(flat);
        } else {
          setError(err.detail ?? "Couldn't save your profile. Please try again.");
        }
      } else {
        setError("Couldn't reach the server. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl">
      <PageHeader title="My profile" description="Your account details and editable fields." />

      <Card className="mb-6">
        <CardHeader title="Account" description="Managed by HR — contact them to change these." />
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 mt-4">
          <div>
            <dt className="text-overline text-text-muted">Email</dt>
            <dd className="text-body-sm text-text-primary mt-0.5">{user.email}</dd>
          </div>
          <div>
            <dt className="text-overline text-text-muted">Role</dt>
            <dd className="text-body-sm text-text-primary mt-0.5">{roleLabels[user.role]}</dd>
          </div>
          <div>
            <dt className="text-overline text-text-muted">Department</dt>
            <dd className="text-body-sm text-text-primary mt-0.5">{user.department || "—"}</dd>
          </div>
          <div>
            <dt className="text-overline text-text-muted">Manager</dt>
            <dd className="text-body-sm text-text-primary mt-0.5">{user.manager?.name ?? "—"}</dd>
          </div>
        </dl>
      </Card>

      <Card>
        <CardHeader title="Name" />
        <form onSubmit={onSubmit} className="mt-4 space-y-4">
          {error && (
            <Alert variant="error" onDismiss={() => setError(null)}>{error}</Alert>
          )}
          <Input
            label="First name"
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            error={fieldErrors.first_name}
          />
          <Input
            label="Last name"
            required
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            error={fieldErrors.last_name}
          />
          <div className="flex justify-end">
            <Button type="submit" loading={saving}>Save changes</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
