import type { TeamInvite, TeamMember, TeamSettings } from "@/types/domain";
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

export function createTeamInvite(data: TeamInviteFormValues): TeamSettings {
  const email = normalizeEmail(data.email);

  if (members.some((member) => normalizeEmail(member.email) === email)) {
    throw new Error("This user is already on the team");
  }

  if (invites.some((invite) => normalizeEmail(invite.email) === email)) {
    throw new Error("An invite has already been sent to this email");
  }

  invites = [
    ...invites,
    {
      id: createInviteId(),
      email,
      role: data.role,
      invitedAt: new Date().toISOString(),
    },
  ];

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
