export default function Stat({
  label,
  value,
  Icon,
  tone,
}: {
  label: string;
  value: string;
  Icon: any;
  tone?: "approved" | "submitted" | "rejected";
}) {
  const toneCls =
    tone === "approved"
      ? "text-status-approved-fg bg-status-approved"
      : tone === "submitted"
        ? "text-status-submitted-fg bg-status-submitted"
        : tone === "rejected"
          ? "text-status-rejected-fg bg-status-rejected"
          : "text-primary bg-accent";
  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-soft">
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium text-muted-foreground">{label}</div>
        <span
          className={`h-7 w-7 rounded-md inline-flex items-center justify-center ${toneCls}`}
        >
          <Icon className="h-3.5 w-3.5" />
        </span>
      </div>
      <div className="mt-3 text-xl font-semibold tracking-tight tabular-nums">
        {value}
      </div>
    </div>
  );
}
