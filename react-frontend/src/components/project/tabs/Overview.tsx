import type { ProjectResponse } from "@/api/dto/responseDto";
import { Avatar } from "@/components/common/avatar";
import { RoleBadge } from "@/components/common/status-badge";
import { fmtCurrency, projectSummary } from "@/utils";

export default function Overview({
  project,
  summary,
}: {
  project: ProjectResponse;
  summary: ReturnType<typeof projectSummary>;
}) {
  const pct =
    summary.total > 0
      ? Math.round((summary.approved / summary.total) * 100)
      : 0;
  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader title="About this project" />
          <div className="px-5 pb-5 mt-1 text-sm text-muted-foreground leading-relaxed">
            {project.description}
          </div>
        </Card>

        <Card>
          <CardHeader title="Models" subtitle="Per-model payment progress" />
          {/* <div className="divide-y divide-border">
            {project.models.map((m) => {
              const ms = modelSummary(m);
              const p = Math.round((ms.approved / ms.total) * 100);
              return (
                <Link
                  key={m.id}
                  to="/projects/$projectId/models/$modelId"
                  params={{ projectId: project.id, modelId: m.id }}
                  className="block px-5 py-4 hover:bg-accent/40 transition"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0 flex items-center gap-3">
                      <div className="h-9 w-9 rounded-md bg-accent text-primary inline-flex items-center justify-center">
                        <Boxes className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-sm truncate">
                          {m.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {m.paymentItems.length} items · uploaded{" "}
                          {fmtDate(m.uploadedAt)} by {m.uploadedBy}
                        </div>
                      </div>
                    </div>
                    <div className="w-48 hidden sm:block">
                      <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
                        <span>{fmtCurrency(ms.approved)}</span>
                        <span>{fmtCurrency(ms.total)}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${p}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-xs font-medium tabular-nums">
                      {p}%
                    </span>
                  </div>
                </Link>
              );
            })}
          </div> */}
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader title="Payment summary" />
          <div className="px-5 pb-5 space-y-4">
            <div>
              <div className="flex items-baseline justify-between">
                <div>
                  <div className="text-xs text-muted-foreground">Approved</div>
                  <div className="text-2xl font-semibold tracking-tight tabular-nums">
                    {fmtCurrency(summary.approved)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">of</div>
                  <div className="text-sm font-medium tabular-nums">
                    {fmtCurrency(summary.total)}
                  </div>
                </div>
              </div>
              <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden flex">
                <div
                  className="bg-status-approved-fg h-full"
                  style={{ width: `${pct}%` }}
                />
                <div
                  className="bg-status-submitted-fg h-full"
                  style={{
                    width: `${(summary.submitted / summary.total) * 100}%`,
                  }}
                />
                <div
                  className="bg-status-rejected-fg h-full"
                  style={{
                    width: `${(summary.rejected / summary.total) * 100}%`,
                  }}
                />
              </div>
              <div className="mt-2 text-[11px] text-muted-foreground">
                {pct}% approved ·{" "}
                {summary.total > 0
                  ? Math.round((summary.submitted / summary.total) * 100)
                  : 0}
                % pending review
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <Stat
                label="Submitted"
                value={fmtCurrency(summary.submitted)}
                dotClass="bg-status-submitted-fg"
              />
              <Stat
                label="Rejected"
                value={fmtCurrency(summary.rejected)}
                dotClass="bg-status-rejected-fg"
              />
              <Stat
                label="Remaining"
                value={fmtCurrency(summary.remaining)}
                dotClass="bg-muted-foreground/40"
              />
              <Stat
                label="Items"
                value={String(summary.itemCount)}
                dotClass="bg-primary"
              />
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Team" />
          <div className="px-2 pb-2">
            {project.members.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-accent/40 transition"
              >
                <Avatar name={m.name} hue={m.avatarHue} size={32} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{m.name}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {m.email}
                  </div>
                </div>
                <RoleBadge role={m.role} />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function CardHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="px-5 py-4 border-b border-border">
      <div className="text-sm font-semibold">{title}</div>
      {subtitle && (
        <div className="text-xs text-muted-foreground">{subtitle}</div>
      )}
    </div>
  );
}
function Stat({
  label,
  value,
  dotClass,
}: {
  label: string;
  value: string;
  dotClass: string;
}) {
  return (
    <div className="rounded-md border border-border p-3">
      <div className="text-[11px] text-muted-foreground inline-flex items-center gap-1.5">
        <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-surface shadow-soft">
      {children}
    </div>
  );
}
