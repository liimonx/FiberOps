import type { AuthUser } from "@/types/auth";
import type { TeamRole } from "@/types/domain";

export type MockAuthAccount = {
  email: string;
  password: string;
  user: AuthUser;
  token: string;
};

const accounts: MockAuthAccount[] = [
  {
    email: "alex.morgan@bcn-fiberops.com",
    password: "password",
    token: "mock-token-admin",
    user: {
      id: 1,
      name: "Alex Morgan",
      email: "alex.morgan@bcn-fiberops.com",
      role: "admin",
      organizationId: 1,
    },
  },
  {
    email: "jordan.lee@bcn-fiberops.com",
    password: "password",
    token: "mock-token-operator",
    user: {
      id: 2,
      name: "Jordan Lee",
      email: "jordan.lee@bcn-fiberops.com",
      role: "operator",
      organizationId: 1,
    },
  },
  {
    email: "taylor.chen@bcn-fiberops.com",
    password: "password",
    token: "mock-token-viewer",
    user: {
      id: 3,
      name: "Taylor Chen",
      email: "taylor.chen@bcn-fiberops.com",
      role: "viewer",
      organizationId: 1,
    },
  },
];

const sessions = new Map<string, AuthUser>();

for (const account of accounts) {
  sessions.set(account.token, account.user);
}

export const DEMO_ADMIN_ACCOUNT = accounts[0]!;

export function authenticateMockUser(
  email: string,
  password: string
): { user: AuthUser; token: string } | null {
  const normalized = email.trim().toLowerCase();
  const account = accounts.find(
    (entry) => entry.email.toLowerCase() === normalized && entry.password === password
  );
  if (!account) return null;
  sessions.set(account.token, account.user);
  return { user: account.user, token: account.token };
}

export function registerMockUser(
  name: string,
  email: string,
  password: string
): { user: AuthUser; token: string } | { error: string } {
  const normalized = email.trim().toLowerCase();
  if (accounts.some((entry) => entry.email.toLowerCase() === normalized)) {
    return { error: "An account with this email already exists" };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters" };
  }

  const token = `mock-token-${Date.now()}`;
  const user: AuthUser = {
    id: accounts.length + 1,
    name: name.trim(),
    email: normalized,
    role: "viewer",
    organizationId: 1,
  };
  accounts.push({ email: normalized, password, token, user });
  sessions.set(token, user);
  return { user, token };
}

export function getUserByToken(token: string | null | undefined): AuthUser | null {
  if (!token) return null;
  return sessions.get(token) ?? null;
}

export function getRoleByToken(token: string | null | undefined): TeamRole | null {
  return getUserByToken(token)?.role ?? null;
}

export function logoutMockToken(token: string | null | undefined): void {
  if (!token) return;
  // Keep demo tokens resolvable so refresh after logout+relogin works;
  // production would revoke server-side sessions.
  void token;
}

export function registerSession(user: AuthUser, token: string): void {
  sessions.set(token, user);
  accounts.push({
    email: user.email,
    password: "",
    token,
    user,
  });
}
