import {
  Link,
  useNavigate,
  useParams,
  useSearch,
} from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft,
  Boxes,
  Calendar,
  ChevronRight,
  Edit3,
  MapPin,
  Upload,
  UserPlus,
  Users,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import AddPaymentItemModal from "@/components/project/modals/Payment";
import InviteModal from "@/components/project/modals/Invite";
import UploadModelModal from "@/components/project/modals/UploadModel";
import PaymentItemPanel from "@/components/project/panel/PaymentRighthandPanel";
import MembersTab from "@/components/project/tabs/Members";
import ModelsTab from "@/components/project/tabs/ModelsTab";
import Overview from "@/components/project/tabs/Overview";
import PaymentItemsTab from "@/components/project/tabs/PaymentItems";
import { Sheet, SheetContent } from "@/components/common/sheet";
import { useProjectDetail } from "@/components/project/useProjectDetail";
import { DashboardLoader } from "@/components/common/loader/loader";
import { fmtDate, projectSummary } from "@/utils";
import { useDashboard } from "@/hooks/api/useDashboard";

const TABS = ["Overview", "Models", "Members", "Payment Items"] as const;

export default function ProjectDetail() {
  const { projectId } = useParams({
    from: "/_authenticated/projects/$projectId",
  });
  const navigate = useNavigate();
  const search = useSearch({ from: "/_authenticated/projects/$projectId" });
  const [tab, setTab] = useState<(typeof TABS)[number]>(
    (search as { tab?: (typeof TABS)[number] })?.tab ?? "Overview",
  );
  const { data } = useDashboard();

  const {
    activeItem,
    handleAddPaymentItem,
    handleDeleteModel,
    openAddItem,
    openInvite,
    openUpload,
    project,
    setActiveItem,
    setOpenAddItem,
    setOpenInvite,
    setOpenUpload,
    isError,
    isLoading,
    refetch,
  } = useProjectDetail(projectId);

  if (isLoading) {
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

  if (!project) {
    return (
      <AppShell>
        <div className="px-6 py-20 text-center text-muted-foreground text-sm">
          Project not found.
        </div>
      </AppShell>
    );
  }

  const summary = projectSummary(project);
  const allItems = project.models.flatMap((model) => model.paymentItems);

  const handleViewModels = (modelIds: string[]) => {
    if (modelIds.length === 0) return;
    const selected = modelIds.filter((id) =>
      project.models.some((model) => model.id === id),
    );
    if (selected.length === 0) return;
    const firstModelId = selected[0];
    navigate({
      to: "/viewer/$projectId/$modelId",
      params: { projectId: project.id, modelId: firstModelId },
      search: { modelIds: selected.join(",") } as any,
    });
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
                    .map((word) => word[0])
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

          <div className="mt-6 flex items-center gap-1 -mb-px">
            {TABS.map((value) => (
              <button
                key={value}
                onClick={() => setTab(value)}
                className={`px-3 h-9 text-sm transition border-b-2 ${tab === value ? "border-primary text-foreground font-medium" : "border-transparent text-muted-foreground hover:text-foreground"}`}
              >
                {value}
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
            // modelThumbs={modelThumbs}
            onDeleteModel={handleDeleteModel}
            onViewModels={handleViewModels}
          />
        )}
        {tab === "Members" && (
          <MembersTab
            project={project}
            onInvite={() => setOpenInvite(true)}
            currentUserId={data!.user?.id}
          />
        )}
        {tab === "Payment Items" && (
          <PaymentItemsTab
            items={allItems}
            onPick={(item) => setActiveItem(item.id)}
            onAdd={() => setOpenAddItem(true)}
          />
        )}
      </div>

      <InviteModal
        open={openInvite}
        onOpenChange={setOpenInvite}
        project={project}
        // onInvite={handleInvite}
      />
      <UploadModelModal
        open={openUpload}
        onOpenChange={setOpenUpload}
        projectId={project.id}
      />
      <AddPaymentItemModal
        open={openAddItem}
        onOpenChange={setOpenAddItem}
        project={project}
        onAdd={handleAddPaymentItem}
      />

      <Sheet
        open={!!activeItem}
        onOpenChange={(v) => !v && setActiveItem(null)}
      >
        <SheetContent
          side="right"
          className="w-full sm:max-w-md p-0 overflow-y-auto"
        >
          {activeItem && <PaymentItemPanel itemId={activeItem} />}
        </SheetContent>
      </Sheet>
    </AppShell>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-8 shadow-soft">
      <div className="text-sm font-semibold">Project unavailable</div>
      <p className="mt-2 text-sm text-muted-foreground">
        We couldn&apos;t load this project right now.
      </p>
      <button
        onClick={onRetry}
        className="mt-4 h-9 px-3.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition"
      >
        Try again
      </button>
    </div>
  );
}
