import { StatusBadge } from "@/components/common/status-badge";
import type { PaymentItem } from "@/api/dto/responseDto";
import type { PaymentStatus } from "@/types";

export function Header({ item, status }: { item: PaymentItem; status: PaymentStatus }) {
  return (
    <div className="flex items-start justify-between p-5 border-b border-border">
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground truncate">{item.modelName}</div>
        <div className="mt-1 text-lg font-semibold tracking-tight">{item.category}</div>
        <div className="mt-2 flex items-center gap-2">
          <StatusBadge status={status} />
          <span className="text-xs text-muted-foreground">
            · {item.claims.length} claim{item.claims.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>
    </div>
  );
}