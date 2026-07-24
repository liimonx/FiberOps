"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button, Card, Input } from "@shohojdhara/atomix";
import {
  getAuthErrorMessage,
  useAuthStore,
} from "@/stores/useAuthStore";
import styles from "./auth.module.css";

export default function LoginPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useAuthStore((state) => state.login);
  const [email, setEmail] = useState("test@example.com");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      const from = searchParams.get("from") || "/dashboard";
      router.replace(from);
    } catch (err) {
      setError(getAuthErrorMessage(err, "Unable to sign in"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authPage}>
      <Card className={styles.card}>
        <div className="u-stack u-gap-4">
          <div>
            <h1 className="u-heading-lg">Sign in to FiberOps</h1>
            <p className="u-text-muted u-text-sm">
              Demo: test@example.com / password123
            </p>
          </div>

          <form onSubmit={handleSubmit} className="u-stack u-gap-3">
            <div className="u-form-field">
              <label className="u-form-label" htmlFor="login-email">
                Email
              </label>
              <Input
                id="login-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoComplete="email"
                fullWidth
              />
            </div>
            <div className="u-form-field">
              <label className="u-form-label" htmlFor="login-password">
                Password
              </label>
              <Input
                id="login-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                autoComplete="current-password"
                fullWidth
              />
            </div>
            {error ? <p className="u-form-error">{error}</p> : null}
            <Button type="submit" disabled={loading} fullWidth>
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <p className="u-text-sm">
            No account? <Link href="/register">Create one</Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
