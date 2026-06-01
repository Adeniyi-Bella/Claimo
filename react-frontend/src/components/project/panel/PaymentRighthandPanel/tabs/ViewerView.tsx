import { Eye } from "lucide-react";

export function ViewerView() {
  return (
    <div className="rounded-md border border-border bg-surface-elevated p-3 text-xs text-muted-foreground flex items-center gap-2">
      <Eye className="h-3.5 w-3.5" /> Read-only access.
    </div>
  );
}