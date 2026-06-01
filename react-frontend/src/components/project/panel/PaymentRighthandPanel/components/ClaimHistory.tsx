import { StatusBadge } from "@/components/common/status-badge";
import { fmtCurrency } from "@/utils";
import type { Claim } from "@/api/dto/responseDto";

function ClaimRow({ claim }: { claim: Claim }) {
  return (
    <div className="rounded-md border border-border bg-surface p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-medium">
          Claim #{claim.sequence}{" "}
          <span className="text-muted-foreground font-normal">· {fmtCurrency(claim.amount)}</span>
        </div>
        <StatusBadge status={claim.status} />
      </div>
      {claim.description && (
        <div className="mt-1.5 text-xs text-muted-foreground">{claim.description}</div>
      )}
      <div className="mt-2 text-[11px] text-muted-foreground">
        Submitted by{" "}
        <span className="font-medium text-foreground">{claim.submittedBy}</span>{" "}
        · {new Date(claim.submittedAt).toLocaleString()}
      </div>
      {claim.decidedAt && (
        <div className="mt-1 text-[11px] text-muted-foreground">
          {claim.status === "APPROVED" ? "Approved" : "Rejected"} by{" "}
          <span className="font-medium text-foreground">{claim.decidedBy}</span>{" "}
          · {new Date(claim.decidedAt).toLocaleString()}
        </div>
      )}
      {claim.decisionNote && (
        <div className="mt-2 text-xs italic bg-muted/50 rounded px-2 py-1.5">
          "{claim.decisionNote}"
        </div>
      )}
    </div>
  );
}

export function ClaimHistory({ claims }: { claims: Claim[] }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
        Claim history
      </div>
      {claims.length === 0 ? (
        <div className="text-xs text-muted-foreground rounded-md border border-dashed border-border p-4 text-center">
          No claims submitted yet.
        </div>
      ) : (
        <ol className="space-y-3">
          {claims
            .slice()
            .reverse()
            .map((c, idx, arr) => (
              <li key={c.id} className="relative pl-6">
                <span
                  className={`absolute left-0 top-1.5 h-3 w-3 rounded-full border-2 border-surface
                    ${c.status === "APPROVED" ? "bg-status-approved-fg" : c.status === "REJECTED" ? "bg-status-rejected-fg" : "bg-status-submitted-fg"}`}
                />
                {idx !== arr.length - 1 && (
                  <span className="absolute left-[5px] top-5 -bottom-3 w-px bg-border" />
                )}
                <ClaimRow claim={c} />
              </li>
            ))}
        </ol>
      )}
    </div>
  );
}