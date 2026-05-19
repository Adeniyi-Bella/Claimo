import { Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import {
  ArrowUpDown,
  LayoutGrid,
  List,
  MapPin,
  Plus,
  Search,
  Users,
  Boxes,
  Calendar,
} from "lucide-react";
import {
  fmtCurrency,
  fmtDate,
  projectSummary,
  type Project,
} from "@/lib/mock-data";
import { useState } from "react";

const SESSION_KEY = "claimo:projects";

function loadProjects(): Project[] {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export default function Projects() {
  const [view, setView] = useState<"grid" | "table">("grid");
  const [filter, setFilter] = useState<
    "All" | "Active" | "Completed" | "Archived"
  >("All");
  const [q, setQ] = useState("");
  const projects = loadProjects();
  const filtered = projects.filter(
    (p) =>
      (filter === "All" || p.status === filter) &&
      p.name.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-8 max-w-[1400px]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {projects.length} projects across{" "}
              {new Set(projects.map((p) => p.location)).size} locations.
            </p>
          </div>
          <button className="h-9 px-3.5 inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition shadow-soft">
            <Plus className="h-4 w-4" /> New project
          </button>
        </div>

        {/* Toolbar */}
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
            {(["All", "Active", "Completed", "Archived"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`h-7 px-2.5 text-xs rounded-[5px] transition ${filter === f ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground hover:text-foreground"}`}
              >
                {f}
              </button>
            ))}
          </div>

          <button className="h-9 px-3 inline-flex items-center gap-1.5 rounded-md border border-border bg-surface text-sm hover:bg-accent transition">
            <ArrowUpDown className="h-3.5 w-3.5" /> Sort: Name
          </button>

          <div className="ml-auto inline-flex items-center rounded-md border border-border bg-surface p-0.5">
            <button
              onClick={() => setView("grid")}
              className={`h-7 w-7 inline-flex items-center justify-center rounded-[5px] ${view === "grid" ? "bg-accent text-accent-foreground" : "text-muted-foreground"}`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setView("table")}
              className={`h-7 w-7 inline-flex items-center justify-center rounded-[5px] ${view === "table" ? "bg-accent text-accent-foreground" : "text-muted-foreground"}`}
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Content */}
        {view === "grid" ? (
          <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((p) => {
              const s = projectSummary(p);
              const pct = Math.round((s.approved / s.total) * 100);
              return (
                <Link
                  key={p.id}
                  to="/projects/$projectId"
                  params={{ projectId: p.id }}
                  className="group rounded-xl border border-border bg-surface p-5 shadow-soft hover:shadow-elevated hover:border-primary/30 transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="h-10 w-10 rounded-lg bg-linear-to-br from-[oklch(0.55_0.13_255)] to-[oklch(0.32_0.08_255)] flex items-center justify-center text-white text-sm font-semibold shrink-0">
                      {p.name
                        .split(" ")
                        .map((w) => w[0])
                        .slice(0, 2)
                        .join("")}
                    </div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider rounded-full px-2 py-0.5 bg-status-approved text-status-approved-fg">
                      {p.status}
                    </span>
                  </div>
                  <div className="mt-4 font-medium tracking-tight">
                    {p.name}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground line-clamp-2">
                    {p.description}
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
                    <div>
                      <div className="text-muted-foreground inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> Location
                      </div>
                      <div className="mt-0.5 font-medium truncate">
                        {p.location}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground inline-flex items-center gap-1">
                        <Boxes className="h-3 w-3" /> Models
                      </div>
                      <div className="mt-0.5 font-medium">
                        {p.models.length}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground inline-flex items-center gap-1">
                        <Users className="h-3 w-3" /> Members
                      </div>
                      <div className="mt-0.5 font-medium">
                        {p.members.length}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1.5">
                      <span>{fmtCurrency(s.approved)} approved</span>
                      <span>{fmtCurrency(s.total)} total</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground inline-flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> Started{" "}
                        {fmtDate(p.startDate)}
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
                {filtered.map((p) => {
                  const s = projectSummary(p);
                  return (
                    <tr key={p.id} className="hover:bg-accent/40 transition">
                      <td className="px-4 py-3">
                        <Link
                          to="/projects/$projectId"
                          params={{ projectId: p.id }}
                          className="font-medium hover:text-primary"
                        >
                          {p.name}
                        </Link>
                        <div className="text-xs text-muted-foreground line-clamp-1">
                          {p.description}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {p.location}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {fmtDate(p.startDate)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {p.models.length}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {p.members.length}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {fmtCurrency(s.total)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-status-approved-fg font-medium">
                        {fmtCurrency(s.approved)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function Th({ children, className = "" }: any) {
  return (
    <th className={`text-left font-medium px-4 py-2.5 ${className}`}>
      {children}
    </th>
  );
}
