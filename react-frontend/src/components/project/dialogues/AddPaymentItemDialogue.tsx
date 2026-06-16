import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/common/dialog";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/common/button";
import { CATEGORIES } from "@/lib/mock-data";
import type { ProjectResponse } from "@/api/dto/responseDto";
import type { CreatePaymentItemRequestDto } from "@/api/dto/requestDto";
import { CATEGORY_TO_ENUM } from "@/types/constants";

export default function AddPaymentItemDialogue({
  open,
  onOpenChange,
  project,
  onAdd,
  isSubmitting,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  project: ProjectResponse;
  onAdd: (data: CreatePaymentItemRequestDto) => Promise<void>;
  isSubmitting: boolean;
}) {
  const contractors = project.members.filter((m) => m.role === "CONTRACTOR");
  const approvers = project.members.filter((m) => m.role === "APPROVER");

  const [modelId, setModelId] = useState(project.models[0]?.id ?? "");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [contractorId, setContractorId] = useState("");
  const [contractValue, setContractValue] = useState("");
  const [error, setError] = useState("");
  const [approverId, setApproverId] = useState("");

  useEffect(() => {
    setModelId(project.models[0]?.id ?? "");
  }, [project.models]);

  const reset = () => {
    setModelId(project.models[0]?.id ?? "");
    setCategory(CATEGORIES[0]);
    setContractorId("");
    setApproverId("");
    setContractValue("");
    setError("");
  };

  const submit = async (e: React.SubmitEvent) => {
    e.preventDefault();

    if (!modelId) {
      setError("This project has no models yet. Upload a model first.");
      return;
    }

    const enumCategory = CATEGORY_TO_ENUM[category];
    if (!enumCategory) {
      setError("Invalid category selected.");
      return;
    }

    try {
      await onAdd({
        modelId,
        category: enumCategory,
        contractorId,
        approverId,
        contractValue: parseFloat(contractValue) || 0,
      });
      reset();
    } catch {
      setError("Failed to create payment item. Please try again.");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>Add payment item</DialogTitle>
            <DialogDescription>
              Link a category of work to a contractor and contract value.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div>
              <label className="text-xs font-medium">Model</label>
              {project.models.length === 0 ? (
                <div className="mt-1.5 text-xs text-muted-foreground">
                  No models yet — upload a model first.
                </div>
              ) : (
                <select
                  value={modelId}
                  onChange={(e) => setModelId(e.target.value)}
                  className="mt-1.5 w-full h-9 rounded-md border border-input bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
                >
                  {project.models.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <label className="text-xs font-medium">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1.5 w-full h-9 rounded-md border border-input bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
              >
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium">
                Contractor (optional)
              </label>
              <select
                value={contractorId}
                onChange={(e) => setContractorId(e.target.value)}
                className="mt-1.5 w-full h-9 rounded-md border border-input bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
              >
                <option value="">None</option>
                {contractors.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} — {m.email}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium">Approver (optional)</label>
              <select
                value={approverId}
                onChange={(e) => setApproverId(e.target.value)}
                className="mt-1.5 w-full h-9 rounded-md border border-input bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
              >
                <option value="">None</option>
                {approvers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} — {m.email}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium">
                Contract value (EUR)
              </label>
              <input
                type="number"
                min="0"
                required
                value={contractValue}
                onChange={(e) => setContractValue(e.target.value)}
                className="mt-1.5 w-full h-9 rounded-md border border-input bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
                placeholder="0"
              />
            </div>
            {error ? (
              <div className="flex gap-2 text-xs text-red-500 rounded-md bg-red-500/10 border border-red-500/20 p-2.5">
                <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                {error}
              </div>
            ) : (
              <div className="flex gap-2 text-xs text-muted-foreground rounded-md bg-status-invite/40 border border-status-invite-fg/15 p-2.5">
                <AlertCircle className="h-3.5 w-3.5 text-status-invite-fg shrink-0 mt-0.5" />
                Only one item per category per model is allowed.
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              type="button"
              disabled={isSubmitting}
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
