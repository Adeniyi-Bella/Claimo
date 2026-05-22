import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/common/dialog";
import type { PaymentItem, Project } from "@/lib/mock-data";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/common/button";

const CATEGORIES = [
  "Foundations",
  "Concrete Works",
  "Reinforcement",
  "Brickwork",
  "Carpentry",
  "Roofing",
  "Plumbing",
  "Electrical",
  "HVAC",
  "Plastering",
  "Tiling",
  "Painting",
  "Glazing",
  "Landscaping",
];

export default function AddPaymentItemModal({
  open,
  onOpenChange,
  project,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  project: Project;
  onAdd: (item: PaymentItem) => void;
}) {
  const contractors = project.members.filter((m) => m.role === "CONTRACTOR");
  const approvers = project.members.filter((m) => m.role === "APPROVER");

  const [modelId, setModelId] = useState(project.models[0]?.id ?? "");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [contractorId, setContractorId] = useState("");
  const [contractValue, setContractValue] = useState("");
  const [error, setError] = useState("");
  const [approverId, setApproverId] = useState("");

  // Sync contractorId whenever project.members changes
  useEffect(() => {
    const first = project.members.find((m) => m.role === "CONTRACTOR");
    setContractorId(first?.id ?? "");
  }, [project.members]);

  useEffect(() => {
    const first = project.members.find((m) => m.role === "APPROVER");
    setApproverId(first?.id ?? "");
  }, [project.members]);

  useEffect(() => {
    setModelId(project.models[0]?.id ?? "");
  }, [project.models]);

  const selectedModel = project.models.find((m) => m.id === modelId);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!modelId) {
      setError("This project has no models yet. Upload a model first.");
      return;
    }
    if (!contractorId) {
      setError(
        "No contractors on this project yet. Add a contractor member first.",
      );
      return;
    }

    const duplicate = selectedModel?.paymentItems.some(
      (i) => i.category === category,
    );
    if (duplicate) {
      setError(
        `A payment item for "${category}" already exists on this model.`,
      );
      return;
    }

    const contractor = project.members.find((m) => m.id === contractorId)!;
    const approver = project.members.find((m) => m.id === approverId)!; // ← move it here
    const model = project.models.find((m) => m.id === modelId)!;

    const item: PaymentItem = {
  id: `pi-${Date.now()}`,
  category,
  modelId,
  modelName: model.name,
  contractorId,
  contractorName: contractor.name,
  approverId,
  approverName: approver.name,
  contractValue: parseFloat(contractValue) || 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  claims: [],
  attachedElementIds: [],        // ← added
  jobStatus: "NOT_STARTED",      // ← added (check your JobStatus enum for valid values)
  paymentStatus: "NONE",       // ← added (check your PaymentStatus enum for valid values)
  paymentConfirmationPending: false, // ← added
  auditTrail: [],                // ← added (note: the error shows "auditTrail", not "auditTrails")
};

    onAdd(item);
    setCategory(CATEGORIES[0]);
    setContractValue("");
    setError("");
    onOpenChange(false);
  };

  const reset = () => {
    setModelId(project.models[0]?.id ?? "");
    setCategory(CATEGORIES[0]);
    setContractorId(
      project.members.find((m) => m.role === "CONTRACTOR")?.id ?? "",
    );
    setApproverId(project.members.find((m) => m.role === "APPROVER")?.id ?? "");
    setContractValue("");
    setError("");
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
              <label className="text-xs font-medium">Contractor</label>
              {contractors.length === 0 ? (
                <div className="mt-1.5 text-xs text-muted-foreground">
                  No contractors on this project yet — add a contractor member
                  first.
                </div>
              ) : (
                <select
                  value={contractorId}
                  onChange={(e) => setContractorId(e.target.value)}
                  className="mt-1.5 w-full h-9 rounded-md border border-input bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
                >
                  {contractors.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} — {m.email}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <label className="text-xs font-medium">Approver</label>
              {approvers.length === 0 ? (
                <div className="mt-1.5 text-xs text-muted-foreground">
                  No approvers on this project yet — add an approver member
                  first.
                </div>
              ) : (
                <select
                  value={approverId}
                  onChange={(e) => setApproverId(e.target.value)}
                  className="mt-1.5 w-full h-9 rounded-md border border-input bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
                >
                  {approvers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} — {m.email}
                    </option>
                  ))}
                </select>
              )}
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
              // type="button"
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
              // className="h-9 px-3 rounded-md border border-border bg-surface text-sm hover:bg-accent transition"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              // className="h-9 px-3.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition"
            >
              Add item
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
