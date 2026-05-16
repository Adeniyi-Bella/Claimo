import { useEffect, useState, useCallback } from "react";

export type InviteStatus = "PENDING_INVITE" | "ACCEPTED";

export interface CompanyMember {
  id: string;
  name: string;
  email: string;
  role: "ACCOUNT_OWNER" | "MEMBER";
  status: InviteStatus;
  invitedAt: string;
  avatarHue: number;
}

export interface SessionProject {
  id: string;
  name: string;
  description: string;
  location: string;
  startDate: string;
  createdAt: string;
}

const MEMBERS_KEY = "claimo.company.members";
const PROJECTS_KEY = "claimo.projects";

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent("claimo:session-store", { detail: { key } }));
}

function useSessionList<T>(key: string): [T[], (next: T[]) => void] {
  const [items, setItems] = useState<T[]>([]);

  useEffect(() => {
    setItems(read<T[]>(key, []));
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail || detail.key === key) setItems(read<T[]>(key, []));
    };
    window.addEventListener("claimo:session-store", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("claimo:session-store", handler);
      window.removeEventListener("storage", handler);
    };
  }, [key]);

  const update = useCallback(
    (next: T[]) => {
      write(key, next);
      setItems(next);
    },
    [key],
  );

  return [items, update];
}

export function useCompanyMembers() {
  const [members, setMembers] = useSessionList<CompanyMember>(MEMBERS_KEY);

  const invite = (data: { name: string; email: string }) => {
    const m: CompanyMember = {
      id: `m_${Date.now()}`,
      name: data.name.trim() || data.email.split("@")[0],
      email: data.email.trim(),
      role: "MEMBER",
      status: "PENDING_INVITE",
      invitedAt: new Date().toISOString(),
      avatarHue: Math.floor(Math.random() * 360),
    };
    setMembers([...members, m]);
  };

  const remove = (id: string) => setMembers(members.filter((m) => m.id !== id));

  return { members, invite, remove };
}

export function useProjects() {
  const [projects, setProjects] = useSessionList<SessionProject>(PROJECTS_KEY);

  const create = (data: { name: string; description: string; location: string; startDate: string }) => {
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `project-${Date.now()}`;
    const p: SessionProject = {
      id: `${slug}-${Date.now().toString(36)}`,
      name: data.name.trim(),
      description: data.description.trim(),
      location: data.location.trim(),
      startDate: data.startDate,
      createdAt: new Date().toISOString(),
    };
    setProjects([...projects, p]);
    return p;
  };

  const remove = (id: string) => setProjects(projects.filter((p) => p.id !== id));

  return { projects, create, remove };
}
