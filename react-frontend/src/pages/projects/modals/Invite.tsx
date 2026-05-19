import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription, DialogFooter,
} from "@/components/common/dialog";
import type { Member, Project, ProjectRole } from "@/lib/mock-data";

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
  onInvite,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  project: Project;
  onInvite: (member: Member) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<ProjectRole>("CONTRACTOR");
  const [error, setError] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError("Name and email are required.");
      return;
    }
    if (project.members.some((m) => m.email === email.trim())) {
      setError("This email is already a member of this project.");
      return;
    }

    const member: Member = {
      id: `m-${Date.now()}`,
      name: name.trim(),
      email: email.trim(),
      role,
      joined: new Date().toISOString().slice(0, 10),
      avatarHue: Math.floor(Math.random() * 360),
    };

    onInvite(member);
    setName("");
    setEmail("");
    setRole("CONTRACTOR");
    setError("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>Add member to project</DialogTitle>
            <DialogDescription>
              Add a team member directly to this project with the appropriate role.
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
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            {error && (
              <div className="text-xs text-red-500">{error}</div>
            )}
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="h-9 px-3 rounded-md border border-border bg-surface text-sm hover:bg-accent transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-9 px-3.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition"
            >
              Add member
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}