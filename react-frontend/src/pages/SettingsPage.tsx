import { useState } from "react";
import { Avatar } from "@/components/common/avatar";
import { RoleBadge } from "@/components/common/status-badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/common/dialog";
import { Button } from "@/components/common/button";
import { Input } from "@/components/common/input";
import { Label } from "@/components/common/label";
import {
  AlertTriangle,
  Building2,
  Clock,
  Lock,
  Mail,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { useReverification, useUser } from "@clerk/react";
import { useNavigate } from "@tanstack/react-router";
import { useGetCompanyWithMember } from "@/hooks/api/company/useGetCompanyWithMember";
import type { CompanyRole } from "@/api/dto/responseDto";
import { useInviteMemberToCompany } from "@/hooks/api/company/useInviteMemberToCompany";
import { useCancelCompanyInvite } from "@/hooks/api/company/useCancelCompanyInvite";
import { useRemoveCompanyMember } from "@/hooks/api/company/useRemoveCompanyMember";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { user } = useUser();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: companyWithMembers, isLoading: companyLoading } =
    useGetCompanyWithMember();
  const { mutateAsync: inviteMemberToCompany, isPending: inviteMemberPending } =
    useInviteMemberToCompany(companyWithMembers?.companyId);
  const { mutateAsync: cancelInvite } = useCancelCompanyInvite(
    companyWithMembers?.companyId,
  );
  const { mutateAsync: removeMember } = useRemoveCompanyMember(
    companyWithMembers?.companyId,
  );

  const currentUser = {
    name: user?.fullName ?? user?.firstName ?? "User",
    email: user?.primaryEmailAddress?.emailAddress ?? "",
    avatarHue: 250,
  };

  const [open, setOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePending, setDeletePending] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<CompanyRole>("MEMBER");
  const [inviteError, setInviteError] = useState("");
  const [cancellingInviteId, setCancellingInviteId] = useState<string | null>(
    null,
  );
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);

  const submitInvite = async (e: React.SubmitEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setInviteError("");
    // Cannot invite yourself
    if (email.toLowerCase().trim() === currentUser.email.toLowerCase()) {
      setInviteError("You cannot invite yourself.");
      return;
    }

    // Cannot reinvite a pending user
    const isPending = companyWithMembers?.companyPendingInviteStatus.some(
      (i) =>
        i.email.toLowerCase() === email.toLowerCase().trim() &&
        i.status === "PENDING",
    );
    if (isPending) {
      setInviteError("This email already has a pending invite.");
      return;
    }

    // Cannot invite existing member
    const isMember = companyWithMembers?.members.some(
      (m) => m.email.toLowerCase() === email.toLowerCase().trim(),
    );
    if (isMember) {
      setInviteError("This person is already a member.");
      return;
    }

    try {
      await inviteMemberToCompany({ name, email, role });
      setName("");
      setEmail("");
      setRole("MEMBER");
      setOpen(false);
    } catch (error) {
      setInviteError(
        error instanceof Error ? error.message : "Failed to send invite.",
      );
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    setCancellingInviteId(inviteId);
    try {
      await cancelInvite(inviteId);
    } catch (error) {
      toast({
        title: "Failed to cancel invite",
        description:
          error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setCancellingInviteId(null);
    }
  };

  const handleDeleteAccount = useReverification(async () => {
    if (!user || deletePending) return;

    setDeletePending(true);
    setDeleteError("");

    try {
      await user.delete();
      navigate({ to: "/" });
    } catch (error) {
      setDeleteError(
        error instanceof Error
          ? error.message
          : "We couldn't delete your account right now.",
      );
    } finally {
      setDeletePending(false);
    }
  });

  const handleRemoveMember = async (userId: string) => {
    setRemovingMemberId(userId);
    try {
      await removeMember(userId);
    } catch (error) {
      toast({
        title: "Failed to remove member",
        description:
          error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setRemovingMemberId(null);
    }
  };

  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-8 max-w-4xl">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your profile and company.
        </p>

        {/* Profile */}
        <Section
          title="Profile"
          subtitle="This information is synced with your auth provider."
        >
          <div className="flex items-center gap-4">
            <Avatar
              name={currentUser.name}
              hue={currentUser.avatarHue}
              size={56}
            />
            <div>
              <div className="text-sm font-medium">{currentUser.name}</div>
              <div className="text-xs text-muted-foreground">
                {currentUser.email}
              </div>
            </div>
            <button className="ml-auto h-8 px-3 rounded-md border border-border bg-surface text-xs hover:bg-accent">
              Change avatar
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="First name" defaultValue="Elena" />
            <Field label="Last name" defaultValue="Marchetti" />
            <Field
              label="Email"
              icon={Mail}
              disabled
              defaultValue={currentUser.email}
            />
            <Field
              label="Password"
              icon={Lock}
              disabled
              defaultValue="••••••••"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button className="h-9 px-3 rounded-md border border-border bg-surface text-sm hover:bg-accent">
              Cancel
            </button>
            <button className="h-9 px-3.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 shadow-soft">
              Save changes
            </button>
          </div>
        </Section>

        {/* Company */}
        <Section title="Company" subtitle="Manage your workspace and members.">
          <Field
            label="Company name"
            icon={Building2}
            defaultValue={companyWithMembers?.companyName ?? ""}
            disabled={companyLoading}
          />

          <div>
            <div className="flex items-center justify-between mb-3 mt-2">
              <div className="text-sm font-medium">Members</div>
              <button
                onClick={() => setOpen(true)}
                className="h-8 px-3 inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 shadow-soft"
              >
                <UserPlus className="h-3.5 w-3.5" /> Invite member
              </button>
            </div>
            <div className="rounded-lg border border-border bg-surface divide-y divide-border">
              {companyWithMembers?.members.map((m) => {
                const isAccountOwner =
                  companyWithMembers.role === "ACCOUNT_OWNER";
                const canRemove = isAccountOwner && m.role !== "ACCOUNT_OWNER";

                return (
                  <div
                    key={m.userId}
                    className="flex items-center gap-3 px-4 py-3"
                  >
                    <Avatar
                      name={m.firstName + " " + m.lastName}
                      hue={0}
                      size={32}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">
                        {m.firstName} {m.lastName}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {m.email}
                      </div>
                    </div>
                    <RoleBadge role={m.role} />
                    {canRemove && (
                      <button
                        onClick={() => void handleRemoveMember(m.userId)}
                        disabled={removingMemberId === m.userId}
                        className="text-xs text-muted-foreground hover:text-destructive transition disabled:opacity-50"
                      >
                        {removingMemberId === m.userId
                          ? "Removing..."
                          : "Remove"}
                      </button>
                    )}
                  </div>
                );
              })}

              {companyWithMembers?.companyPendingInviteStatus
                .filter((i) => i.status === "PENDING")
                .map((i) => {
                  const isAccountOwner =
                    companyWithMembers.role === "ACCOUNT_OWNER";

                  return (
                    <div
                      key={i.inviteId}
                      className="flex items-center gap-3 px-4 py-3 opacity-60"
                    >
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium truncate text-muted-foreground">
                          {i.email}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Pending invite
                        </div>
                      </div>
                      <RoleBadge role={i.role} />
                      {isAccountOwner && (
                        <button
                          onClick={() => void handleCancelInvite(i.inviteId)}
                          disabled={cancellingInviteId === i.inviteId}
                          className="text-xs text-muted-foreground hover:text-destructive transition disabled:opacity-50"
                        >
                          {cancellingInviteId === i.inviteId
                            ? "Cancelling..."
                            : "Cancel"}
                        </button>
                      )}
                    </div>
                  );
                })}

              {!companyLoading &&
                !companyWithMembers?.members.length &&
                !companyWithMembers?.companyPendingInviteStatus.length && (
                  <div className="px-4 py-8 text-center">
                    <Users className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
                    <div className="text-sm font-medium">No teammates yet</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Invite people to collaborate on your projects.
                    </div>
                  </div>
                )}
            </div>
          </div>
        </Section>

        {/* Danger zone */}
        <Section title="Danger zone" subtitle="Irreversible actions.">
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="text-sm font-medium">Delete company</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Permanently delete the company, all projects, models and payment
                data. This cannot be undone.
              </div>
            </div>
            <button
              type="button"
              onClick={() => setDeleteOpen(true)}
              className="h-8 px-3 inline-flex items-center gap-1.5 rounded-md bg-destructive text-destructive-foreground text-xs font-medium hover:opacity-90 transition"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete company
            </button>
          </div>
        </Section>
      </div>

      <Dialog
        open={open}
        onOpenChange={(v) => {
          if (!inviteMemberPending) {
            setName("");
            setEmail("");
            setRole("MEMBER");
            setInviteError("");
            setOpen(v);
          }
        }}
      >
        <DialogContent>
          <form onSubmit={submitInvite}>
            <DialogHeader>
              <DialogTitle>Invite a teammate</DialogTitle>
              <DialogDescription>
                They'll receive an invite and appear as{" "}
                <span className="font-medium">Pending invite</span> until they
                accept.
              </DialogDescription>
              {inviteError && (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {inviteError}
                </div>
              )}
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label htmlFor="invite-name">Full name</Label>
                <Input
                  id="invite-name"
                  placeholder="e.g. Marcus Hale"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="invite-email">Work email</Label>
                <Input
                  id="invite-email"
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Role</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(["MEMBER", "ADMIN"] as CompanyRole[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`h-9 rounded-md border text-sm font-medium transition ${
                        role === r
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-surface text-muted-foreground hover:bg-accent"
                      }`}
                    >
                      {r === "ADMIN" ? "Admin" : "Member"}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {role === "ADMIN"
                    ? "Admins can manage members and view all projects."
                    : "Members can only access projects they're assigned to."}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                disabled={inviteMemberPending}
                type="button"
                variant="outline"
                onClick={() => {
                  setInviteError("");
                  setOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={inviteMemberPending}>
                <UserPlus className="h-4 w-4" />{" "}
                {inviteMemberPending ? "Sending…" : "Add member"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete account and company</DialogTitle>
            <DialogDescription>
              This action is irreversible. Deleting your account will
              permanently delete your user account and the company data tied to
              it, including projects, models, members, and payment records owned
              by this account.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-muted-foreground">
            If you are the owner of this company, this will also delete the
            company and any projects it owns. If you are only a member, only
            your own account-linked data will be removed.
          </div>
          {deleteError && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {deleteError}
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={deletePending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={deletePending}
            >
              {deletePending ? "Deleting..." : "Delete permanently"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function Section({
  title,
  subtitle,
  badge,
  children,
}: {
  title: string;
  subtitle: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8 rounded-xl border border-border bg-surface shadow-soft">
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold">{title}</div>
          <div className="text-xs text-muted-foreground">{subtitle}</div>
        </div>
        {badge && (
          <span className="text-[10px] uppercase tracking-wider rounded-full px-2 py-0.5 bg-accent text-primary font-semibold">
            {badge}
          </span>
        )}
      </div>
      <div className="p-6 space-y-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  icon: Icon,
  hint,
  ...rest
}: {
  label: string;
  icon?: any;
  hint?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5">{label}</label>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        )}
        <input
          {...rest}
          className={`w-full h-9 rounded-md border border-input bg-surface ${Icon ? "pl-9" : "pl-3"} pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring/50 disabled:bg-muted disabled:text-muted-foreground transition`}
        />
      </div>
      {hint && (
        <div className="mt-1 text-[11px] text-muted-foreground">{hint}</div>
      )}
    </div>
  );
}
