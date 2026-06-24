import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/common/dialog";
import { Button } from "@/components/common/button";
import { useToast } from "@/hooks/use-toast";
import { useUpdateProject } from "@/hooks/api/projects/useProject";
import { updateProjectSchema, type UpdateProjectFormValues } from "@/utils";

export default function EditProjectDialog({
  open,
  onOpenChange,
  project,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  project: {
    id: string;
    name: string;
    description?: string;
    location?: string;
    startDate?: string;
    status: "ACTIVE" | "COMPLETED";
  };
}) {
  const { toast } = useToast();
  const { mutateAsync: updateProject, isPending } = useUpdateProject();

  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description);
  const [location, setLocation] = useState(project.location);
  const [startDate, setStartDate] = useState(project.startDate);
  const [status, setStatus] = useState<"ACTIVE" | "COMPLETED">(project.status);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof UpdateProjectFormValues, string>>
  >({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName(project.name ?? "");
      setDescription(project.description ?? "");
      setLocation(project.location ?? "");
      setStartDate(project.startDate ?? "");
      setStatus(project.status);
      setFieldErrors({});
      setErrorMessage(null);
    }
  }, [open, project]);

  const handleSave = async () => {
    console.log(project.status);
    setFieldErrors({});
    setErrorMessage(null);

    const result = updateProjectSchema.safeParse({
      name,
      description,
      location,
      startDate,
      status,
    });

    if (!result.success) {
      const errors: Partial<Record<keyof UpdateProjectFormValues, string>> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof UpdateProjectFormValues;
        if (!errors[field]) {
          errors[field] = issue.message;
        }
      }
      setFieldErrors(errors);
      return;
    }

    try {
      await updateProject({
        projectId: project.id,
        data: result.data,
      });
      toast({
        title: "Project updated",
        description: "The project has been updated successfully.",
        variant: "success",
      });
      onOpenChange(false);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Could not update the project.",
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit project</DialogTitle>
          <DialogDescription>Update project details.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium">
              Name <span className="text-destructive">*</span>
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1.5 w-full h-9 rounded-md border border-input bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
            />
            {fieldErrors.name ? (
              <p className="text-sm text-destructive mt-1">
                {fieldErrors.name}
              </p>
            ) : null}
          </div>
          <div>
            <label className="text-xs font-medium">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-1.5 w-full rounded-md border border-input bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
            />
            {fieldErrors.description ? (
              <p className="text-sm text-destructive mt-1">
                {fieldErrors.description}
              </p>
            ) : null}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium">Location</label>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="mt-1.5 w-full h-9 rounded-md border border-input bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
              />
              {fieldErrors.location ? (
                <p className="text-sm text-destructive mt-1">
                  {fieldErrors.location}
                </p>
              ) : null}
            </div>
            <div>
              <label className="text-xs font-medium">Start date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1.5 w-full h-9 rounded-md border border-input bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
              />
              {fieldErrors.startDate ? (
                <p className="text-sm text-destructive mt-1">
                  {fieldErrors.startDate}
                </p>
              ) : null}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium">Status</label>
            <select
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as "ACTIVE" | "COMPLETED")
              }
              className="mt-1.5 w-full h-9 rounded-md border border-input bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
            >
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
            </select>
            {fieldErrors.status ? (
              <p className="text-sm text-destructive mt-1">
                {fieldErrors.status}
              </p>
            ) : null}
          </div>
          {errorMessage ? (
            <p className="text-sm text-destructive">{errorMessage}</p>
          ) : null}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            disabled={isPending}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? "Saving..." : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
