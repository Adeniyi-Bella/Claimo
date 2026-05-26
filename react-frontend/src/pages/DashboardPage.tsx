import { Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
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
import { useState } from "react";
import {
  type Project,
  fmtCurrency,
  fmtDate,
  projectSummary,
  COMPANY,
} from "@/lib/mock-data";
import { RoleBadge } from "@/components/common/status-badge";
import { Button } from "@/components/common/button";
import { useUser } from "@clerk/react";
import { useProjectList } from "@/lib/project-storage";
import CreateProjectDialog from "@/components/project/dialogues/CreateProjectDialog";
import type { CreateProjectData } from "@/types";

export default function Dashboard() {
  const { projects, setProjects } = useProjectList();
  const [dialogOpen, setDialogOpen] = useState(false);
  const { user } = useUser();
  // const currentUser = {
  //   name: user?.fullName ?? user?.firstName ?? "User",
  //   email: user?.primaryEmailAddress?.emailAddress ?? "",
  //   avatarHue: 250, // fixed or derive from email hash
  // };

  const handleCreate = (data: CreateProjectData) => {
    const newProject: Project = {
      id: `proj-${Date.now()}`,
      name: data.name,
      description: data.description,
      location: data.location,
      startDate: data.startDate,
      status: "Active",
      members: [
        {
          id: user?.id ?? `u-${Date.now()}`,
          name: user?.fullName ?? "You",
          email: user?.primaryEmailAddress?.emailAddress ?? "",
          role: "ADMIN" as const,
          joined: new Date().toISOString().slice(0, 10),
          avatarHue: 250,
        },
      ],
      models: [],
    };
    setProjects((current) => [newProject, ...current]);
  };

  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-8 max-w-[1400px]">
        {projects.length === 0 ? (
          <EmptyState onCreateClick={() => setDialogOpen(true)} />
        ) : (
          <FilledDashboard
            projects={projects}
            onCreateClick={() => setDialogOpen(true)}
          />
        )}
      </div>

      <CreateProjectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreate={handleCreate}
      />
    </AppShell>
  );
}

// ─── Empty state ────────────────────────────────────────────────────────────

function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Welcome to Claimo</span>
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            Let's set up your workspace.
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            You don't have any projects yet. Create your first project to start
            tracking payment claims.
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
            className="h-9 px-3.5 inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition shadow-soft"
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

// ─── Filled dashboard ────────────────────────────────────────────────────────

function FilledDashboard({
  projects,
  onCreateClick,
}: {
  projects: Project[];
  onCreateClick: () => void;
}) {
  const { user } = useUser();
  const currentUser = {
    name: user?.fullName ?? user?.firstName ?? "User",
    email: user?.primaryEmailAddress?.emailAddress ?? "",
    avatarHue: 250, // fixed or derive from email hash
  };
  const totalModels = projects.reduce((s, p) => s + p.models.length, 0);
  const totals = projects.reduce(
    (acc, p) => {
      const s = projectSummary(p);
      return {
        total: acc.total + s.total,
        approved: acc.approved + s.approved,
        submitted: acc.submitted + s.submitted,
        rejected: acc.rejected + s.rejected,
      };
    },
    { total: 0, approved: 0, submitted: 0, rejected: 0 },
  );
  const recent = projects.slice(0, 5);

  return (
    <>
      {/* Greeting */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{COMPANY.name}</span>
            <span>·</span>
            <RoleBadge role="ACCOUNT_OWNER" />
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            Welcome back, {currentUser.name.split(" ")[0]}.
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here's what's happening across your projects today.
          </p>
        </div>
        <div className="mt-6 inline-flex items-center gap-2">
          <Button
            onClick={onCreateClick}
            className="h-9 px-3.5 inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition shadow-soft"
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
      {/* Summary cards */}
      <div className="mt-8 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <Stat
          label="Total projects"
          value={String(projects.length)}
          // delta="+1 this month"
          Icon={FolderKanban}
        />
        <Stat
          label="Models"
          value={String(totalModels)}
          // delta="+3 this month"
          Icon={Boxes}
        />
        <Stat
          label="Contract value"
          value={fmtCurrency(totals.total)}
          // delta="+12.4%"
          Icon={Wallet}
        />
        <Stat
          label="Approved"
          value={fmtCurrency(totals.approved)}
          // delta="+€482k"
          Icon={CheckCircle2}
          tone="approved"
        />
        <Stat
          label="Pending"
          value={fmtCurrency(totals.submitted)}
          // delta="6 awaiting review"
          Icon={Clock3}
          tone="submitted"
        />
        <Stat
          label="Rejected"
          value={fmtCurrency(totals.rejected)}
          // delta="2 to revisit"
          Icon={XCircle}
          tone="rejected"
        />
      </div>

      {/* Recent projects + activity */}
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
            {recent.map((p) => {
              const s = projectSummary(p);
              const pct =
                s.total > 0 ? Math.round((s.approved / s.total) * 100) : 0;
              return (
                <Link
                  key={p.id}
                  to="/projects/$projectId"
                  params={{ projectId: p.id }}
                  className="grid grid-cols-12 gap-3 items-center px-5 py-4 hover:bg-accent/40 transition cursor-pointer"
                >
                  <div className="col-span-12 md:col-span-5 flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-md bg-linear-to-br from-[oklch(0.55_0.13_255)] to-[oklch(0.32_0.08_255)] flex items-center justify-center text-white text-xs font-semibold shrink-0">
                      {p.name
                        .split(" ")
                        .map((w) => w[0])
                        .slice(0, 2)
                        .join("")}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-sm truncate">
                        {p.name}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {p.location || "—"} · {fmtDate(p.startDate)}
                      </div>
                    </div>
                  </div>
                  <div className="col-span-4 md:col-span-2 text-xs">
                    <div className="text-muted-foreground">Models</div>
                    <div className="font-medium">{p.models.length}</div>
                  </div>
                  <div className="col-span-8 md:col-span-3">
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
                      <span>{fmtCurrency(s.approved)}</span>
                      <span>{fmtCurrency(s.total)}</span>
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

        {/* <section className="rounded-xl border border-border bg-surface shadow-soft">
          <div className="px-5 py-4 border-b border-border">
            <div className="text-sm font-semibold">Activity</div>
            <div className="text-xs text-muted-foreground">
              Latest claim updates
            </div>
          </div>
          {projects.every((p) => p.models.length === 0) ? (
            <div className="px-5 py-10 text-center text-sm text-muted-foreground">
              No activity yet. Upload a model to get started.
            </div>
          ) : (
            <ul className="px-2 py-2 space-y-0.5">
              {[
                {
                  who: "Priya Shah",
                  what: "submitted",
                  item: "Reinforcement",
                  proj: "Harbor Tower",
                  t: "12m",
                  s: "SUBMITTED",
                },
                {
                  who: "Elena Marchetti",
                  what: "approved",
                  item: "Concrete Works",
                  proj: "Harbor Tower",
                  t: "2h",
                  s: "APPROVED",
                },
                {
                  who: "Tomás Rivera",
                  what: "submitted",
                  item: "Electrical",
                  proj: "Harbor Tower",
                  t: "5h",
                  s: "SUBMITTED",
                },
                {
                  who: "Elena Marchetti",
                  what: "rejected",
                  item: "Plumbing",
                  proj: "Harbor Tower",
                  t: "Yesterday",
                  s: "REJECTED",
                },
                {
                  who: "Marcus Hale",
                  what: "uploaded model",
                  item: "Block C — Full Discipline",
                  proj: "Ridgeline Campus",
                  t: "2d",
                  s: null,
                },
              ].map((a, i) => (
                <li
                  key={i}
                  className="px-3 py-2.5 rounded-md hover:bg-accent/40 transition"
                >
                  <div className="text-xs">
                    <span className="font-medium">{a.who}</span>{" "}
                    <span className="text-muted-foreground">{a.what}</span>{" "}
                    <span className="font-medium">{a.item}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground">
                      {a.proj} · {a.t} ago
                    </span>
                    {a.s && <StatusBadge status={a.s as any} />}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section> */}
      </div>
    </>
  );
}

// ─── Shared sub-components ───────────────────────────────────────────────────

function Stat({
  label,
  value,
  // delta,
  Icon,
  tone,
}: {
  label: string;
  value: string;
  // delta: string;
  Icon: any;
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
      {/* <div className="mt-1 text-[11px] text-muted-foreground inline-flex items-center gap-1">
        <TrendingUp className="h-3 w-3" /> {delta}
      </div> */}
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
  Icon: any;
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
