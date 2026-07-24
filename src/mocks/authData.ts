export type MockAuthUser = {
  id: number;
  name: string;
  email: string;
  role: "admin" | "operator" | "viewer";
  organizationId?: number;
};

type StoredUser = MockAuthUser & { password: string };

const USERS_KEY = "fiberops:mock-users";

const DEMO_USER: StoredUser = {
  id: 1,
  name: "Demo Operator",
  email: "test@example.com",
  role: "admin",
  organizationId: 1,
  password: "password123",
};

let users = createUserStore();
let nextUserId = nextIdFrom(users);

function createUserStore(): Map<string, StoredUser> {
  const map = new Map<string, StoredUser>([[DEMO_USER.email, { ...DEMO_USER }]]);

  if (typeof window === "undefined") {
    return map;
  }

  try {
    const raw = window.localStorage.getItem(USERS_KEY);
    if (!raw) return map;
    const stored = JSON.parse(raw) as StoredUser[];
    for (const user of stored) {
      if (!user?.email || user.email === DEMO_USER.email) continue;
      map.set(user.email, user);
    }
  } catch {
    // ignore corrupt storage
  }

  return map;
}

function nextIdFrom(store: Map<string, StoredUser>): number {
  let maxId = 1;
  for (const user of store.values()) {
    if (user.id > maxId) maxId = user.id;
  }
  return maxId + 1;
}

function persistUsers(): void {
  if (typeof window === "undefined") return;
  const extras = [...users.values()].filter(
    (user) => user.email !== DEMO_USER.email
  );
  window.localStorage.setItem(USERS_KEY, JSON.stringify(extras));
}

function publicUser(user: MockAuthUser): MockAuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    organizationId: user.organizationId,
  };
}

function issueToken(userId: number): string {
  return `mock-token-${userId}-${Date.now()}`;
}

export function mockLogin(email: string, password: string) {
  const user = users.get(email.trim().toLowerCase());
  if (!user || user.password !== password) {
    throw new Error("Invalid email or password");
  }
  return { user: publicUser(user), token: issueToken(user.id) };
}

export function mockRegister(name: string, email: string, password: string) {
  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }

  const key = email.trim().toLowerCase();
  if (users.has(key)) {
    throw new Error("An account with this email already exists");
  }

  const user: StoredUser = {
    id: nextUserId++,
    name: name.trim(),
    email: key,
    role: "operator",
    organizationId: 1,
    password,
  };
  users.set(key, user);
  persistUsers();
  return { user: publicUser(user), token: issueToken(user.id) };
}

export function mockLogout() {
  return { ok: true };
}

export function mockMe(authorizationHeader: string | null) {
  if (!authorizationHeader?.startsWith("Bearer ")) {
    throw new Error("Unauthenticated");
  }
  const token = authorizationHeader.slice("Bearer ".length);
  const match = /^mock-token-(\d+)/.exec(token);
  if (!match) {
    throw new Error("Unauthenticated");
  }
  const userId = Number(match[1]);
  const user = [...users.values()].find((entry) => entry.id === userId);
  if (!user) {
    throw new Error("Unauthenticated");
  }
  return { user: publicUser(user) };
}
