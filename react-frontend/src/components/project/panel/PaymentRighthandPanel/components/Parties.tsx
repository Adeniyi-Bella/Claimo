import { HardHat, ShieldCheck } from "lucide-react";
import { Avatar } from "@/components/common/avatar";
import type { PaymentItem } from "@/api/dto/responseDto";

function Party({
  label,
  name,
  hue,
  icon: Icon,
}: {
  label: string;
  name: string;
  hue: number;
  icon: typeof HardHat;
}) {
  return (
    <div className="rounded-md border border-border bg-surface-elevated p-2.5">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold inline-flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <div className="mt-1.5 flex items-center gap-2">
        <Avatar name={name} hue={hue} size={26} />
        <div className="text-xs font-medium truncate">{name}</div>
      </div>
    </div>
  );
}

export function Parties({ item }: { item: PaymentItem }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Party
        label="Contractor"
        name={item.contractorName}
        hue={(item.contractorId.charCodeAt(1) * 70) % 360}
        icon={HardHat}
      />
      <Party
        label="Approver"
        name={item.approverName}
        hue={(item.approverId.charCodeAt(1) * 70) % 360}
        icon={ShieldCheck}
      />
    </div>
  );
}