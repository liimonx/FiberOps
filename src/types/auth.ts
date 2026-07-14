export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: "admin" | "operator" | "viewer";
  organizationId?: number;
};
