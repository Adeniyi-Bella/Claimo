import { useState } from "react";
import { UserPlus, Clock } from "lucide-react";

import type {
  Member,
  PendingInvite,
  ProjectResponse,
} from "@/api/dto/responseDto";
import { RoleBadge } from "@/components/common/status-badge";
import { Avatar } from "@/components/common/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/common/dialog";
import { fmtDate } from "@/utils";
import { toast } from "@/hooks/use-toast";
import { ApiError } from "@/api/error/customeError";
import { useRemoveMemberFromProject } from "@/hooks/api/projects/useProject";

export default function MembersTab({
  project,
  onInvite,
  currentUserId,
}: {
  project: ProjectResponse;
  onInvite: () => void;
  currentUserId: string;
}) {
  const [memberToRemove, setMemberToRemove] = useState<Member | null>(null);
  const { mutateAsync, isPending } = useRemoveMemberFromProject(project.id);
  const canInviteMember =
    project.currentUserRole === "SUPER_ADMIN" ||
    project.currentUserRole === "ADMIN";
  const currentUserRole = project.members.find(
    (m) => m.id === currentUserId,
  )?.role;

  const canRemove = (m: Member) => {
    if (!currentUserRole) return false;

    const isSelf = m.id === currentUserId;

    switch (currentUserRole) {
      case "SUPER_ADMIN":
        return !isSelf;
      case "ADMIN":
        return m.role !== "SUPER_ADMIN";
      default:
        return isSelf;
    }
  };

  const confirmRemove = async () => {
    if (!memberToRemove) return;
    try {
      await mutateAsync(memberToRemove.id);
      setMemberToRemove(null);
      toast({
        title: "Member removed",
        description: `${memberToRemove.name} has been removed from the project.`,
      });
    } catch (err: unknown) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Failed to remove member. Please try again.";
      toast({ title: "Error", description: message, variant: "destructive" });
      setMemberToRemove(null);
    }
  };

  const totalCount =
    project.members.length + (project.pendingInvites?.length ?? 0);

  return (
    <>
      <div className="rounded-xl border border-border bg-surface shadow-soft">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <div className="text-sm font-semibold">Project members</div>
            <div className="text-xs text-muted-foreground">
              {totalCount} members can access this project
            </div>
          </div>
          {canInviteMember && (
            <button
              onClick={onInvite}
              className="h-9 px-3.5 inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition shadow-soft"
            >
              <UserPlus className="h-4 w-4" /> Invite member
            </button>
          )}
        </div>
        <table className="w-full text-sm">
          <thead className="text-xs text-muted-foreground">
            <tr className="border-b border-border">
              <th className="text-left font-medium px-5 py-2.5">Name</th>
              <th className="text-left font-medium px-5 py-2.5">Role</th>
              <th className="text-left font-medium px-5 py-2.5">Joined</th>
              <th className="px-5 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {project.members.map((m) => (
              <tr key={m.id} className="hover:bg-accent/40 transition">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={m.name} hue={m.avatarHue} size={32} />
                    <div>
                      <div className="font-medium">{m.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {m.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <RoleBadge role={m.role} />
                </td>
                <td className="px-5 py-3 text-muted-foreground">
                  {fmtDate(m.joined)}
                </td>
                <td className="px-5 py-3 text-right">
                  {canRemove(m) && (
                    <button
                      onClick={() => setMemberToRemove(m)}
                      className="text-xs text-muted-foreground hover:text-destructive transition"
                    >
                      Remove
                    </button>
                  )}
                </td>
              </tr>
            ))}

            {project.pendingInvites?.map((invite: PendingInvite) => (
              <tr
                key={invite.id}
                className="hover:bg-accent/40 transition opacity-60"
              >
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    {/* Generic avatar for pending — no name yet */}
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="font-medium text-muted-foreground">
                        {invite.email}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Invited by {invite.invitedByName}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <RoleBadge role={invite.role} />
                </td>
                <td className="px-5 py-3 text-muted-foreground">
                  <span className="inline-flex items-center gap-1 text-xs">
                    <Clock className="h-3 w-3" />{" "}
                    {invite.status.charAt(0) +
                      invite.status.slice(1).toLowerCase()}{" "}
                    · {fmtDate(invite.createdAt)}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  {/* Cancel invite — wire up later if needed */}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog
        open={!!memberToRemove}
        onOpenChange={(v) => !v && setMemberToRemove(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Remove member</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove{" "}
              <span className="font-medium text-foreground">
                {memberToRemove?.name}
              </span>{" "}
              from this project? They will lose access immediately.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              onClick={() => setMemberToRemove(null)}
              disabled={isPending}
              className="h-9 px-3 rounded-md border border-border bg-surface text-sm hover:bg-accent transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={() => void confirmRemove()}
              disabled={isPending}
              className="h-9 px-3.5 rounded-md bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 transition disabled:opacity-50"
            >
              {isPending ? "Removing…" : "Remove member"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
