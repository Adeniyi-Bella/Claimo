import { Link } from "@tanstack/react-router";
import type { ComponentType } from "react";
import { useState } from "react";
import {
  ArrowUpRight,
  Boxes,
  CheckCircle2,
  Clock3,
  FolderKanban,
  Plus,
  Sparkles,
  UserPlus,
  Wallet,
  XCircle,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/common/button";
import { DashboardLoader } from "@/components/common/loader/loader";
import { RoleBadge } from "@/components/common/status-badge";
import CreateProjectDialog from "@/components/project/dialogues/CreateProjectDialog";
import { useCreateProject } from "@/hooks/api/useCreateProject";
import { useDashboard } from "@/hooks/api/useDashboard";
import type { DashboardProject } from "@/api/types";
import { fmtCurrency, fmtDate } from "@/types";

export default function DashboardPage() {
  const { data, isLoading, isError, refetch } = useDashboard();
  const { createProject, isCreating } = useCreateProject();
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

  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-8 max-w-[1400px]">
        {data.projects.length === 0 ? (
          <EmptyState
            companyName={data.company.company.name}
            onCreateClick={() => setDialogOpen(true)}
          />
        ) : (
          <FilledDashboard
            companyName={data.company.company.name}
            role={data.company.role}
            userName={data.user.name}
            projects={data.projects}
            onCreateClick={() => setDialogOpen(true)}
          />
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

function EmptyState({
  companyName,
  onCreateClick,
}: {
  companyName: string;
  onCreateClick: () => void;
}) {
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" />
            <span>{companyName}</span>
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            Let&apos;s set up your workspace.
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            You don&apos;t have any projects yet. Create your first project to
            start tracking payment claims.
          </p>
        </div>
      </div>

      <div className="mt-10 rounded-2xl border border-dashed border-border bg-surface p-10 text-center shadow-soft">
        <div className="mx-auto h-14 w-14 rounded-xl bg-accent text-primary inline-flex items-center justify-center">
          <FolderKanban className="h-6 w-6" />
        </div>
        <h2 className="mt-5 text-lg font-semibold tracking-tight">
          No projects yet
        </h2>
        <p className="mt-1.5 text-sm text-muted-foreground max-w-md mx-auto">
          Projects are where you upload BIM models, manage members, and track
          payment claims against specific elements of your build.
        </p>
        <div className="mt-6 inline-flex items-center gap-2">
          <Button
            onClick={onCreateClick}
            className="h-9 px-3.5 inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium shadow-soft disabled:opacity-60"
          >
            <Plus className="h-4 w-4" /> Create your first project
          </Button>
          <Link
            to="/settings"
            className="h-9 px-3.5 inline-flex items-center gap-1.5 rounded-md border border-border bg-surface text-sm font-medium hover:bg-accent transition"
          >
            <UserPlus className="h-4 w-4" /> Invite teammates
          </Link>
        </div>
      </div>

      <div className="mt-8 grid md:grid-cols-3 gap-4">
        <Step
          n={1}
          title="Create a project"
          desc="Name it, set a location, and add a contract value."
          Icon={FolderKanban}
        />
        <Step
          n={2}
          title="Upload a 3D model"
          desc="Drop in a BIM model so claims can be tied to real elements."
          Icon={Boxes}
        />
        <Step
          n={3}
          title="Invite your team"
          desc="Add contractors, reviewers, and clients with the right roles."
          Icon={UserPlus}
        />
      </div>
    </>
  );
}

function FilledDashboard({
  companyName,
  role,
  userName,
  projects,
  onCreateClick,
}: {
  companyName: string;
  role: string;
  userName: string;
  projects: DashboardProject[];
  onCreateClick: () => void;
}) {
  const totalModels = projects.reduce(
    (sum, project) => sum + project.models.length,
    0,
  );
  const totals = projects.reduce(
    (acc, project) => {
      const summary = summarizeProject(project);
      acc.total += summary.total;
      acc.approved += summary.approved;
      acc.submitted += summary.submitted;
      acc.rejected += summary.rejected;
      return acc;
    },
    { total: 0, approved: 0, submitted: 0, rejected: 0 },
  );
  const recent = projects.slice(0, 5);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{companyName}</span>
            <span>·</span>
            <RoleBadge role={role} />
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            Welcome back, {userName.split(" ")[0]}.
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here&apos;s what&apos;s happening across your projects today.
          </p>
        </div>
        <div className="mt-6 inline-flex items-center gap-2">
          <Button
            onClick={onCreateClick}
            className="h-9 px-3.5 inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium shadow-soft disabled:opacity-60"
          >
            <Plus className="h-4 w-4" /> New project
          </Button>
          <Link
            to="/settings"
            className="h-9 px-3.5 inline-flex items-center gap-1.5 rounded-md border border-border bg-surface text-sm font-medium hover:bg-accent transition"
          >
            <UserPlus className="h-4 w-4" /> Invite teammates
          </Link>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <Stat
          label="Total projects"
          value={String(projects.length)}
          Icon={FolderKanban}
        />
        <Stat label="Models" value={String(totalModels)} Icon={Boxes} />
        <Stat
          label="Contract value"
          value={fmtCurrency(totals.total)}
          Icon={Wallet}
        />
        <Stat
          label="Approved"
          value={fmtCurrency(totals.approved)}
          Icon={CheckCircle2}
          tone="approved"
        />
        <Stat
          label="Pending"
          value={fmtCurrency(totals.submitted)}
          Icon={Clock3}
          tone="submitted"
        />
        <Stat
          label="Rejected"
          value={fmtCurrency(totals.rejected)}
          Icon={XCircle}
          tone="rejected"
        />
      </div>

      <div className="mt-8 grid lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 rounded-xl border border-border bg-surface shadow-soft">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div>
              <div className="text-sm font-semibold">Recent projects</div>
              <div className="text-xs text-muted-foreground">
                Last 5 projects across the workspace
              </div>
            </div>
            <Link
              to="/projects"
              className="text-xs font-medium text-primary inline-flex items-center gap-1 hover:underline"
            >
              View all <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-border">
            {recent.map((project) => {
              const summary = summarizeProject(project);
              const pct =
                summary.total > 0
                  ? Math.round((summary.approved / summary.total) * 100)
                  : 0;

              return (
                <Link
                  key={project.id}
                  to="/projects/$projectId"
                  params={{ projectId: project.id }}
                  className="grid grid-cols-12 gap-3 items-center px-5 py-4 hover:bg-accent/40 transition cursor-pointer"
                >
                  <div className="col-span-12 md:col-span-5 flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-md bg-linear-to-br from-[oklch(0.55_0.13_255)] to-[oklch(0.32_0.08_255)] flex items-center justify-center text-white text-xs font-semibold shrink-0">
                      {project.name
                        .split(" ")
                        .map((word) => word[0])
                        .slice(0, 2)
                        .join("")}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-sm truncate">
                        {project.name}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {project.location || "—"} · {fmtDate(project.startDate)}
                      </div>
                    </div>
                  </div>
                  <div className="col-span-4 md:col-span-2 text-xs">
                    <div className="text-muted-foreground">Models</div>
                    <div className="font-medium">{project.models.length}</div>
                  </div>
                  <div className="col-span-8 md:col-span-3">
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
                      <span>{fmtCurrency(summary.approved)}</span>
                      <span>{fmtCurrency(summary.total)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <div className="col-span-12 md:col-span-2 flex md:justify-end">
                    <span className="text-xs font-medium tabular-nums">
                      {pct}% paid
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-8 shadow-soft">
      <div className="text-sm font-semibold">Dashboard unavailable</div>
      <p className="mt-2 text-sm text-muted-foreground">
        We couldn&apos;t load the dashboard data right now.
      </p>
      <Button onClick={onRetry} className="mt-4">
        Try again
      </Button>
    </div>
  );
}

function Stat({
  label,
  value,
  Icon,
  tone,
}: {
  label: string;
  value: string;
  Icon: ComponentType<{ className?: string }>;
  tone?: "approved" | "submitted" | "rejected";
}) {
  const toneCls =
    tone === "approved"
      ? "text-status-approved-fg bg-status-approved"
      : tone === "submitted"
        ? "text-status-submitted-fg bg-status-submitted"
        : tone === "rejected"
          ? "text-status-rejected-fg bg-status-rejected"
          : "text-primary bg-accent";

  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-soft">
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium text-muted-foreground">{label}</div>
        <span
          className={`h-7 w-7 rounded-md inline-flex items-center justify-center ${toneCls}`}
        >
          <Icon className="h-3.5 w-3.5" />
        </span>
      </div>
      <div className="mt-3 text-xl font-semibold tracking-tight tabular-nums">
        {value}
      </div>
    </div>
  );
}

function Step({
  n,
  title,
  desc,
  Icon,
}: {
  n: number;
  title: string;
  desc: string;
  Icon: ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-soft">
      <div className="flex items-center gap-3">
        <span className="h-7 w-7 rounded-md bg-accent text-primary inline-flex items-center justify-center text-xs font-semibold">
          {n}
        </span>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="mt-4 text-sm font-semibold">{title}</div>
      <div className="mt-1 text-xs text-muted-foreground">{desc}</div>
    </div>
  );
}

function summarizeProject(project: DashboardProject) {
  const items = project.models.flatMap((model) => model.paymentItems);
  return items.reduce(
    (acc, item) => {
      const approved = item.claims
        .filter((claim) => claim.status === "APPROVED")
        .reduce((sum, claim) => sum + claim.amount, 0);
      const pending = item.claims
        .filter((claim) => claim.status === "SUBMITTED")
        .reduce((sum, claim) => sum + claim.amount, 0);
      const rejected = item.claims
        .filter((claim) => claim.status === "REJECTED")
        .reduce((sum, claim) => sum + claim.amount, 0);

      acc.total += item.contractValue;
      acc.approved += approved;
      acc.submitted += pending;
      acc.rejected += rejected;
      return acc;
    },
    { total: 0, approved: 0, submitted: 0, rejected: 0 },
  );
}
