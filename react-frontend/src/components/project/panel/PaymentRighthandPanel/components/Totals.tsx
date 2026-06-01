import { fmtCurrency } from "@/utils";
import type { PaymentItem } from "@/api/dto/responseDto";
import type { ItemTotals } from "@/utils";

function Mini({
  label,
  value,
  dot,
}: {
  label: string;
  value: string;
  dot: string;
}) {
  return (
    <div>
      <div className="inline-flex items-center gap-1 text-muted-foreground">
        <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
        {label}
      </div>
      <div className="mt-0.5 text-xs font-semibold tabular-nums">{value}</div>
    </div>
  );
}

export function Totals({
  item,
  totals,
}: {
  item: PaymentItem;
  totals: ItemTotals;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface-elevated p-4">
      <div className="flex items-baseline justify-between">
        <div>
          <div className="text-xs text-muted-foreground">Approved to date</div>
          <div className="text-xl font-semibold tabular-nums">
            {fmtCurrency(totals.approved)}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[11px] text-muted-foreground">of contract</div>
          <div className="text-sm font-medium tabular-nums">
            {fmtCurrency(item.contractValue)}
          </div>
        </div>
      </div>
      <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden flex">
        <div
          className="bg-status-approved-fg h-full"
          style={{ width: `${totals.approvedPct}%` }}
        />
        <div
          className="bg-status-submitted-fg h-full"
          style={{ width: `${totals.pendingPct}%` }}
        />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
        <Mini
          label="Pending"
          value={fmtCurrency(totals.pending)}
          dot="bg-status-submitted-fg"
        />
        <Mini
          label="Remaining"
          value={fmtCurrency(totals.remaining)}
          dot="bg-muted-foreground/40"
        />
        <Mini
          label="Approved %"
          value={`${Math.round(totals.approvedPct)}%`}
          dot="bg-status-approved-fg"
        />
      </div>
    </div>
  );
}
