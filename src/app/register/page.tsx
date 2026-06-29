"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button, Card, Input } from "@shohojdhara/atomix";
import {
  getAuthErrorMessage,
  useAuthStore,
} from "@/stores/useAuthStore";
import styles from "../login/auth.module.css";

export default function RegisterPage() {
  const router = useRouter();
  const register = useAuthStore((state) => state.register);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await register(name, email, password);
      router.replace("/dashboard");
    } catch (err) {
      setError(getAuthErrorMessage(err, "Unable to create account"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authPage}>
      <Card className={styles.card}>
        <div className="u-stack u-gap-4">
          <div>
            <h1 className="u-heading-lg">Create your FiberOps account</h1>
            <p className="u-text-muted u-text-sm">
              Register to manage your fiber network operations.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="u-stack u-gap-3">
            <div className="u-form-field">
              <label className="u-form-label" htmlFor="register-name">
                Name
              </label>
              <Input
                id="register-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                autoComplete="name"
                fullWidth
              />
            </div>
            <div className="u-form-field">
              <label className="u-form-label" htmlFor="register-email">
                Email
              </label>
              <Input
                id="register-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoComplete="email"
                fullWidth
              />
            </div>
            <div className="u-form-field">
              <label className="u-form-label" htmlFor="register-password">
                Password
              </label>
              <Input
                id="register-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                fullWidth
              />
            </div>
            {error ? <p className="u-form-error">{error}</p> : null}
            <Button type="submit" disabled={loading} fullWidth>
              {loading ? "Creating account…" : "Create account"}
            </Button>
          </form>

          <p className="u-text-sm">
            Already have an account? <Link href="/login">Sign in</Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
