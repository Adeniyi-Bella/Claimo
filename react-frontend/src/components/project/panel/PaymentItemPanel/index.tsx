import { useMemo } from "react";
import { CheckCircle2, Eye, HardHat, ShieldCheck, Users } from "lucide-react";
import { usePaymentStore, useItem } from "@/hooks/usePaymentStore";
import { derivedStatus, itemTotals } from "@/utils";
import type { ActingRole } from "@/hooks/usePaymentStore";

import { Header } from "./components/Header";
import { Totals } from "./components/Totals";
import { Parties } from "./components/Parties";
import { ClaimHistory } from "./components/ClaimHistory";
import { AuditTrail } from "./components/AuditTrail";
import { ContractorView } from "./tabs/ContractorView";
import { ApproverView } from "./tabs/ApproverView";
import { AdminView } from "./tabs/AdminView";
import { ViewerView } from "./tabs/ViewerView";

const ROLE_OPTIONS: { k: ActingRole; label: string; Icon: typeof Eye }[] = [
  { k: "CONTRACTOR", label: "Contractor", Icon: HardHat },
  { k: "APPROVER", label: "Approver", Icon: ShieldCheck },
  { k: "ADMIN", label: "Admin", Icon: Users },
  { k: "VIEWER", label: "Viewer", Icon: Eye },
];

function RoleSwitcher({
  actingRole,
  setActingRole,
}: {
  actingRole: ActingRole;
  setActingRole: (r: ActingRole) => void;
}) {
  return (
    <div className="rounded-md border border-dashed border-border bg-surface-elevated p-2.5">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5 flex items-center gap-1">
        <Eye className="h-3 w-3" /> Viewing as (demo)
      </div>
      <div className="grid grid-cols-4 gap-1">
        {ROLE_OPTIONS.map(({ k, label, Icon }) => (
          <button
            key={k}
            onClick={() => setActingRole(k)}
            className={`h-7 px-2 rounded text-[11px] inline-flex items-center justify-center gap-1 transition
              ${actingRole === k
                ? "bg-primary text-primary-foreground font-medium"
                : "text-muted-foreground hover:bg-accent"}`}
          >
            <Icon className="h-3 w-3" />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function PaymentItemPanel({ itemId }: { itemId: string }) {
  const item = useItem(itemId);
  const actingRole = usePaymentStore((s) => s.actingRole);
  const setActingRole = usePaymentStore((s) => s.setActingRole);

  const totals = useMemo(() => (item ? itemTotals(item) : null), [item]);
  const status = useMemo(() => (item ? derivedStatus(item) : null), [item]);

  if (!item || !totals || !status) return null;

  return (
    <div className="flex flex-col h-full">
      <Header item={item} status={status} />
      <div className="p-5 space-y-5 overflow-y-auto">
        <RoleSwitcher actingRole={actingRole} setActingRole={setActingRole} />
        <Totals item={item} totals={totals} />
        <Parties item={item} />

        {status === "COMPLETED" && (
          <div className="rounded-md border border-status-approved-fg/30 bg-status-approved/40 p-3 text-sm text-status-approved-fg flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" /> Fully claimed & approved. This item is complete.
          </div>
        )}

        {actingRole === "CONTRACTOR" && (
          <ContractorView item={item} totals={totals} status={status} />
        )}
        {actingRole === "APPROVER" && <ApproverView item={item} />}
        {actingRole === "ADMIN" && <AdminView item={item} />}
        {actingRole === "VIEWER" && <ViewerView />}

        <ClaimHistory claims={item.claims} />
        <AuditTrail entries={item.auditTrail ?? []} />
      </div>
    </div>
  );
}