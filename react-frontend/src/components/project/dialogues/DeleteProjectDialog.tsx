import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/common/dialog";
import { Button } from "@/components/common/button";
import { Input } from "@/components/common/input";
import { Label } from "@/components/common/label";

interface DeleteProjectDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  project: { id: string; name: string };
  onDelete: () => Promise<void>;
  isDeleting?: boolean;
}

export default function DeleteProjectDialog({
  open,
  onOpenChange,
  project,
  onDelete,
  isDeleting = false,
}: DeleteProjectDialogProps) {
  const [confirmation, setConfirmation] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const confirmed = confirmation === project.name;

  const reset = () => {
    setConfirmation("");
    setErrorMessage(null);
  };

  const handleDelete = async () => {
    if (!confirmed) return;
    setErrorMessage(null);
    try {
      await onDelete();
      reset();
      onOpenChange(false);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Could not delete the project.",
      );
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
        <DialogHeader>
          <DialogTitle>Delete project</DialogTitle>
          <DialogDescription>
            This action is irreversible. All models, members, and payment
            records associated with this project will be permanently deleted.
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-muted-foreground">
          All data tied to{" "}
          <span className="font-medium text-foreground">{project.name}</span>{" "}
          will be permanently deleted and cannot be recovered.
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirm-name">
            Type{" "}
            <span className="font-medium text-foreground">{project.name}</span>{" "}
            to confirm
          </Label>
          <Input
            id="confirm-name"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            placeholder={project.name}
            autoComplete="off"
          />
        </div>
        {errorMessage ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {errorMessage}
          </div>
        ) : null}
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              reset();
              onOpenChange(false);
            }}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={!confirmed || isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete permanently"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
