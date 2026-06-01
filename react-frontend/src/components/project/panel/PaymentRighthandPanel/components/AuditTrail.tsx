import type { AuditEntry } from "@/api/dto/responseDto";

export function AuditTrail({ entries }: { entries: AuditEntry[] }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
        Audit Trail
      </div>
      {entries.length === 0 ? (
        <div className="text-xs text-muted-foreground rounded-md border border-dashed border-border p-4 text-center">
          No activity yet.
        </div>
      ) : (
        <ol className="space-y-2">
          {entries
            .slice()
            .reverse()
            .map((entry) => (
              <li key={entry.id} className="flex gap-2.5 text-[11px]">
                <span className="mt-1 h-2 w-2 rounded-full shrink-0 bg-muted-foreground/40" />
                <div>
                  <span className="font-medium text-foreground">{entry.actorName}</span>
                  <span className="text-muted-foreground"> · {entry.action}</span>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    {new Date(entry.timestamp).toLocaleString()}
                  </div>
                </div>
              </li>
            ))}
        </ol>
      )}
    </div>
  );
}