"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { TeamSettings } from "@/types/domain";
import type {
  TeamInviteFormValues,
  TeamMemberUpdateFormValues,
} from "@/modules/settings/schemas/teamSettings.schema";
import { parseSettingsError } from "@/modules/settings/lib/parseSettingsError";

export const teamSettingsQueryKey = ["settings", "team"] as const;

async function fetchTeamSettings(): Promise<TeamSettings> {
  const res = await fetch("/api/settings/team");
  if (!res.ok) {
    throw new Error("Failed to fetch team settings");
  }
  return res.json();
}

async function patchTeamMemberRole(
  memberId: string,
  data: TeamMemberUpdateFormValues
): Promise<TeamSettings> {
  const res = await fetch(`/api/settings/team/members/${memberId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    await parseSettingsError(res, "Failed to update team member");
  }

  return res.json();
}

async function postTeamInvite(data: TeamInviteFormValues): Promise<TeamSettings> {
  const res = await fetch("/api/settings/team/invites", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    await parseSettingsError(res, "Failed to send invite");
  }

  return res.json();
}

async function deleteTeamInvite(inviteId: string): Promise<TeamSettings> {
  const res = await fetch(`/api/settings/team/invites/${inviteId}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    await parseSettingsError(res, "Failed to revoke invite");
  }

  return res.json();
}

export function useTeamSettings() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: teamSettingsQueryKey,
    queryFn: fetchTeamSettings,
  });

  const roleMutation = useMutation({
    mutationFn: ({
      memberId,
      values,
    }: {
      memberId: string;
      values: TeamMemberUpdateFormValues;
    }) => patchTeamMemberRole(memberId, values),
    onSuccess: (data) => {
      queryClient.setQueryData(teamSettingsQueryKey, data);
    },
  });

  const inviteMutation = useMutation({
    mutationFn: postTeamInvite,
    onSuccess: (data) => {
      queryClient.setQueryData(teamSettingsQueryKey, data);
    },
  });

  const revokeMutation = useMutation({
    mutationFn: deleteTeamInvite,
    onSuccess: (data) => {
      queryClient.setQueryData(teamSettingsQueryKey, data);
    },
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    updateMemberRoleAsync: roleMutation.mutateAsync,
    updatingMemberId: roleMutation.isPending
      ? roleMutation.variables?.memberId ?? null
      : null,
    roleUpdateError: roleMutation.error,
    resetRoleUpdateState: roleMutation.reset,
    sendInviteAsync: inviteMutation.mutateAsync,
    isSendingInvite: inviteMutation.isPending,
    isInviteSuccess: inviteMutation.isSuccess,
    inviteError: inviteMutation.error,
    resetInviteState: inviteMutation.reset,
    revokeInviteAsync: revokeMutation.mutateAsync,
    revokingInviteId: revokeMutation.isPending
      ? revokeMutation.variables ?? null
      : null,
    revokeError: revokeMutation.error,
    resetRevokeState: revokeMutation.reset,
  };
}
