"use client";

import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Badge,
  Button,
  Callout,
  Card,
  DataTable,
  DataTableColumn,
  Icon,
  Input,
  Select,
} from "@shohojdhara/atomix";
import type { TeamMember, TeamRole } from "@/types/domain";
import {
  roleLabels,
  teamInviteSchema,
  teamRoles,
  type TeamInviteFormValues,
} from "@/modules/settings/schemas/teamSettings.schema";
import { useTeamSettings } from "@/modules/settings/hooks/useTeamSettings";

const SUCCESS_DISMISS_MS = 4000;

const roleBadgeVariants: Record<TeamRole, "primary" | "info" | "secondary"> = {
  admin: "primary",
  operator: "info",
  viewer: "secondary",
};

const roleSelectOptions = teamRoles.map((role) => ({
  label: roleLabels[role],
  value: role,
}));

function roleFromSelectEvent(event: ChangeEvent<HTMLSelectElement>): TeamRole | null {
  const value = event.target.value;
  return teamRoles.includes(value as TeamRole) ? (value as TeamRole) : null;
}

function formatLastActive(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatInvitedAt(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
  }).format(new Date(value));
}

export function TeamSettingsPanel() {
  const {
    data,
    isLoading,
    isError,
    refetch,
    updateMemberRoleAsync,
    updatingMemberId,
    roleUpdateError,
    resetRoleUpdateState,
    sendInviteAsync,
    isSendingInvite,
    isInviteSuccess,
    inviteError,
    resetInviteState,
    revokeInviteAsync,
    revokingInviteId,
    revokeError,
    resetRevokeState,
  } = useTeamSettings();

  const [feedbackMemberId, setFeedbackMemberId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors, isValid },
  } = useForm<TeamInviteFormValues>({
    resolver: zodResolver(teamInviteSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
      role: "viewer",
    },
  });

  const inviteRole = useWatch({ control, name: "role" });

  useEffect(() => {
    if (!isInviteSuccess) {
      return;
    }

    const timeout = window.setTimeout(resetInviteState, SUCCESS_DISMISS_MS);
    return () => window.clearTimeout(timeout);
  }, [isInviteSuccess, resetInviteState]);

  const handleRoleChange = useCallback(
    async (member: TeamMember, role: TeamRole) => {
      if (role === member.role) {
        return;
      }

      setFeedbackMemberId(member.id);
      resetRoleUpdateState();
      await updateMemberRoleAsync({
        memberId: member.id,
        values: { role },
      });
    },
    [resetRoleUpdateState, updateMemberRoleAsync]
  );

  const handleInviteSubmit = async (values: TeamInviteFormValues) => {
    resetInviteState();
    resetRevokeState();
    await sendInviteAsync(values);
    reset({
      email: "",
      role: "viewer",
    });
  };

  const handleRevokeInvite = useCallback(
    async (inviteId: string) => {
      resetInviteState();
      resetRevokeState();
      await revokeInviteAsync(inviteId);
    },
    [resetInviteState, resetRevokeState, revokeInviteAsync]
  );

  const memberColumns: DataTableColumn[] = useMemo(
    () => [
      {
        key: "name",
        title: "Name",
        render: (val) => <span className="u-font-bold">{val}</span>,
      },
      {
        key: "email",
        title: "Email",
        render: (val) => (
          <span className="u-text-sm u-text-secondary-emphasis">{val}</span>
        ),
      },
      {
        key: "role",
        title: "Role",
        render: (val: TeamRole, row: TeamMember) => (
          <div className="u-flex u-flex-column u-gap-2">
            <Select
              value={val}
              disabled={updatingMemberId === row.id}
              onChange={(event) => {
                const role = roleFromSelectEvent(event);
                if (role) {
                  handleRoleChange(row, role);
                }
              }}
              options={roleSelectOptions}
            />
            <Badge variant={roleBadgeVariants[val]} label={roleLabels[val]} />
          </div>
        ),
      },
      {
        key: "lastActiveAt",
        title: "Last active",
        render: (val) => (
          <span className="u-text-sm u-text-secondary-emphasis">
            {formatLastActive(val)}
          </span>
        ),
      },
    ],
    [handleRoleChange, updatingMemberId]
  );

  const inviteColumns: DataTableColumn[] = useMemo(
    () => [
      {
        key: "email",
        title: "Email",
        render: (val) => <span className="u-font-bold">{val}</span>,
      },
      {
        key: "role",
        title: "Role",
        render: (val: TeamRole) => (
          <Badge variant={roleBadgeVariants[val]} label={roleLabels[val]} />
        ),
      },
      {
        key: "invitedAt",
        title: "Invited",
        render: (val) => (
          <span className="u-text-sm u-text-secondary-emphasis">
            {formatInvitedAt(val)}
          </span>
        ),
      },
      {
        key: "actions",
        title: "",
        render: (_, row: { id: string }) => (
          <Button
            variant="outline-secondary"
            size="sm"
            disabled={revokingInviteId === row.id}
            loading={revokingInviteId === row.id}
            onClick={() => handleRevokeInvite(row.id)}
          >
            Revoke
          </Button>
        ),
      },
    ],
    [handleRevokeInvite, revokingInviteId]
  );

  if (isLoading) {
    return (
      <div className="u-flex u-flex-column u-gap-6" aria-busy="true">
        <div className="u-skeleton u-h-24" />
        <div className="u-skeleton u-h-48" />
        <div className="u-skeleton u-h-32" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <Callout variant="error" title="Failed to load team settings">
        <p className="u-text-sm u-mb-3">
          Team members and invites could not be loaded. Please try again.
        </p>
        <Button variant="outline-secondary" size="sm" onClick={() => refetch()}>
          Retry
        </Button>
      </Callout>
    );
  }

  return (
    <div className="u-flex u-flex-column u-gap-6">
      <section aria-labelledby="team-members-heading">
        <div className="u-settings-section-header">
          <div>
            <h2 id="team-members-heading" className="u-text-sm u-font-bold u-mb-1">
              Team members
            </h2>
            <p className="u-text-xs u-text-secondary-emphasis u-mb-0">
              Assign roles to control access across FiberOps modules.
            </p>
          </div>
          <Badge variant="info" label={`${data.members.length} members`} />
        </div>

        {roleUpdateError && feedbackMemberId && (
          <Callout variant="error" title="Role update failed" className="u-mb-4">
            <p className="u-form-help">
              {roleUpdateError.message || "Unable to update member role."}
            </p>
          </Callout>
        )}

        <Card>
          <div className="u-overflow-x-auto">
            <DataTable
              columns={memberColumns}
              data={data.members}
              rowKey="id"
            />
          </div>
        </Card>
      </section>

      <div className="u-divider-subtle" role="separator" />

      <section aria-labelledby="pending-invites-heading">
        <div className="u-settings-section-header">
          <div>
            <h2 id="pending-invites-heading" className="u-text-sm u-font-bold u-mb-1">
              Pending invites
            </h2>
            <p className="u-text-xs u-text-secondary-emphasis u-mb-0">
              Invitations expire after 7 days if not accepted.
            </p>
          </div>
          {data.invites.length > 0 && (
            <Badge variant="warning" label={`${data.invites.length} pending`} />
          )}
        </div>

        {revokeError && (
          <Callout variant="error" title="Revoke failed" className="u-mb-4">
            <p className="u-form-help">
              {revokeError.message || "Unable to revoke invite."}
            </p>
          </Callout>
        )}

        {data.invites.length === 0 ? (
          <p className="u-text-sm u-text-secondary-emphasis u-mb-0">
            No pending invitations.
          </p>
        ) : (
          <Card>
            <div className="u-overflow-x-auto">
              <DataTable
                columns={inviteColumns}
                data={data.invites}
                rowKey="id"
              />
            </div>
          </Card>
        )}
      </section>

      <div className="u-divider-subtle" role="separator" />

      <section aria-labelledby="invite-member-heading">
        <h2 id="invite-member-heading" className="u-text-sm u-font-bold u-mb-1">
          Invite member
        </h2>
        <p className="u-text-xs u-text-secondary-emphasis u-mb-4">
          Send an email invitation to add someone to your organization.
        </p>

        <Card>
          <form
            onSubmit={handleSubmit(handleInviteSubmit)}
            className="u-form-column"
            noValidate
          >
            {isInviteSuccess && (
              <Callout
                variant="success"
                title="Invite sent"
                icon={<Icon name="CheckCircle" />}
              >
                <p className="u-form-help">
                  The invitation was sent successfully.
                </p>
              </Callout>
            )}

            {inviteError && (
              <Callout variant="error" title="Invite failed">
                <p className="u-form-help">
                  {inviteError.message || "Unable to send invitation."}
                </p>
              </Callout>
            )}

            <div>
              <label htmlFor="invite-email" className="u-form-label">
                Email address
              </label>
              <Input
                id="invite-email"
                type="email"
                fullWidth
                placeholder="name@company.com"
                {...register("email")}
              />
              {errors.email && (
                <p className="u-form-error">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="invite-role" className="u-form-label">
                Role
              </label>
              <Select
                id="invite-role"
                value={inviteRole ?? "viewer"}
                onChange={(event) => {
                  const role = roleFromSelectEvent(event);
                  if (role) {
                    setValue("role", role, {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                  }
                }}
                options={roleSelectOptions}
              />
              {errors.role && (
                <p className="u-form-error">{errors.role.message}</p>
              )}
            </div>

            <div>
              <Button
                type="submit"
                variant="primary"
                disabled={!isValid || isSendingInvite}
                loading={isSendingInvite}
                iconName="PaperPlaneTilt"
              >
                Send invite
              </Button>
            </div>
          </form>
        </Card>
      </section>
    </div>
  );
}
