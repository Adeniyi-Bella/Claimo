import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/common/dialog";
import type { ProjectResponse, ProjectRole } from "@/api/dto/responseDto";
import { useInviteMemberToProject } from "@/hooks/api/projects/useInviteMemberToProject";
import { ApiError } from "@/api/error/customeError";
import { toast } from "@/hooks/use-toast";

const ROLE_OPTIONS: { value: ProjectRole; label: string }[] = [
  { value: "CONTRACTOR", label: "Contractor — can submit claims" },
  { value: "APPROVER", label: "Approver — reviews and approves claims" },
  { value: "ADMIN", label: "Admin — full project control" },
  { value: "VIEWER", label: "Viewer — read-only access" },
];

export default function InviteModal({
  open,
  onOpenChange,
  project,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  project: ProjectResponse;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<ProjectRole>("CONTRACTOR");
  const [error, setError] = useState("");

  const { mutateAsync: inviteMemberToProject, isPending } = useInviteMemberToProject(project.id);

  const reset = () => {
    setName("");
    setEmail("");
    setRole("CONTRACTOR");
    setError("");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      await inviteMemberToProject({ fullName: name.trim(), email: email.trim(), role });
      reset();
      onOpenChange(false);
      toast({
        title: "Invitation sent",
        description: `${email.trim()} has been invited to the project.`,
      });
    } catch (err: unknown) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Failed to send invite. Please try again.";
      setError(message);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!isPending) {
          reset();
          onOpenChange(v);
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>Add member to project</DialogTitle>
            <DialogDescription>
              Add a team member directly to this project with the appropriate
              role.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div>
              <label className="text-xs font-medium">Full name</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1.5 w-full h-9 rounded-md border border-input bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
                placeholder="Sofia van Dijk"
              />
            </div>
            <div>
              <label className="text-xs font-medium">Email</label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 w-full h-9 rounded-md border border-input bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
                placeholder="name@company.com"
              />
            </div>
            <div>
              <label className="text-xs font-medium">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as ProjectRole)}
                className="mt-1.5 w-full h-9 rounded-md border border-input bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
              >
                {ROLE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            {error && <div className="text-xs text-red-500">{error}</div>}
          </div>
          <DialogFooter>
            <button
              type="button"
              disabled={isPending}
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
              className="h-9 px-3 rounded-md border border-border bg-surface text-sm hover:bg-accent transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="h-9 px-3.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition disabled:opacity-50"
            >
              {isPending ? "Sending…" : "Add member"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
