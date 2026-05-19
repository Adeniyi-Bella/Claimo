import { cn } from "@/lib/utils/utils";
import type { PaymentStatus } from "@/lib/mock-data";

const styles: Record<
  PaymentStatus | "PENDING_INVITE",
  { dot: string; bg: string; fg: string; label: string }
> = {
  NOT_STARTED: {
    dot: "bg-status-pending-fg/60",
    bg: "bg-status-pending",
    fg: "text-status-pending-fg",
    label: "Not started",
  },
  SUBMITTED: {
    dot: "bg-status-submitted-fg",
    bg: "bg-status-submitted",
    fg: "text-status-submitted-fg",
    label: "Submitted",
  },
  APPROVED: {
    dot: "bg-status-approved-fg",
    bg: "bg-status-approved",
    fg: "text-status-approved-fg",
    label: "Approved",
  },
  REJECTED: {
    dot: "bg-status-rejected-fg",
    bg: "bg-status-rejected",
    fg: "text-status-rejected-fg",
    label: "Rejected",
  },
  IN_PROGRESS: {
    dot: "bg-status-submitted-fg",
    bg: "bg-status-submitted/50",
    fg: "text-status-submitted-fg",
    label: "In progress",
  },
  COMPLETED: {
    dot: "bg-status-approved-fg",
    bg: "bg-status-approved",
    fg: "text-status-approved-fg",
    label: "Completed",
  },
  PENDING_INVITE: {
    dot: "bg-status-invite-fg",
    bg: "bg-status-invite",
    fg: "text-status-invite-fg",
    label: "Pending invite",
  },
};

export function StatusBadge({
  status,
  className,
}: {
  status: PaymentStatus | "PENDING_INVITE";
  className?: string;
}) {
  const s = styles[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        s.bg,
        s.fg,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
      {s.label}
    </span>
  );
}

export function RoleBadge({ role }: { role: string }) {
  const tone =
    role === "ADMIN" || role === "ACCOUNT_OWNER"
      ? "bg-primary/10 text-primary border-primary/15"
      : role === "CONTRACTOR"
        ? "bg-status-submitted text-status-submitted-fg border-status-submitted-fg/10"
        : role === "APPROVER"
          ? "bg-status-approved text-status-approved-fg border-status-approved-fg/10"
          : "bg-muted text-muted-foreground border-border";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium tracking-wide uppercase",
        tone,
      )}
    >
      {role.replace("_", " ")}
    </span>
  );
}
