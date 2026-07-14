import type { TeamInvite, TeamMember, TeamRole, TeamSettings } from "@/types/domain";
import type {
  TeamInviteFormValues,
  TeamMemberUpdateFormValues,
} from "@/modules/settings/schemas/teamSettings.schema";

const defaultMembers: TeamMember[] = [
  {
    id: "usr-001",
    name: "Alex Morgan",
    email: "alex.morgan@bcn-fiberops.com",
    role: "admin",
    lastActiveAt: "2026-06-07T09:15:00.000Z",
  },
  {
    id: "usr-002",
    name: "Jordan Lee",
    email: "jordan.lee@bcn-fiberops.com",
    role: "operator",
    lastActiveAt: "2026-06-07T08:42:00.000Z",
  },
  {
    id: "usr-003",
    name: "Sam Rivera",
    email: "sam.rivera@bcn-fiberops.com",
    role: "operator",
    lastActiveAt: "2026-06-06T17:20:00.000Z",
  },
  {
    id: "usr-004",
    name: "Taylor Chen",
    email: "taylor.chen@bcn-fiberops.com",
    role: "viewer",
    lastActiveAt: "2026-06-05T11:05:00.000Z",
  },
];

const defaultInvites: TeamInvite[] = [
  {
    id: "inv-001",
    email: "pat.nguyen@example.com",
    role: "viewer",
    invitedAt: "2026-06-06T14:30:00.000Z",
  },
];

const members: TeamMember[] = defaultMembers.map((member) => ({ ...member }));
let invites: TeamInvite[] = defaultInvites.map((invite) => ({ ...invite }));

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function countAdmins(excludeMemberId?: string): number {
  return members.filter(
    (member) => member.role === "admin" && member.id !== excludeMemberId
  ).length;
}

function createInviteId(): string {
  return `inv-${Date.now()}`;
}

export function getTeamSettings(): TeamSettings {
  return {
    members: members.map((member) => ({ ...member })),
    invites: invites.map((invite) => ({ ...invite })),
  };
}

export function updateTeamMemberRole(
  memberId: string,
  patch: TeamMemberUpdateFormValues
): TeamSettings {
  const index = members.findIndex((member) => member.id === memberId);
  if (index === -1) {
    throw new Error("Team member not found");
  }

  const currentMember = members[index];

  if (currentMember.role === "admin" && patch.role !== "admin" && countAdmins(memberId) === 0) {
    throw new Error("At least one admin is required");
  }

  members[index] = {
    ...currentMember,
    role: patch.role,
  };

  return getTeamSettings();
}

export function revokeTeamInvite(inviteId: string): TeamSettings {
  const nextInvites = invites.filter((invite) => invite.id !== inviteId);

  if (nextInvites.length === invites.length) {
    throw new Error("Invite not found");
  }

  invites = nextInvites;
  return getTeamSettings();
}

export function removeTeamMember(memberId: string): TeamSettings {
  const index = members.findIndex((member) => member.id === memberId);
  if (index === -1) {
    throw new Error("Team member not found");
  }

  const member = members[index]!;
  if (member.role === "admin" && countAdmins(memberId) === 0) {
    throw new Error("At least one admin is required");
  }

  members.splice(index, 1);
  return getTeamSettings();
}

export function createTeamInvite(
  data: TeamInviteFormValues,
  options?: { actorEmail?: string }
): TeamSettings {
  const email = normalizeEmail(data.email);

  if (options?.actorEmail && normalizeEmail(options.actorEmail) === email) {
    throw new Error("You cannot invite your own account");
  }

  if (members.some((member) => normalizeEmail(member.email) === email)) {
    throw new Error("This user is already on the team");
  }

  if (invites.some((invite) => normalizeEmail(invite.email) === email)) {
    throw new Error("An invite has already been sent to this email");
  }

  const token = `invtok-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;

  invites = [
    ...invites,
    {
      id: createInviteId(),
      email,
      role: data.role,
      invitedAt: new Date().toISOString(),
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      acceptUrl: `/invite/${token}`,
    },
  ];

  return getTeamSettings();
}

export function getInviteByToken(token: string): TeamInvite | null {
  const invite = invites.find((item) => item.token === token);
  if (!invite) return null;
  return { ...invite };
}

export function acceptTeamInvite(input: {
  token: string;
  name: string;
  password: string;
}): { user: { id: number; name: string; email: string; role: TeamRole; organizationId: number }; token: string } {
  const invite = invites.find((item) => item.token === input.token);
  if (!invite) {
    throw new Error("Invite is invalid or has already been used");
  }
  if (invite.expiresAt && new Date(invite.expiresAt).getTime() < Date.now()) {
    throw new Error("This invite has expired");
  }
  if (members.some((member) => normalizeEmail(member.email) === normalizeEmail(invite.email))) {
    throw new Error("This user is already on the team");
  }

  members.push({
    id: `usr-${Date.now()}`,
    name: input.name.trim(),
    email: invite.email,
    role: invite.role,
    lastActiveAt: new Date().toISOString(),
  });
  invites = invites.filter((item) => item.id !== invite.id);

  return {
    user: {
      id: Date.now(),
      name: input.name.trim(),
      email: invite.email,
      role: invite.role,
      organizationId: 1,
    },
    token: `mock-token-invite-${Date.now()}`,
  };
}
