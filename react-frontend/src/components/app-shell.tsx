import { Link, useRouterState } from "@tanstack/react-router";
import {
  // Bell,
  ChevronDown,
  FolderKanban,
  LayoutDashboard,
  Plus,
  Search,
  Settings,
  // HelpCircle,
  Building2,
  LogOut,
  User,
} from "lucide-react";
import { Avatar } from "./common/avatar";
import { COMPANY } from "@/lib/mock-data";
import { RoleBadge } from "./common/status-badge";
import { ClaimoMark } from "./common/claimo-mark";
import { cn } from "@/lib/utils/utils";
import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/common/popover";
import { useClerk, useUser } from "@clerk/react";
import { useNavigate } from "@tanstack/react-router";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/settings", label: "Settings", icon: Settings },
];

// const notifications = [
//   {
//     id: "n1",
//     type: "submitted",
//     title: "Priya Shah submitted a claim",
//     body: "Reinforcement · Harbor Tower · €88,200",
//     time: "12m ago",
//     unread: true,
//   },
//   {
//     id: "n2",
//     type: "approved",
//     title: "Your claim was approved",
//     body: "Concrete Works · Harbor Tower · €312,500",
//     time: "2h ago",
//     unread: true,
//   },
//   {
//     id: "n3",
//     type: "rejected",
//     title: "Claim rejected",
//     body: "Plumbing · Harbor Tower · resubmission required",
//     time: "Yesterday",
//     unread: false,
//   },
//   {
//     id: "n4",
//     type: "invite",
//     title: "You were added to Civic Library Renewal",
//     body: "Role: Admin",
//     time: "3d ago",
//     unread: false,
//   },
// ];

// Reusable user menu dropdown content
function UserMenuContent({ onSignOut }: { onSignOut: () => void }) {
  const { user } = useUser();
  const currentUser = {
    name: user?.fullName ?? user?.firstName ?? "User",
    email: user?.primaryEmailAddress?.emailAddress ?? "",
    avatarHue: 250, // fixed or derive from email hash
  };
  return (
    <div className="w-56 p-1">
      <div className="px-2 py-2 mb-1 border-b border-border">
        <div className="text-xs font-medium truncate">{currentUser.name}</div>
        <div className="text-[11px] text-muted-foreground truncate">
          {currentUser.email}
        </div>
      </div>
      <button className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition">
        <User className="h-3.5 w-3.5" />
        Profile
      </button>
      <button className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition">
        <Settings className="h-3.5 w-3.5" />
        Settings
      </button>
      <div className="my-1 border-t border-border" />
      <button
        onClick={onSignOut}
        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-red-500 hover:bg-red-500/10 hover:text-red-600 transition"
      >
        <LogOut className="h-3.5 w-3.5" />
        Sign out
      </button>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = useRouterState({ select: (r) => r.location.pathname });
  // const [openNotif, setOpenNotif] = useState(false);
  const [openUserMenu, setOpenUserMenu] = useState(false);
  const [openTopUserMenu, setOpenTopUserMenu] = useState(false);
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const { user } = useUser();
  const currentUser = {
    name: user?.fullName ?? user?.firstName ?? "User",
    email: user?.primaryEmailAddress?.emailAddress ?? "",
    avatarHue: 250, // fixed or derive from email hash
  };

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen flex w-full bg-background">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-60 shrink-0 flex-col border-r border-border bg-sidebar">
        <div className="flex h-14 items-center gap-2 px-4 border-b border-sidebar-border">
          <ClaimoMark className="h-7 w-7" />
          <span className="font-semibold tracking-tight text-[15px]">
            Claimo
          </span>
        </div>

        <div className="px-3 py-3">
          <button className="flex w-full items-center gap-2 rounded-md border border-sidebar-border bg-surface px-2.5 py-1.5 text-left text-xs text-muted-foreground hover:bg-accent transition">
            <Building2 className="h-3.5 w-3.5" />
            <span className="truncate flex-1 text-foreground">
              {COMPANY.name}
            </span>
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </div>

        <nav className="px-3 space-y-0.5">
          {nav.map((item) => {
            const active =
              path === item.to ||
              (item.to !== "/dashboard" && path.startsWith(item.to));
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar user menu */}
        <div className="mt-auto p-3 border-t border-sidebar-border">
          <Popover open={openUserMenu} onOpenChange={setOpenUserMenu}>
            <PopoverTrigger asChild>
              <button className="flex w-full items-center gap-2 rounded-md p-1.5 hover:bg-sidebar-accent/60 transition">
                <Avatar
                  name={currentUser.name}
                  hue={currentUser.avatarHue}
                  size={32}
                />
                <div className="min-w-0 flex-1 text-left">
                  <div className="text-xs font-medium truncate">
                    {currentUser.name}
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    {currentUser.email}
                  </div>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" side="top" className="p-0">
              <UserMenuContent onSignOut={handleSignOut} />
            </PopoverContent>
          </Popover>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-14 flex justify-end items-center gap-3 border-b border-border bg-surface/80 backdrop-blur px-4 sticky top-0 z-30">
          <Link to="/dashboard" className="lg:hidden flex items-center gap-2">
            <ClaimoMark className="h-7 w-7" />
            <span className="font-semibold">Claimo</span>
          </Link>
          <div className="hidden md:flex flex-1 max-w-md relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              placeholder="Search projects, models, claims…"
              className="w-full h-8 rounded-md border border-input bg-surface-elevated pl-8 pr-12 text-sm placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring/50 transition"
            />
            <kbd className="absolute right-2 top-1/2 -translate-y-1/2 hidden md:inline-flex h-5 items-center rounded border border-border bg-muted px-1.5 text-[10px] text-muted-foreground">
              ⌘K
            </kbd>
          </div>

          <div className="flex-1 md:flex-none" />

          <button className="hidden sm:inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition shadow-soft">
            <Plus className="h-3.5 w-3.5" /> New project
          </button>

          {/* <button className="h-8 w-8 inline-flex items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition">
            <HelpCircle className="h-4 w-4" />
          </button> */}

          {/* <Popover open={openNotif} onOpenChange={setOpenNotif}>
            <PopoverTrigger asChild>
              <button className="relative h-8 w-8 inline-flex items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition">
                <Bell className="h-4 w-4" />
                <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-96 p-0">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <div className="text-sm font-semibold">Notifications</div>
                <button className="text-xs text-muted-foreground hover:text-foreground">
                  Mark all as read
                </button>
              </div>
              <div className="max-h-96 overflow-auto divide-y divide-border">
                {notifications.map((n) => (
                  <button
                    key={n.id}
                    className="w-full text-left px-4 py-3 hover:bg-accent/50 transition flex gap-3"
                  >
                    <span
                      className={cn(
                        "mt-1 h-2 w-2 rounded-full shrink-0",
                        n.type === "approved" && "bg-status-approved-fg",
                        n.type === "rejected" && "bg-status-rejected-fg",
                        n.type === "submitted" && "bg-status-submitted-fg",
                        n.type === "invite" && "bg-status-invite-fg",
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <div
                        className={cn(
                          "text-sm",
                          n.unread ? "font-medium" : "text-muted-foreground",
                        )}
                      >
                        {n.title}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 truncate">
                        {n.body}
                      </div>
                      <div className="text-[11px] text-muted-foreground/70 mt-1">
                        {n.time}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover> */}

          {/* Top bar user menu — shown on mobile where sidebar is hidden */}
          <Popover open={openTopUserMenu} onOpenChange={setOpenTopUserMenu}>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-2 pl-2 border-l border-border ml-1 hover:opacity-80 transition">
                <Avatar
                  name={currentUser.name}
                  hue={currentUser.avatarHue}
                  size={28}
                />
                <div className="hidden md:block text-xs leading-tight">
                  <div className="font-medium">
                    {currentUser.name.split(" ")[0]}
                  </div>
                  <RoleBadge role="ACCOUNT_OWNER" />
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden md:block" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="p-0">
              <UserMenuContent onSignOut={handleSignOut} />
            </PopoverContent>
          </Popover>
        </header>

        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
