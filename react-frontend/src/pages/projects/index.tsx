import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Loader2,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/common/button";
import CreateProjectDialog from "@/components/project/dialogues/CreateProjectDialog";
import {
  useCreateProject,
  useGetProjects,
  useUpdateProject,
} from "@/hooks/api/projects/useProject";
import { fmtCurrency, fmtDate } from "@/utils";
import { useToast } from "@/hooks/use-toast";
import type { GetProjectsResponse } from "@/api/dto/responseDto";
import EditProjectDialog from "@/components/project/dialogues/EditProjectDialogue";

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50] as const;

function useDebounced<T>(value: T, delay = 300): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return v;
}

export default function Projects() {
  const [filter, setFilter] = useState<"All" | "ACTIVE" | "COMPLETED">("All");
  const [q, setQ] = useState("");
  const debouncedQ = useDebounced(q, 300);
  const [pageSize, setPageSize] = useState<number>(10);
  const [page, setPage] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const navigate = useNavigate();
  const { mutate: updateProject, isPending, variables } = useUpdateProject();
  const { toast } = useToast();
  const [editingProject, setEditingProject] =
    useState<GetProjectsResponse | null>(null);

  useEffect(() => {
    setPage(0);
  }, [debouncedQ, filter, pageSize]);

  const { data, isLoading, isFetching, isError, refetch } = useGetProjects({
    q: debouncedQ || undefined,
    status: filter === "All" ? undefined : filter,
    page,
    pageSize,
  });
  const { createProject, isCreating } = useCreateProject();

  const items = data?.content ?? [];
  const total = data?.totalElements ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const start = total === 0 ? 0 : page * pageSize + 1;
  const end = Math.min(total, page * pageSize + items.length);

  if (isError) {
    return (
      <AppShell>
        <div className="px-6 lg:px-10 py-8 max-w-[1400px]">
          <ErrorState onRetry={() => void refetch()} />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-8 max-w-[1400px]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {total} {total === 1 ? "project" : "projects"} matching filters.
            </p>
          </div>
          <Button
            onClick={() => setDialogOpen(true)}
            className="h-9 px-3.5 inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition shadow-soft"
          >
            <Plus className="h-4 w-4" /> New project
          </Button>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-60 max-w-md">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search projects…"
              className="w-full h-9 rounded-md border border-input bg-surface pl-8 pr-3 text-sm placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring/50"
            />
            {isFetching && q !== debouncedQ && (
              <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground animate-spin" />
            )}
          </div>

          <div className="inline-flex items-center rounded-md border border-border bg-surface p-0.5">
            {(["All", "ACTIVE", "COMPLETED"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`h-7 px-2.5 text-xs rounded-[5px] transition ${
                  filter === f
                    ? "bg-accent text-accent-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {f === "All" ? "All" : f === "ACTIVE" ? "Active" : "Completed"}
              </button>
            ))}
          </div>

          <button className="h-9 px-3 inline-flex items-center gap-1.5 rounded-md border border-border bg-surface text-sm hover:bg-accent transition">
            <ArrowUpDown className="h-3.5 w-3.5" /> Sort: Name
          </button>
        </div>

        <div className="mt-6 rounded-xl border border-border bg-surface overflow-hidden shadow-soft">
          <table className="w-full text-sm">
            <thead className="bg-surface-elevated text-xs text-muted-foreground">
              <tr>
                <Th>Project</Th>
                <Th>Status</Th>
                <Th>Location</Th>
                <Th>Started</Th>
                <Th className="text-right">Models</Th>
                <Th className="text-right">Members</Th>
                <Th className="text-right">Contract</Th>
                <Th className="text-right">Approved</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <SkeletonRows rows={pageSize} />
              ) : items.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-10 text-center text-sm text-muted-foreground"
                  >
                    No projects match your search.
                  </td>
                </tr>
              ) : (
                items.map((p) => {
                  const isUpdatingThisRow =
                    isPending && variables?.projectId === p.id;

                  return (
                    <tr
                      key={p.id}
                      onClick={() =>
                        navigate({
                          to: "/projects/$projectId",
                          params: { projectId: p.id },
                        })
                      }
                      className="hover:bg-accent/40 transition cursor-pointer"
                    >
                      <td className="px-4 py-3">
                        <Link
                          to="/projects/$projectId"
                          params={{ projectId: p.id }}
                          onClick={(e) => e.stopPropagation()}
                          className="font-medium hover:text-primary hover:underline"
                        >
                          {p.name}
                        </Link>
                        <div className="text-xs text-muted-foreground line-clamp-1">
                          {p.description}
                        </div>
                      </td>
                      <td
                        className="px-4 py-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <select
                          value={p.status}
                          disabled={isUpdatingThisRow}
                          onChange={(e) =>
                            updateProject(
                              {
                                projectId: p.id,
                                data: {
                                  status: e.target.value as
                                    | "ACTIVE"
                                    | "COMPLETED",
                                },
                              },
                              {
                                onError: (error) => {
                                  toast({
                                    title: "Failed to update status",
                                    description:
                                      error instanceof Error
                                        ? error.message
                                        : "Please try again.",
                                    variant: "destructive",
                                  });
                                },
                              },
                            )
                          }
                          className={`text-[10px] font-semibold uppercase tracking-wider rounded-full px-2 py-0.5 bg-status-approved/15 text-status-approved-fg border-none focus:outline-none focus:ring-2 focus:ring-ring/30 cursor-pointer ${isUpdatingThisRow ? "opacity-50 cursor-wait" : ""}`}
                        >
                          <option value="ACTIVE">Active</option>
                          <option value="COMPLETED">Completed</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {p.location}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {fmtDate(p.startDate)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {p.modelCount}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {p.memberCount}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {fmtCurrency(p.financials.contractValue)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-status-approved-fg font-medium">
                        {fmtCurrency(p.financials.approved)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {(p.currentUserRole === "SUPER_ADMIN" ||
                          p.currentUserRole === "ADMIN") && (
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingProject(p);
                              }}
                              className="h-7 w-7 inline-flex items-center justify-center rounded-md border border-border bg-surface hover:bg-accent transition"
                              aria-label="Edit project"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                // open delete dialog — wired later
                              }}
                              className="h-7 w-7 inline-flex items-center justify-center rounded-md border border-border bg-surface hover:bg-accent text-status-rejected-fg transition"
                              aria-label="Delete project"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-3 border-t border-border text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <label htmlFor="page-size">Rows per page:</label>
              <select
                id="page-size"
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="h-7 rounded-md border border-input bg-surface px-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring/30"
              >
                {PAGE_SIZE_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-4">
              <span className="tabular-nums">
                {start}–{end} of {total}
              </span>
              <div className="inline-flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0 || isFetching}
                  className="h-7 w-7 inline-flex items-center justify-center rounded-md border border-border bg-surface hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <span className="px-2 tabular-nums">
                  Page {page + 1} of {totalPages}
                </span>
                <button
                  onClick={() =>
                    setPage((p) => (p + 1 < totalPages ? p + 1 : p))
                  }
                  disabled={page + 1 >= totalPages || isFetching}
                  className="h-7 w-7 inline-flex items-center justify-center rounded-md border border-border bg-surface hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition"
                  aria-label="Next page"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <CreateProjectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreate={async (project) => {
          await createProject(project);
        }}
        isSubmitting={isCreating}
      />
      {editingProject && (
        <EditProjectDialog
          open={!!editingProject}
          onOpenChange={(v) => !v && setEditingProject(null)}
          project={editingProject}
        />
      )}
    </AppShell>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-8 shadow-soft">
      <div className="text-sm font-semibold">Projects unavailable</div>
      <p className="mt-2 text-sm text-muted-foreground">
        We couldn&apos;t load the projects list right now.
      </p>
      <Button onClick={onRetry} className="mt-4">
        Try again
      </Button>
    </div>
  );
}

function SkeletonRows({ rows = 5 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i}>
          {Array.from({ length: 8 }).map((__, j) => (
            <td key={j} className="px-4 py-3">
              <div className="h-3.5 rounded bg-muted animate-pulse" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

function Th({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th className={`text-left font-medium px-4 py-2.5 ${className}`}>
      {children}
    </th>
  );
}
