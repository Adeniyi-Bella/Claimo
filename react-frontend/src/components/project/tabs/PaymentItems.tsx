import { Avatar } from "@/components/common/avatar";
import { StatusBadge } from "@/components/common/status-badge";
import {
  fmtCurrency,
  fmtDate,
  type Project,
  type PaymentItem,
  itemTotals,
  derivedStatus,
} from "@/lib/mock-data";
import { Filter, Plus, Search } from "lucide-react";

export default function PaymentItemsTab({
  items,
  onPick,
  onAdd,
}: {
  items: PaymentItem[];
  project: Project;
  onPick: (i: PaymentItem) => void;
  onAdd: () => void;
}) {
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            placeholder="Search items…"
            className="w-full h-9 rounded-md border border-input bg-surface pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
        </div>
        {["Model", "Category", "Status", "Contractor"].map((f) => (
          <button
            key={f}
            className="h-9 px-3 inline-flex items-center gap-1.5 rounded-md border border-border bg-surface text-sm text-muted-foreground hover:bg-accent transition"
          >
            <Filter className="h-3 w-3" /> {f}
          </button>
        ))}
        <button
          onClick={onAdd}
          className="ml-auto h-9 px-3.5 inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition shadow-soft"
        >
          <Plus className="h-4 w-4" /> Add payment item
        </button>
      </div>
      <Card>
        <table className="w-full text-sm">
          <thead className="bg-surface-elevated text-xs text-muted-foreground">
            <tr>
              <th className="text-left font-medium px-4 py-2.5">Category</th>
              <th className="text-left font-medium px-4 py-2.5">Model</th>
              <th className="text-left font-medium px-4 py-2.5">Contractor</th>
              <th className="text-right font-medium px-4 py-2.5">Contract</th>
              <th className="text-right font-medium px-4 py-2.5">Submitted</th>
              <th className="text-left font-medium px-4 py-2.5">Status</th>
              <th className="text-left font-medium px-4 py-2.5">Updated</th>
              <th className="text-left font-medium px-4 py-2.5">Job Status</th>
              <th className="text-left font-medium px-4 py-2.5">Payment</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.map((i) => (
              <tr
                key={i.id}
                onClick={() => onPick(i)}
                className="hover:bg-accent/40 cursor-pointer transition"
              >
                <td className="px-4 py-3 font-medium">{i.category}</td>
                <td className="px-4 py-3 text-muted-foreground truncate max-w-[200px]">
                  {i.modelName}
                </td>
                <td className="px-4 py-3">
                  <div className="inline-flex items-center gap-2">
                    <Avatar
                      name={i.contractorName}
                      hue={(i.contractorId.charCodeAt(1) * 70) % 360}
                      size={22}
                    />
                    <span>{i.contractorName.split(" ")[0]}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {fmtCurrency(i.contractValue)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                  {(() => {
                    const t = itemTotals(i);
                    return t.pending > 0
                      ? fmtCurrency(t.pending)
                      : t.approved > 0
                        ? fmtCurrency(t.approved)
                        : "—";
                  })()}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={derivedStatus(i)} />
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {fmtDate(i.updatedAt)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`text-[11px] font-medium px-2 py-0.5 rounded-full border
    ${
      (i.jobStatus ?? "NOT_STARTED") === "COMPLETED"
        ? "bg-status-approved text-status-approved-fg border-status-approved-fg/20"
        : (i.jobStatus ?? "NOT_STARTED") === "IN_PROGRESS"
          ? "bg-status-submitted text-status-submitted-fg border-status-submitted-fg/20"
          : "bg-muted text-muted-foreground border-border"
    }`}
                  >
                    {(i.jobStatus ?? "NOT_STARTED") === "NOT_STARTED"
                      ? "Not Started"
                      : (i.jobStatus ?? "NOT_STARTED") === "IN_PROGRESS"
                        ? "In Progress"
                        : "Completed"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`text-[11px] font-medium px-2 py-0.5 rounded-full border
    ${
      (i.paymentStatus ?? "NONE") === "APPROVED"
        ? "bg-status-approved text-status-approved-fg border-status-approved-fg/20"
        : (i.paymentStatus ?? "NONE") === "PAID"
          ? "bg-status-submitted text-status-submitted-fg border-status-submitted-fg/20"
          : (i.paymentStatus ?? "NONE") === "REJECTED"
            ? "bg-status-rejected text-status-rejected-fg border-status-rejected-fg/20"
            : "bg-muted text-muted-foreground border-border"
    }`}
                  >
                    {(i.paymentStatus ?? "NONE").charAt(0) +
                      (i.paymentStatus ?? "NONE").slice(1).toLowerCase()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-4 py-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Showing {items.length} of {items.length} items
          </span>
          <div className="flex gap-1">
            <button
              disabled
              className="h-7 px-2 rounded border border-border bg-surface disabled:opacity-50"
            >
              Previous
            </button>
            <button
              disabled
              className="h-7 px-2 rounded border border-border bg-surface disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-surface shadow-soft">
      {children}
    </div>
  );
}
