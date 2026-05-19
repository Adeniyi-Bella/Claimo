import { Link, useParams } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import {
  fmtDate,
  projectSummary,
  // type PaymentItem,
  type Project,
} from "@/lib/mock-data";
import {
  Boxes,
  Calendar,
  ChevronRight,
  Edit3,
  MapPin,
  Upload,
  UserPlus,
  Users,
  ArrowLeft,
} from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent } from "@/components/common/sheet";
import Overview from "./tabs/Overview";
import ModelsTab from "./tabs/Models";
import UploadModelModal from "./modals/Model";
import AddPaymentItemModal from "./modals/Payment";
import InviteModal from "./modals/Invite";
import MembersTab from "./tabs/Members";
import PaymentItemsTab from "./tabs/PaymentItems";
import PaymentItemPanel from "./panel/PaymentRighthandPanel";
import { usePaymentStore } from "@/hooks/usePaymentStore";

const TABS = ["Overview", "Models", "Members", "Payment Items"] as const;

const SESSION_KEY = "claimo:projects";

function loadProjects(): Project[] {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveProjects(projects: Project[]) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(projects));
}

export default function ProjectDetail() {
  const { projectId } = useParams({
    from: "/_authenticated/projects/$projectId",
  });
  const [projects, setProjects] = useState<Project[]>(loadProjects);
  const project = projects.find((p) => p.id === projectId);

  if (!project) {
    return (
      <AppShell>
        <div className="px-6 py-20 text-center text-muted-foreground text-sm">
          Project not found.
        </div>
      </AppShell>
    );
  }

  const syncFromSession = usePaymentStore((s) => s.syncFromSession);

  const [tab, setTab] = useState<(typeof TABS)[number]>("Overview");
  const [openInvite, setOpenInvite] = useState(false);
  const [openUpload, setOpenUpload] = useState(false);
  const [openAddItem, setOpenAddItem] = useState(false);
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const summary = projectSummary(project);
  const allItems = project.models.flatMap((m) => m.paymentItems);

  const [modelThumbs, setModelThumbs] = useState<Record<string, string>>(() => {
    try {
      const raw = sessionStorage.getItem("claimo:thumbs");
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  const updateProject = (updated: Project) => {
    const next = projects.map((p) => (p.id === updated.id ? updated : p));
    setProjects(next);
    saveProjects(next);
    syncFromSession(); // ← keep zustand store in sync
  };
  return (
    <AppShell>
      <div className="border-b border-border bg-surface">
        <div className="px-6 lg:px-10 pt-6 max-w-[1400px]">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link
              to="/projects"
              className="hover:text-foreground inline-flex items-center gap-1"
            >
              <ArrowLeft className="h-3 w-3" /> Projects
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground font-medium">{project.name}</span>
          </div>

          <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-lg bg-linear-to-br from-[oklch(0.55_0.13_255)] to-[oklch(0.32_0.08_255)] flex items-center justify-center text-white font-semibold shrink-0">
                  {project.name
                    .split(" ")
                    .map((w) => w[0])
                    .slice(0, 2)
                    .join("")}
                </div>
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight">
                    {project.name}
                  </h1>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {project.location}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> Started{" "}
                      {fmtDate(project.startDate)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Boxes className="h-3 w-3" /> {project.models.length}{" "}
                      models
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3 w-3" /> {project.members.length}{" "}
                      members
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider rounded-full px-2 py-0.5 bg-status-approved text-status-approved-fg">
                      {project.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button className="h-9 px-3 inline-flex items-center gap-1.5 rounded-md border border-border bg-surface text-sm hover:bg-accent transition">
                <Edit3 className="h-3.5 w-3.5" /> Edit project
              </button>
              <button
                onClick={() => setOpenUpload(true)}
                className="h-9 px-3 inline-flex items-center gap-1.5 rounded-md border border-border bg-surface text-sm hover:bg-accent transition"
              >
                <Upload className="h-3.5 w-3.5" /> Upload model
              </button>
              <button
                onClick={() => setOpenInvite(true)}
                className="h-9 px-3.5 inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition shadow-soft"
              >
                <UserPlus className="h-4 w-4" /> Invite member
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-6 flex items-center gap-1 -mb-px">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 h-9 text-sm transition border-b-2 ${tab === t ? "border-primary text-foreground font-medium" : "border-transparent text-muted-foreground hover:text-foreground"}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-6 lg:px-10 py-8 max-w-[1400px]">
        {tab === "Overview" && <Overview project={project} summary={summary} />}
        {tab === "Models" && (
          <ModelsTab
            project={project}
            onUpload={() => setOpenUpload(true)}
            modelThumbs={modelThumbs}
          />
        )}
        {tab === "Members" && (
          <MembersTab
            project={project}
            onInvite={() => setOpenInvite(true)}
            onRemove={(memberId) =>
              updateProject({
                ...project,
                members: project.members.filter((m) => m.id !== memberId),
              })
            }
          />
        )}
        {tab === "Payment Items" && (
          <PaymentItemsTab
            items={allItems}
            project={project}
            onPick={(item) => setActiveItem(item.id)}
            onAdd={() => setOpenAddItem(true)}
          />
        )}
      </div>

      {/* Modals */}
      <InviteModal
        open={openInvite}
        onOpenChange={setOpenInvite}
        project={project}
        onInvite={(member) =>
          updateProject({ ...project, members: [...project.members, member] })
        }
      />
      <UploadModelModal
        open={openUpload}
        onOpenChange={setOpenUpload}
        onUpload={(model, thumb) => {
          const updatedModels = [...project.models, model];
          updateProject({ ...project, models: updatedModels });
          const newThumbs = { ...modelThumbs, [model.id]: thumb };
          setModelThumbs(newThumbs);
          sessionStorage.setItem("claimo:thumbs", JSON.stringify(newThumbs));
          setTab("Models"); // switch to models tab after upload
        }}
      />

      <AddPaymentItemModal
        open={openAddItem}
        onOpenChange={setOpenAddItem}
        project={project}
        onAdd={(item) => {
          const updatedModels = project.models.map((m) =>
            m.id === item.modelId
              ? { ...m, paymentItems: [...m.paymentItems, item] }
              : m,
          );
          updateProject({ ...project, models: updatedModels });
        }}
      />

      {/* Payment item panel */}
      <Sheet
        open={!!activeItem}
        onOpenChange={(v) => !v && setActiveItem(null)}
      >
        <SheetContent
          side="right"
          className="w-full sm:max-w-md p-0 overflow-y-auto"
        >
          {activeItem && (
            <PaymentItemPanel
              itemId={activeItem}
              onClose={() => setActiveItem(null)}
            />
          )}
        </SheetContent>
      </Sheet>
    </AppShell>
  );
}
