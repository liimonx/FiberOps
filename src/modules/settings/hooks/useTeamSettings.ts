"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { TeamSettings } from "@/types/domain";
import type {
  TeamInviteFormValues,
  TeamMemberUpdateFormValues,
} from "@/modules/settings/schemas/teamSettings.schema";
import { apiClient } from "@/lib/apiClient";

export const teamSettingsQueryKey = ["settings", "team"] as const;

export function useTeamSettings(options?: { enabled?: boolean }) {
  const queryClient = useQueryClient();
  const enabled = options?.enabled ?? true;

  const query = useQuery({
    queryKey: teamSettingsQueryKey,
    queryFn: () => apiClient<TeamSettings>("/api/settings/team"),
    enabled,
  });

  const roleMutation = useMutation({
    mutationFn: ({
      memberId,
      values,
    }: {
      memberId: string;
      values: TeamMemberUpdateFormValues;
    }) =>
      apiClient<TeamSettings>(`/api/settings/team/members/${memberId}`, {
        method: "PATCH",
        body: JSON.stringify(values),
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(teamSettingsQueryKey, data);
    },
  });

  const inviteMutation = useMutation({
    mutationFn: (data: TeamInviteFormValues) =>
      apiClient<TeamSettings>("/api/settings/team/invites", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(teamSettingsQueryKey, data);
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (inviteId: string) =>
      apiClient<TeamSettings>(`/api/settings/team/invites/${inviteId}`, {
        method: "DELETE",
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(teamSettingsQueryKey, data);
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: (memberId: string) =>
      apiClient<TeamSettings>(`/api/settings/team/members/${memberId}`, {
        method: "DELETE",
      }),
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
    removeMemberAsync: removeMemberMutation.mutateAsync,
    removingMemberId: removeMemberMutation.isPending
      ? removeMemberMutation.variables ?? null
      : null,
    removeMemberError: removeMemberMutation.error,
    resetRemoveMemberState: removeMemberMutation.reset,
  };
}
