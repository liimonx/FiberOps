"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Card, Input } from "@shohojdhara/atomix";
import { apiClient, setAuthToken } from "@/lib/apiClient";
import { getAuthErrorMessage, useAuthStore } from "@/stores/useAuthStore";
import type { TeamRole } from "@/types/domain";
import styles from "../../login/auth.module.css";

type InvitePreview = {
  email: string;
  role: TeamRole;
  expiresAt?: string;
};

export default function AcceptInvitePage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(true);

  const token = params.token;

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const data = await apiClient<InvitePreview>(`/api/auth/invite/${token}`, {
          skipAuth: true,
        });
        if (!cancelled) setPreview(data);
      } catch (err) {
        if (!cancelled) {
          setError(getAuthErrorMessage(err, "Invite is invalid or expired"));
        }
      } finally {
        if (!cancelled) setLoadingPreview(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient<{
        user: {
          id: number;
          name: string;
          email: string;
          role: TeamRole;
          organizationId?: number;
        };
        token: string;
      }>("/api/auth/accept-invite", {
        method: "POST",
        body: JSON.stringify({ token, name, password }),
        skipAuth: true,
      });

      await setAuthToken(data.token);
      useAuthStore.setState({ user: data.user, token: data.token });
      router.replace("/dashboard");
    } catch (err) {
      setError(getAuthErrorMessage(err, "Unable to accept invite"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authPage}>
      <Card className={styles.card}>
        <div className="u-stack u-gap-4">
          <div>
            <h1 className="u-heading-lg">Accept invitation</h1>
            <p className="u-text-muted u-text-sm">
              {preview
                ? `Join FiberOps as ${preview.role} (${preview.email}).`
                : "Loading invitation…"}
            </p>
          </div>

          {loadingPreview ? (
            <div className="u-skeleton u-h-24" />
          ) : (
            <form onSubmit={handleSubmit} className="u-stack u-gap-3">
              <div className="u-form-field">
                <label className="u-form-label" htmlFor="invite-name">
                  Full name
                </label>
                <Input
                  id="invite-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                  fullWidth
                />
              </div>
              <div className="u-form-field">
                <label className="u-form-label" htmlFor="invite-password">
                  Password
                </label>
                <Input
                  id="invite-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  minLength={8}
                  fullWidth
                />
              </div>
              {error ? <p className="u-form-error">{error}</p> : null}
              <Button type="submit" disabled={loading || !preview} fullWidth>
                {loading ? "Joining…" : "Join organization"}
              </Button>
            </form>
          )}
        </div>
      </Card>
    </div>
  );
}
