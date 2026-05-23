import { Receipt, Link2, Link2Off } from "lucide-react";
import { Button } from "@/components/common/button";
import { ScrollArea } from "@/components/common/scroll-area";
import { cn } from "@/lib/utils/utils";
import { useMemo } from "react";
import { getElementPaymentMap } from "../state/selectors";
import type { PaymentItemLocal } from "../state/types";
import { useViewerStore } from "../state/store";

const EUR = new Intl.NumberFormat("en-IE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

type ClaimStatusDisplay = "approved" | "submitted" | "rejected" | "not_started";

function deriveStatus(item: PaymentItemLocal): ClaimStatusDisplay {
  const claims = item.claims;
  if (!claims || claims.length === 0) return "not_started";
  const approved = claims.filter((c: any) => c.status === "APPROVED");
  const submitted = claims.filter((c: any) => c.status === "SUBMITTED");
  const approvedTotal = approved.reduce((s: number, c: any) => s + c.amount, 0);
  if (approvedTotal >= item.contractValue) return "approved";
  if (submitted.length > 0) return "submitted";
  if (approved.length > 0) return "submitted";
  return "not_started";
}

const statusMeta: Record<
  ClaimStatusDisplay,
  { barVar: string }
> = {
  approved: { barVar: "var(--status-approved-fg)" },
  submitted: { barVar: "var(--status-submitted-fg)" },
  rejected: { barVar: "var(--status-rejected-fg)" },
  not_started: { barVar: "var(--status-neutral)" },
};

function PaymentCard({
  item,
  highlight,
  selectedAttached,
}: {
  item: PaymentItemLocal;
  highlight?: boolean;
  selectedAttached?: number;
}) {
  const status = deriveStatus(item);
  const m = statusMeta[status];
  const approvedTotal = item.claims
    .filter((c: any) => c.status === "APPROVED")
    .reduce((s: number, c: any) => s + c.amount, 0);
  const pct =
    item.contractValue > 0
      ? Math.round((approvedTotal / item.contractValue) * 100)
      : 0;

  return (
    <div
      className={cn(
        "relative rounded-md border px-3 py-2.5 transition-colors",
        highlight
          ? "border-(--status-selected)/60 bg-card"
          : "border-(--viewer-panel-border) bg-card/30 hover:bg-card/50",
      )}
    >
      <span
        className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full"
        style={{ background: m.barVar }}
      />
      <div className="flex items-start justify-between gap-2 mb-1.5 pl-2">
        <div className="min-w-0">
          <div className="text-[10px] font-mono text-muted-foreground">
            {item.category}
          </div>
          <div className="text-xs font-semibold truncate">
            {item.description || item.category}
          </div>
          <div className="text-[10px] text-muted-foreground truncate">
            {item.contractorName}
          </div>
        </div>
      </div>
      <div className="pl-2 mb-1.5">
        <div className="h-1 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${pct}%`, background: m.barVar }}
          />
        </div>
      </div>
      <div className="flex items-center justify-between pl-2">
        <div className="text-xs font-mono tabular-nums text-foreground">
          {EUR.format(approvedTotal)}{" "}
          <span className="text-muted-foreground text-[10px]">
            / {EUR.format(item.contractValue)}
          </span>
        </div>
        <div className="text-[10px] text-muted-foreground">
          {item.attachedElementIds.length} el.
          {selectedAttached !== undefined && selectedAttached > 0 && (
            <span style={{ color: "var(--status-selected)" }}>
              {" "}
              · {selectedAttached} sel.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function NoSelectionView() {
  const paymentItems = useViewerStore((s) => s.paymentItems);
  const totals = useMemo(() => {
    const approved = paymentItems.reduce((acc, item) => {
      return (
        acc +
        item.claims
          .filter((c: any) => c.status === "APPROVED")
          .reduce((s: number, c: any) => s + c.amount, 0)
      );
    }, 0);
    const submitted = paymentItems.reduce((acc, item) => {
      return (
        acc +
        item.claims
          .filter((c: any) => c.status === "SUBMITTED")
          .reduce((s: number, c: any) => s + c.amount, 0)
      );
    }, 0);
    const contract = paymentItems.reduce((acc, i) => acc + i.contractValue, 0);
    return { approved, submitted, contract };
  }, [paymentItems]);

  return (
    <div className="flex flex-col h-full">
      <div
        className="px-4 py-3 border-b shrink-0"
        style={{ borderColor: "var(--viewer-panel-border)" }}
      >
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
          Contract overview
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Contract", value: totals.contract, varName: "status-pending-fg" },
            { label: "Approved", value: totals.approved, varName: "status-approved-fg" },
            { label: "Submitted", value: totals.submitted, varName: "status-submitted-fg" },
          ].map(({ label, value, varName }) => (
            <div
              key={label}
              className="rounded border px-2 py-1.5"
              style={{
                borderColor: "var(--viewer-panel-border)",
                background: "oklch(1 0 0 / 3%)",
              }}
            >
              <div
                className="text-[9px] font-medium uppercase tracking-wider"
                style={{ color: `var(--${varName})` }}
              >
                {label}
              </div>
              <div className="text-xs font-mono tabular-nums mt-0.5">
                {EUR.format(value)}
              </div>
            </div>
          ))}
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {paymentItems.length === 0 && (
            <div className="text-xs text-muted-foreground text-center py-8">
              No payment items on this model
            </div>
          )}
          {paymentItems.map((item) => (
            <PaymentCard key={item.id} item={item} />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

function SelectionView() {
  const selectedIds = useViewerStore((s) => s.selectedIds);
  const paymentItems = useViewerStore((s) => s.paymentItems);
  const attach = useViewerStore((s) => s.attachSelectionToPayment);
  const detach = useViewerStore((s) => s.detachSelectionFromPayment);
  const selectedCount = selectedIds.size;
  const paymentMap = useMemo(
    () => getElementPaymentMap(paymentItems),
    [paymentItems],
  );

  const grouping = useMemo(() => {
    const attached: Record<string, string[]> = {};
    const unattachedCount = Array.from(selectedIds).filter(
      (id) => !paymentMap.has(id),
    ).length;
    for (const id of selectedIds) {
      const p = paymentMap.get(id);
      if (p) {
        attached[p.id] ??= [];
        attached[p.id].push(id);
      }
    }
    return { attached, unattachedCount };
  }, [selectedIds, paymentMap]);

  return (
    <div className="flex flex-col h-full">
      <div
        className="px-4 py-3 border-b shrink-0"
        style={{
          borderColor: "var(--viewer-panel-border)",
          background: "oklch(0.7 0.13 255 / 5%)",
        }}
      >
        <div className="flex items-center justify-between">
          <div
            className="text-[10px] uppercase tracking-wider font-semibold"
            style={{ color: "var(--status-selected)" }}
          >
            Selection
          </div>
          <span className="text-xs font-mono tabular-nums text-foreground">
            {selectedCount} element{selectedCount !== 1 ? "s" : ""}
          </span>
        </div>
        {grouping.unattachedCount > 0 && (
          <div className="text-[10px] text-muted-foreground mt-1">
            {grouping.unattachedCount} not yet attached to any claim
          </div>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {Object.keys(grouping.attached).length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 px-1">
                Currently attached to
              </div>
              <div className="space-y-2">
                {Object.entries(grouping.attached).map(([pid, ids]) => {
                  const item = paymentItems.find((x) => x.id === pid);
                  if (!item) return null;
                  return (
                    <div key={pid} className="space-y-1.5">
                      <PaymentCard
                        item={item}
                        highlight
                        selectedAttached={ids.length}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full h-7 text-xs gap-1.5 bg-transparent"
                        style={{
                          borderColor: "var(--status-rejected-fg)",
                          color: "var(--status-rejected-fg)",
                        }}
                        onClick={() => detach(pid)}
                      >
                        <Link2Off className="h-3 w-3" />
                        Detach {ids.length} element{ids.length !== 1 ? "s" : ""}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 px-1">
              Attach selection to
            </div>
            <div className="space-y-2">
              {paymentItems.map((item) => (
                <div key={item.id} className="space-y-1.5">
                  <PaymentCard item={item} />
                  <Button
                    size="sm"
                    className="w-full h-7 text-xs gap-1.5 bg-primary/90 hover:bg-primary text-primary-foreground"
                    onClick={() => attach(item.id)}
                  >
                    <Link2 className="h-3 w-3" />
                    Attach to {item.category}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

export function RightPanel() {
  const hasSelection = useViewerStore((s) => s.selectedIds.size > 0);

  return (
    <aside
      className="w-80 flex flex-col shrink-0 border-l"
      style={{
        background: "var(--viewer-panel)",
        borderColor: "var(--viewer-panel-border)",
      }}
    >
      <div
        className="h-10 px-4 flex items-center gap-2 border-b shrink-0"
        style={{ borderColor: "var(--viewer-panel-border)" }}
      >
        <Receipt className="h-4 w-4 text-primary" />
        <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground">
          Payment Claims
        </h2>
      </div>
      {hasSelection ? <SelectionView /> : <NoSelectionView />}
    </aside>
  );
}
