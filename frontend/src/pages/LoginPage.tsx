import { useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router";

import { Alert, Button, Input, LoadingState } from "@/components/ui";
import { SawaLogo } from "@/shell/Shell";
import { ApiError, useAuth } from "@/lib/auth";

export default function LoginPage() {
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
        setError("Invalid email or password.");
      } else {
        setError("Couldn't reach the server. Check your connection and try again.");
      }
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-page flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <SawaLogo />
        </div>
        <div className="bg-white border border-border rounded-xl shadow-sm p-6 md:p-8">
          <h1 className="text-h2 text-text-primary mb-1">Sign in</h1>
          <p className="text-body-sm text-text-secondary mb-6">
            Employee requests &amp; time tracking
          </p>

          {error && (
            <Alert variant="error" className="mb-4" onDismiss={() => setError(null)}>
              {error}
            </Alert>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
            />
            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
            <Button type="submit" fullWidth loading={submitting}>
              Sign in
            </Button>
          </form>
        </div>
        <p className="text-center text-caption mt-6">SAWA — work better, together.</p>
      </div>
    </div>
  );
}
