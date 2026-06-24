import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/common/dialog";
import { Label } from "@/components/common/label";
import { Input } from "@/components/common/input";
import { Textarea } from "@/components/common/textarea";
import { Plus } from "lucide-react";
import { Button } from "@/components/common/button";
import type { CreateProjectDialogProps } from "@/types";
import { createProjectSchema, type CreateProjectFormValues } from "@/utils";
import LocationAutocomplete from "@/components/common/location";

export default function CreateProjectDialog({
  open,
  onOpenChange,
  onCreate,
  isSubmitting = false,
}: CreateProjectDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof CreateProjectFormValues, string>>
  >({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const reset = () => {
    setName("");
    setDescription("");
    setLocation("");
    setStartDate(new Date().toISOString().slice(0, 10));
    setFieldErrors({});
    setErrorMessage(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setErrorMessage(null);

    const result = createProjectSchema.safeParse({
      name,
      description,
      location,
      startDate,
    });

    if (!result.success) {
      const errors: Partial<Record<keyof CreateProjectFormValues, string>> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof CreateProjectFormValues;
        if (!errors[field]) {
          errors[field] = issue.message;
        }
      }
      setFieldErrors(errors);
      return;
    }

    try {
      await onCreate(result.data);
      reset();
      onOpenChange(false);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Could not create the project.",
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
      <DialogContent>
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>Create a new project</DialogTitle>
            <DialogDescription>
              Projects hold your 3D models, members, and payment claims.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="proj-name">
                Project name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="proj-name"
                placeholder="e.g. Harbor Tower — Phase II"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              {fieldErrors.name ? (
                <p className="text-sm text-destructive">{fieldErrors.name}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="proj-desc">Description</Label>
              <Textarea
                id="proj-desc"
                rows={3}
                placeholder="Short summary of the project scope."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              {fieldErrors.description ? (
                <p className="text-sm text-destructive">
                  {fieldErrors.description}
                </p>
              ) : null}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="proj-loc">Location</Label>
                <LocationAutocomplete
                  value={location}
                  onChange={setLocation}
                  error={fieldErrors.location}
                />
                {fieldErrors.location ? (
                  <p className="text-sm text-destructive mt-1">
                    {fieldErrors.location}
                  </p>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="proj-date">
                  Start date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="proj-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                {fieldErrors.startDate ? (
                  <p className="text-sm text-destructive">
                    {fieldErrors.startDate}
                  </p>
                ) : null}
              </div>
            </div>
            {errorMessage ? (
              <p className="text-sm text-destructive">{errorMessage}</p>
            ) : null}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              <Plus className="h-4 w-4" />
              {isSubmitting ? "Creating..." : "Create project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
