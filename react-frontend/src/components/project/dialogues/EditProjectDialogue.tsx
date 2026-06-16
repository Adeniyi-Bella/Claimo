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
import type { GetProjectsResponse } from "@/api/dto/responseDto";

export default function EditProjectDialog({
  open,
  onOpenChange,
  project,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  project: GetProjectsResponse;
}) {
  const { toast } = useToast();
  const { mutateAsync: updateProject, isPending } = useUpdateProject();

  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description);
  const [location, setLocation] = useState(project.location);
  const [startDate, setStartDate] = useState(project.startDate);
  const [status, setStatus] = useState<"ACTIVE" | "COMPLETED">(project.status);

  useEffect(() => {
    if (open) {
      setName(project.name);
      setDescription(project.description);
      setLocation(project.location);
      setStartDate(project.startDate);
      setStatus(project.status);
    }
  }, [open, project]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast({
        title: "Name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateProject({
        projectId: project.id,
        data: {
          name: name.trim(),
          description: description.trim(),
          location: location.trim(),
          startDate,
          status,
        },
      });
      toast({ title: "Project updated" });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Failed to update project",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
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
            <label className="text-xs font-medium">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1.5 w-full h-9 rounded-md border border-input bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
            />
          </div>
          <div>
            <label className="text-xs font-medium">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-1.5 w-full rounded-md border border-input bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium">Location</label>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="mt-1.5 w-full h-9 rounded-md border border-input bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
              />
            </div>
            <div>
              <label className="text-xs font-medium">Start date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1.5 w-full h-9 rounded-md border border-input bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as "ACTIVE" | "COMPLETED")}
              className="mt-1.5 w-full h-9 rounded-md border border-input bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
            >
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" disabled={isPending} onClick={() => onOpenChange(false)}>
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