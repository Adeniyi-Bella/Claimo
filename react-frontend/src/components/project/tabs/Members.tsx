import type { Member, Project } from "@/lib/mock-data";
import { RoleBadge } from "@/components/common/status-badge";
import { Avatar } from "@/components/common/avatar";
import { UserPlus } from "lucide-react";
import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription, DialogFooter,
} from "@/components/common/dialog";
import { fmtDate } from "@/lib/mock-data";

export default function MembersTab({
  project,
  onInvite,
  onRemove,
}: {
  project: Project;
  onInvite: () => void;
  onRemove: (memberId: string) => void;
}) {
  const [memberToRemove, setMemberToRemove] = useState<Member | null>(null);

  const confirmRemove = () => {
    if (!memberToRemove) return;
    onRemove(memberToRemove.id);
    setMemberToRemove(null);
  };

  return (
    <>
      <div className="rounded-xl border border-border bg-surface shadow-soft">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <div className="text-sm font-semibold">Project members</div>
            <div className="text-xs text-muted-foreground">
              {project.members.length} members can access this project
            </div>
          </div>
          <button
            onClick={onInvite}
            className="h-9 px-3.5 inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition shadow-soft"
          >
            <UserPlus className="h-4 w-4" /> Invite member
          </button>
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
                      <div className="text-xs text-muted-foreground">{m.email}</div>
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
                  <button
                    onClick={() => setMemberToRemove(m)}
                    className="text-xs text-muted-foreground hover:text-destructive transition"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Remove confirmation dialog */}
      <Dialog open={!!memberToRemove} onOpenChange={(v) => !v && setMemberToRemove(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Remove member</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove{" "}
              <span className="font-medium text-foreground">{memberToRemove?.name}</span>{" "}
              from this project? They will lose access immediately.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              onClick={() => setMemberToRemove(null)}
              className="h-9 px-3 rounded-md border border-border bg-surface text-sm hover:bg-accent transition"
            >
              Cancel
            </button>
            <button
              onClick={confirmRemove}
              className="h-9 px-3.5 rounded-md bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 transition"
            >
              Remove member
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}