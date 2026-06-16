import { useMemo, useState } from "react";
import { CheckCircle2, Eye, HardHat, ShieldCheck, Users } from "lucide-react";
import { derivedStatus, itemTotals } from "@/utils";
import type { Member, ProjectRole } from "@/api/dto/responseDto";

import { Header } from "./components/Header";
import { Totals } from "./components/Totals";
import { Parties } from "./components/Parties";
import { ClaimHistory } from "./components/ClaimHistory";
import { AuditTrail } from "./components/AuditTrail";
import { ContractorView } from "./tabs/ContractorView";
import { ApproverView } from "./tabs/ApproverView";
import { AdminView } from "./tabs/AdminView";
import { ViewerView } from "./tabs/ViewerView";
import { DashboardLoader } from "@/components/common/loader/loader";
import { usePaymentItem } from "@/hooks/api/paymentItem/usePaymentItem";

const ROLE_OPTIONS: { k: ProjectRole; label: string; Icon: typeof Eye }[] = [
  { k: "CONTRACTOR", label: "Contractor", Icon: HardHat },
  { k: "APPROVER", label: "Approver", Icon: ShieldCheck },
  { k: "ADMIN", label: "Admin", Icon: Users },
  { k: "VIEWER", label: "Viewer", Icon: Eye },
];

function RoleSwitcher({
  effectiveRole,
  onSwitch,
}: {
  effectiveRole: ProjectRole;
  onSwitch: (r: ProjectRole) => void;
}) {
  return (
    <div className="rounded-md border border-dashed border-border bg-surface-elevated p-2.5">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5 flex items-center gap-1">
        <Eye className="h-3 w-3" /> Acting as
      </div>
      <div className="grid grid-cols-4 gap-1">
        {ROLE_OPTIONS.map(({ k, label, Icon }) => (
          <button
            key={k}
            onClick={() => onSwitch(k)}
            className={`h-7 px-2 rounded text-[11px] inline-flex items-center justify-center gap-1 transition
              ${
                effectiveRole === k
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-muted-foreground hover:bg-accent"
              }`}
          >
            <Icon className="h-3 w-3" />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function PaymentItemPanel({
  itemId,
  projectId,
  currentUserRole,
  members,
}: {
  itemId: string;
  projectId: string;
  currentUserRole: ProjectRole;
  members: Member[];
}) {
  const { data: item, isLoading } = usePaymentItem(projectId, itemId);
  const [actingRole, setActingRole] = useState<ProjectRole | null>(null);

  const effectiveRole: ProjectRole =
    currentUserRole === "SUPER_ADMIN" && actingRole
      ? actingRole
      : currentUserRole;

  const totals = useMemo(() => (item ? itemTotals(item) : null), [item]);
  const status = useMemo(() => (item ? derivedStatus(item) : null), [item]);

  if (isLoading) return <DashboardLoader />;
  if (!item || !totals || !status) return null;

  return (
    <div className="flex flex-col h-full">
      <Header item={item} status={status} />
      <div className="p-5 space-y-5 overflow-y-auto">
        {currentUserRole === "SUPER_ADMIN" && (
          <RoleSwitcher
            effectiveRole={effectiveRole}
            onSwitch={setActingRole}
          />
        )}

        <Totals item={item} totals={totals} />
        <Parties item={item} />

        {status === "COMPLETED" && (
          <div className="rounded-md border border-status-approved-fg/30 bg-status-approved/40 p-3 text-sm text-status-approved-fg flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" /> Fully claimed & approved. This
            item is complete.
          </div>
        )}

        {effectiveRole === "CONTRACTOR" && (
          <ContractorView
            item={item}
            totals={totals}
            status={status}
            projectId={projectId}
            itemId={itemId}
          />
        )}
        {effectiveRole === "APPROVER" && (
          <ApproverView item={item} projectId={projectId} itemId={itemId} />
        )}
        {effectiveRole === "ADMIN" && (
          <AdminView
            item={item}
            members={members}
            projectId={projectId}
            itemId={itemId}
          />
        )}
        {effectiveRole === "VIEWER" && <ViewerView />}

        <ClaimHistory claims={item.claims} />
        <AuditTrail entries={item.auditTrail ?? []} />
      </div>
    </div>
  );
}
