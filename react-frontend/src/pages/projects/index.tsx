import { Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowUpDown,
  Boxes,
  Calendar,
  LayoutGrid,
  List,
  MapPin,
  Plus,
  Search,
  Users,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/common/button";
import { DashboardLoader } from "@/components/common/loader/loader";
import CreateProjectDialog from "@/components/project/dialogues/CreateProjectDialog";
import { useCreateProject } from "@/hooks/api/projects/useCreateProject";
import { useProjects } from "@/hooks/api/projects/useProjects";
import { projectSummary } from "@/lib/mock-data";
import { fmtCurrency, fmtDate } from "@/utils";

export default function Projects() {
  const { data, isLoading, isError, refetch } = useProjects();
  const { createProject, isCreating } = useCreateProject();
  const [view, setView] = useState<"grid" | "table">("grid");
  const [filter, setFilter] = useState<"All" | "Active" | "Completed" | "Archived">("All");
  const [q, setQ] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  if (isLoading || !data) {
    return <DashboardLoader />;
  }

  if (isError) {
    return (
      <AppShell>
        <div className="px-6 lg:px-10 py-8 max-w-[1400px]">
          <ErrorState onRetry={() => void refetch()} />
        </div>
      </AppShell>
    );
  }

  const projects = data;
  const filtered = data.filter(
    (project) =>
      (filter === "All" || project.status === filter) &&
      project.name.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-8 max-w-[1400px]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {projects.length} projects across{" "}
              {new Set(projects.map((project) => project.location)).size} locations.
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
          </div>

          <div className="inline-flex items-center rounded-md border border-border bg-surface p-0.5">
            {(["All", "Active", "Completed", "Archived"] as const).map((value) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={`h-7 px-2.5 text-xs rounded-[5px] transition ${
                  filter === value
                    ? "bg-accent text-accent-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {value}
              </button>
            ))}
          </div>

          <button className="h-9 px-3 inline-flex items-center gap-1.5 rounded-md border border-border bg-surface text-sm hover:bg-accent transition">
            <ArrowUpDown className="h-3.5 w-3.5" /> Sort: Name
          </button>

          <div className="ml-auto inline-flex items-center rounded-md border border-border bg-surface p-0.5">
            <button
              onClick={() => setView("grid")}
              className={`h-7 w-7 inline-flex items-center justify-center rounded-[5px] ${
                view === "grid" ? "bg-accent text-accent-foreground" : "text-muted-foreground"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setView("table")}
              className={`h-7 w-7 inline-flex items-center justify-center rounded-[5px] ${
                view === "table" ? "bg-accent text-accent-foreground" : "text-muted-foreground"
              }`}
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {projects.length === 0 ? (
          <EmptyState onCreateClick={() => setDialogOpen(true)} />
        ) : filtered.length === 0 ? (
          <EmptyResults onCreateClick={() => setDialogOpen(true)} />
        ) : view === "grid" ? (
          <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((project) => {
              const summary = projectSummary(project);
              const pct = summary.total > 0 ? Math.round((summary.approved / summary.total) * 100) : 0;

              return (
                <Link
                  key={project.id}
                  to="/projects/$projectId"
                  params={{ projectId: project.id }}
                  className="group rounded-xl border border-border bg-surface p-5 shadow-soft hover:shadow-elevated hover:border-primary/30 transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="h-10 w-10 rounded-lg bg-linear-to-br from-[oklch(0.55_0.13_255)] to-[oklch(0.32_0.08_255)] flex items-center justify-center text-white text-sm font-semibold shrink-0">
                      {project.name
                        .split(" ")
                        .map((word) => word[0])
                        .slice(0, 2)
                        .join("")}
                    </div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider rounded-full px-2 py-0.5 bg-status-approved text-status-approved-fg">
                      {project.status}
                    </span>
                  </div>
                  <div className="mt-4 font-medium tracking-tight">{project.name}</div>
                  <div className="mt-1 text-xs text-muted-foreground line-clamp-2">
                    {project.description}
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
                    <div>
                      <div className="text-muted-foreground inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> Location
                      </div>
                      <div className="mt-0.5 font-medium truncate">{project.location}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground inline-flex items-center gap-1">
                        <Boxes className="h-3 w-3" /> Models
                      </div>
                      <div className="mt-0.5 font-medium">{project.models.length}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground inline-flex items-center gap-1">
                        <Users className="h-3 w-3" /> Members
                      </div>
                      <div className="mt-0.5 font-medium">{project.members.length}</div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1.5">
                      <span>{fmtCurrency(summary.approved)} approved</span>
                      <span>{fmtCurrency(summary.total)} total</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground inline-flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> Started {fmtDate(project.startDate)}
                      </span>
                      <span className="font-medium tabular-nums">{pct}%</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="mt-6 rounded-xl border border-border bg-surface overflow-hidden shadow-soft">
            <table className="w-full text-sm">
              <thead className="bg-surface-elevated text-xs text-muted-foreground">
                <tr>
                  <Th>Project</Th>
                  <Th>Location</Th>
                  <Th>Started</Th>
                  <Th className="text-right">Models</Th>
                  <Th className="text-right">Members</Th>
                  <Th className="text-right">Contract</Th>
                  <Th className="text-right">Approved</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((project) => {
                  const summary = projectSummary(project);
                  return (
                    <tr key={project.id} className="hover:bg-accent/40 transition">
                      <td className="px-4 py-3">
                        <Link
                          to="/projects/$projectId"
                          params={{ projectId: project.id }}
                          className="font-medium hover:text-primary"
                        >
                          {project.name}
                        </Link>
                        <div className="text-xs text-muted-foreground line-clamp-1">
                          {project.description}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {project.location}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {fmtDate(project.startDate)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {project.models.length}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {project.members.length}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {fmtCurrency(summary.total)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-status-approved-fg font-medium">
                        {fmtCurrency(summary.approved)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CreateProjectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreate={async (project) => {
          await createProject(project);
        }}
        isSubmitting={isCreating}
      />
    </AppShell>
  );
}

function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="mt-10 rounded-2xl border border-dashed border-border bg-surface p-10 text-center shadow-soft">
      <div className="mx-auto h-14 w-14 rounded-xl bg-accent text-primary inline-flex items-center justify-center">
        <Plus className="h-6 w-6" />
      </div>
      <h2 className="mt-5 text-lg font-semibold tracking-tight">
        No projects yet
      </h2>
      <p className="mt-1.5 text-sm text-muted-foreground max-w-md mx-auto">
        Create your first project to start tracking models, members and payment claims.
      </p>
      <Button onClick={onCreateClick} className="mt-6">
        <Plus className="h-4 w-4" /> New project
      </Button>
    </div>
  );
}

function EmptyResults({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="mt-10 rounded-2xl border border-dashed border-border bg-surface p-10 text-center shadow-soft">
      <h2 className="text-lg font-semibold tracking-tight">No matching projects</h2>
      <p className="mt-1.5 text-sm text-muted-foreground max-w-md mx-auto">
        Try another search or create a new project.
      </p>
      <Button onClick={onCreateClick} className="mt-6">
        <Plus className="h-4 w-4" /> New project
      </Button>
    </div>
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

function Th({ children, className = "" }: any) {
  return (
    <th className={`text-left font-medium px-4 py-2.5 ${className}`}>
      {children}
    </th>
  );
}
