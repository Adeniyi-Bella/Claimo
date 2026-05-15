import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  SignIn,
  SignUp,
  SignedIn,
  SignedOut,
  UserButton,
  useAuth,
  useUser,
} from "@clerk/clerk-react";

type AuthMode = "sign-in" | "sign-up";
type Tone = "success" | "error" | "neutral";
type CompanyRole = "ACCOUNT_OWNER" | "ADMIN" | "MEMBER";
type ProjectRole = "ADMIN" | "CONTRACTOR" | "VIEWER";

type ProjectSummary = {
  id: string;
  name: string;
  description?: string | null;
  location?: string | null;
  startDate?: string | null;
  companyId: string;
  createdBy: string;
  role?: ProjectRole | null;
  createdAt: string;
  updatedAt: string;
};

type ProjectMember = {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: ProjectRole;
  createdAt: string;
};

type CompanyMember = {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  companyRole: CompanyRole;
  companyJoinedAt: string;
  projects: Array<{
    projectId: string;
    projectName: string;
    role: ProjectRole;
    joinedAt: string;
  }>;
};

type CompanyInvite = {
  id: string;
  email: string;
  role: CompanyRole;
  status: "PENDING" | "ACCEPTED" | "REVOKED";
  createdAt: string;
  acceptedAt?: string | null;
  invitedByUserId?: string | null;
  invitedByEmail?: string | null;
};

type CurrentCompany = {
  company: {
    id: string;
    name: string;
    ownerId: string | null;
    createdAt: string;
    updatedAt: string;
  };
  role: CompanyRole;
};

type ApiResponse<T> = {
  success: boolean;
  data: T;
  error?: { status?: number; message?: string } | unknown;
  timestamp: string;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";
const APP_URL = import.meta.env.VITE_APP_URL ?? window.location.origin;
const ROLE_OPTIONS: ProjectRole[] = ["CONTRACTOR", "VIEWER", "ADMIN"];
const COMPANY_ROLE_OPTIONS: CompanyRole[] = ["ADMIN", "MEMBER"];

function apiUrl(path: string) {
  return `${API_BASE_URL}${path}`;
}

async function readErrorMessage(response: Response, fallback: string) {
  try {
    const json = (await response.json()) as ApiResponse<unknown>;
    return json?.error && typeof json.error === "object" && "message" in json.error
      ? (json.error as { message?: string }).message || fallback
      : fallback;
  } catch {
    return fallback;
  }
}

export default function App() {
  const [mode, setMode] = useState<AuthMode>("sign-in");

  return (
    <div className="page-shell">
      <SignedOut>
        <div className="auth-layout">
          <section className="hero-card">
            <p className="eyebrow">Claimo backend testing</p>
            <h1>Sign up, create a company, then test company and project invites.</h1>
            <p className="hero-copy">
              Use Clerk on the right to create a fresh user. After registration, the backend
              creates the local user and company. Once signed in, you can create a project,
              invite users to the company, invite users to the project, and inspect the member
              lists.
            </p>

            <div className="feature-list">
              <div className="feature-item">
                <span className="feature-label">Step 1</span>
                <span>Sign up with Clerk to trigger local user and company creation</span>
              </div>
              <div className="feature-item">
                <span className="feature-label">Step 2</span>
                <span>Create a project from the dashboard to get a real project id</span>
              </div>
              <div className="feature-item">
                <span className="feature-label">Step 3</span>
                <span>Invite by company or project, then inspect the member lists</span>
              </div>
            </div>
          </section>

          <section className="auth-card">
            <div className="mode-toggle">
              <button
                type="button"
                className={mode === "sign-in" ? "toggle-btn active" : "toggle-btn"}
                onClick={() => setMode("sign-in")}
              >
                Sign In
              </button>
              <button
                type="button"
                className={mode === "sign-up" ? "toggle-btn active" : "toggle-btn"}
                onClick={() => setMode("sign-up")}
              >
                Sign Up
              </button>
            </div>

            <div className="clerk-frame">
              {mode === "sign-in" ? (
                <SignIn fallbackRedirectUrl={APP_URL} signUpFallbackRedirectUrl={APP_URL} />
              ) : (
                <SignUp fallbackRedirectUrl={APP_URL} signInFallbackRedirectUrl={APP_URL} />
              )}
            </div>
          </section>
        </div>
      </SignedOut>

      <SignedIn>
        <Dashboard />
      </SignedIn>
    </div>
  );
}

function Dashboard() {
  const { user } = useUser();
  const { getToken, signOut } = useAuth();

  const [token, setToken] = useState("");
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [projectId, setProjectId] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [currentCompany, setCurrentCompany] = useState<CurrentCompany | null>(null);
  const [companyInvites, setCompanyInvites] = useState<CompanyInvite[]>([]);
  const [createProjectName, setCreateProjectName] = useState("");
  const [createProjectDescription, setCreateProjectDescription] = useState("");
  const [createProjectLocation, setCreateProjectLocation] = useState("");
  const [createProjectStartDate, setCreateProjectStartDate] = useState("");
  const [companyInviteEmail, setCompanyInviteEmail] = useState("");
  const [companyInviteRole, setCompanyInviteRole] = useState<CompanyRole>("MEMBER");
  const [projectInviteEmail, setProjectInviteEmail] = useState("");
  const [projectInviteRole, setProjectInviteRole] = useState<ProjectRole>("VIEWER");
  const [companyMembers, setCompanyMembers] = useState<CompanyMember[]>([]);
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectCreateLoading, setProjectCreateLoading] = useState(false);
  const [companyInviteLoading, setCompanyInviteLoading] = useState(false);
  const [projectInviteLoading, setProjectInviteLoading] = useState(false);
  const [companyMembersLoading, setCompanyMembersLoading] = useState(false);
  const [companyInvitesLoading, setCompanyInvitesLoading] = useState(false);
  const [projectMembersLoading, setProjectMembersLoading] = useState(false);
  const [copyStatus, setCopyStatus] = useState("Copy token");
  const [sessionMessage, setSessionMessage] = useState("");
  const [sessionTone, setSessionTone] = useState<Tone>("neutral");
  const [companyMessage, setCompanyMessage] = useState("");
  const [companyTone, setCompanyTone] = useState<Tone>("neutral");
  const [projectCreateMessage, setProjectCreateMessage] = useState("");
  const [projectCreateTone, setProjectCreateTone] = useState<Tone>("neutral");
  const [companyInviteMessage, setCompanyInviteMessage] = useState("");
  const [companyInviteTone, setCompanyInviteTone] = useState<Tone>("neutral");
  const [projectInviteMessage, setProjectInviteMessage] = useState("");
  const [projectInviteTone, setProjectInviteTone] = useState<Tone>("neutral");
  const [companyMembersMessage, setCompanyMembersMessage] = useState("");
  const [companyMembersTone, setCompanyMembersTone] = useState<Tone>("neutral");
  const [projectMembersMessage, setProjectMembersMessage] = useState("");
  const [projectMembersTone, setProjectMembersTone] = useState<Tone>("neutral");

  const displayName = useMemo(() => {
    if (!user) return "User";
    return user.fullName || user.username || user.primaryEmailAddress?.emailAddress || "User";
  }, [user]);

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === projectId),
    [projectId, projects],
  );

  const projectInviteSuggestions = useMemo(() => {
    const query = projectInviteEmail.trim().toLowerCase();
    if (!query) {
      return companyMembers.slice(0, 6);
    }

    return companyMembers.filter((member) => {
      const email = member.email.toLowerCase();
      const firstName = member.firstName.toLowerCase();
      const lastName = member.lastName.toLowerCase();
      const fullName = `${firstName} ${lastName}`.trim();
      return email.includes(query) || firstName.includes(query) || lastName.includes(query) || fullName.includes(query);
    });
  }, [companyMembers, projectInviteEmail]);

  useEffect(() => {
    void refreshSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    if (!projectId && projects.length > 0) {
      const firstProject = projects[0];
      setProjectId(firstProject.id);
      setCompanyId((current) => current || firstProject.companyId);
    }
  }, [projects, projectId]);

  useEffect(() => {
    if (!token || !currentCompany?.company?.id) {
      return;
    }

    void loadCompanyMembers(currentCompany.company.id);
    void loadCompanyInvites(token, currentCompany.company.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, currentCompany?.company?.id]);

  async function refreshSession() {
    setLoading(true);
    setSessionMessage("");

    try {
      const jwt = await getToken({ template: "testing" });
      const nextToken = jwt ?? "";
      setToken(nextToken);

      if (!nextToken) {
        setProjects([]);
        setCurrentCompany(null);
        setCompanyInvites([]);
        setSessionTone("error");
        setSessionMessage("Clerk token is not available yet.");
        return;
      }

      await loadProjects(nextToken);
      const company = await loadCurrentCompanyWithRetry(nextToken);
      if (company) {
        setSessionTone("success");
        setSessionMessage("Loaded your Clerk token, company, and current project list.");
      }
    } catch (error) {
      console.error("Failed to load Clerk token", error);
      setSessionTone("error");
      setSessionMessage(error instanceof Error ? error.message : "Failed to load your session data.");
    } finally {
      setLoading(false);
    }
  }

  async function loadCurrentCompanyWithRetry(jwtToken: string) {
    const attempts = 6;

    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      const company = await loadCurrentCompany(jwtToken, attempt, attempts);
      if (company) {
        return company;
      }

      if (attempt < attempts) {
        await new Promise((resolve) => window.setTimeout(resolve, 1000));
      }
    }

    setCompanyTone("neutral");
    setCompanyMessage("Company is not visible yet. Refresh again in a moment.");
    return null;
  }

  async function loadCurrentCompany(jwtToken: string, attempt = 1, maxAttempts = 1) {
    try {
      const response = await fetch(apiUrl("/companies/me"), {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          setCurrentCompany(null);
          setCompanyInvites([]);
          setCompanyTone("neutral");
          setCompanyMessage(`Company not loaded yet. Attempt ${attempt} of ${maxAttempts}.`);
          return null;
        }
        throw new Error(await readErrorMessage(response, `Failed to load company (${response.status})`));
      }

      const json = (await response.json()) as ApiResponse<CurrentCompany>;
      const company = json.data ?? null;
      setCurrentCompany(company);
      setCompanyMessage("");
      if (company?.company?.id) {
        setCompanyId(company.company.id);
      }
      return company;
    } catch (error) {
      console.error(error);
      setCurrentCompany(null);
      setCompanyInvites([]);
      setCompanyTone("error");
      setCompanyMessage(error instanceof Error ? error.message : "Could not load your company.");
      throw error;
    }
  }

  async function loadCompanyInvites(jwtToken: string, targetCompanyId: string) {
    if (!targetCompanyId) {
      setCompanyInvites([]);
      return;
    }

    setCompanyInvitesLoading(true);
    try {
      const response = await fetch(apiUrl(`/companies/${targetCompanyId}/invites`), {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response, `Failed to load company invites (${response.status})`));
      }

      const json = (await response.json()) as ApiResponse<CompanyInvite[]>;
      setCompanyInvites(json.data ?? []);
    } catch (error) {
      console.error(error);
      setCompanyInvites([]);
      setCompanyTone("error");
      setCompanyMessage(error instanceof Error ? error.message : "Failed to load company invites.");
    } finally {
      setCompanyInvitesLoading(false);
    }
  }

  async function loadProjects(jwtToken: string) {
    setProjectsLoading(true);

    try {
      const response = await fetch(apiUrl("/projects"), {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response, `Failed to load projects (${response.status})`));
      }

      const json = (await response.json()) as ApiResponse<ProjectSummary[]>;
      setProjects(json.data ?? []);
      setSessionMessage("");
    } catch (error) {
      console.error(error);
      setProjects([]);
      setSessionTone("error");
      setSessionMessage(error instanceof Error ? error.message : "Could not load projects.");
    } finally {
      setProjectsLoading(false);
    }
  }

  async function copyToken() {
    if (!token) return;
    await navigator.clipboard.writeText(token);
    setCopyStatus("Copied");
    window.setTimeout(() => setCopyStatus("Copy token"), 1500);
  }

  async function createProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token) {
      setProjectCreateTone("error");
      setProjectCreateMessage("Token is not loaded yet.");
      return;
    }

    const name = createProjectName.trim();
    if (!name) {
      setProjectCreateTone("error");
      setProjectCreateMessage("Enter a project name.");
      return;
    }

    setProjectCreateLoading(true);
    setProjectCreateMessage("");

    try {
      const response = await fetch(apiUrl("/projects"), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description: createProjectDescription.trim() || null,
          location: createProjectLocation.trim() || null,
          startDate: createProjectStartDate || null,
        }),
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response, `Create project failed (${response.status})`));
      }

      const json = (await response.json()) as ApiResponse<ProjectSummary>;
      const createdProject = json.data;

      setProjectCreateTone("success");
      setProjectCreateMessage(`Created project ${createdProject.name}.`);
      setCreateProjectName("");
      setCreateProjectDescription("");
      setCreateProjectLocation("");
      setCreateProjectStartDate("");
      setProjectId(createdProject.id);
      setCompanyId(createdProject.companyId);
      await loadProjects(token);
    } catch (error) {
      console.error(error);
      setProjectCreateTone("error");
      setProjectCreateMessage(error instanceof Error ? error.message : "Failed to create project.");
    } finally {
      setProjectCreateLoading(false);
    }
  }

  async function inviteCompanyMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token) {
      setCompanyInviteTone("error");
      setCompanyInviteMessage("Token is not loaded yet.");
      return;
    }

    const targetCompanyId = companyId.trim();
    if (!targetCompanyId) {
      setCompanyInviteTone("error");
      setCompanyInviteMessage("Choose or paste a company id first.");
      return;
    }

    const email = companyInviteEmail.trim().toLowerCase();
    if (!email) {
      setCompanyInviteTone("error");
      setCompanyInviteMessage("Enter an email address.");
      return;
    }

    setCompanyInviteLoading(true);
    setCompanyInviteMessage("");

    try {
      const response = await fetch(apiUrl(`/companies/${targetCompanyId}/members`), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          role: companyInviteRole,
        }),
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response, `Company invite failed (${response.status})`));
      }

      setCompanyInviteTone("success");
      setCompanyInviteMessage(`Company invite sent to ${email}.`);
      setCompanyInviteEmail("");
      await loadCompanyMembers();
      await loadCompanyInvites(token, targetCompanyId);
    } catch (error) {
      console.error(error);
      setCompanyInviteTone("error");
      setCompanyInviteMessage(error instanceof Error ? error.message : "Failed to send company invite.");
    } finally {
      setCompanyInviteLoading(false);
    }
  }

  async function inviteProjectMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token) {
      setProjectInviteTone("error");
      setProjectInviteMessage("Token is not loaded yet.");
      return;
    }

    const targetProjectId = projectId.trim();
    if (!targetProjectId) {
      setProjectInviteTone("error");
      setProjectInviteMessage("Choose or paste a project id first.");
      return;
    }

    const email = projectInviteEmail.trim().toLowerCase();
    if (!email) {
      setProjectInviteTone("error");
      setProjectInviteMessage("Enter an email address.");
      return;
    }

    setProjectInviteLoading(true);
    setProjectInviteMessage("");

    try {
      const response = await fetch(apiUrl(`/projects/${targetProjectId}/members`), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          role: projectInviteRole,
        }),
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response, `Project invite failed (${response.status})`));
      }

      setProjectInviteTone("success");
      setProjectInviteMessage(`Project invite sent to ${email}.`);
      setProjectInviteEmail("");
      await loadProjectMembers();
    } catch (error) {
      console.error(error);
      setProjectInviteTone("error");
      setProjectInviteMessage(error instanceof Error ? error.message : "Failed to send project invite.");
    } finally {
      setProjectInviteLoading(false);
    }
  }

  async function loadCompanyMembers(targetCompanyId: string = companyId) {
    if (!token) {
      setCompanyMembersTone("error");
      setCompanyMembersMessage("Token is not loaded yet.");
      return;
    }

    const normalizedCompanyId = targetCompanyId.trim();
    if (!normalizedCompanyId) {
      setCompanyMembersTone("error");
      setCompanyMembersMessage("Choose or paste a company id first.");
      return;
    }

    setCompanyMembersLoading(true);
    setCompanyMembersMessage("");

    try {
      const response = await fetch(apiUrl(`/companies/${normalizedCompanyId}/members`), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response, `Failed to load company members (${response.status})`));
      }

      const json = (await response.json()) as ApiResponse<CompanyMember[]>;
      setCompanyMembers(json.data ?? []);
      setCompanyMembersTone("success");
      setCompanyMembersMessage(`Loaded ${json.data?.length ?? 0} company members.`);
      return json.data ?? [];
    } catch (error) {
      console.error(error);
      setCompanyMembers([]);
      setCompanyMembersTone("error");
      setCompanyMembersMessage(error instanceof Error ? error.message : "Failed to load company members.");
      return [];
    } finally {
      setCompanyMembersLoading(false);
    }
  }

  async function loadProjectMembers() {
    if (!token) {
      setProjectMembersTone("error");
      setProjectMembersMessage("Token is not loaded yet.");
      return;
    }

    const targetProjectId = projectId.trim();
    if (!targetProjectId) {
      setProjectMembersTone("error");
      setProjectMembersMessage("Choose or paste a project id first.");
      return;
    }

    setProjectMembersLoading(true);
    setProjectMembersMessage("");

    try {
      const response = await fetch(apiUrl(`/projects/${targetProjectId}/members`), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response, `Failed to load project members (${response.status})`));
      }

      const json = (await response.json()) as ApiResponse<ProjectMember[]>;
      setProjectMembers(json.data ?? []);
      setProjectMembersTone("success");
      setProjectMembersMessage(`Loaded ${json.data?.length ?? 0} project members.`);
    } catch (error) {
      console.error(error);
      setProjectMembers([]);
      setProjectMembersTone("error");
      setProjectMembersMessage(error instanceof Error ? error.message : "Failed to load project members.");
    } finally {
      setProjectMembersLoading(false);
    }
  }

  function selectProject(project: ProjectSummary) {
    setProjectId(project.id);
    setCompanyId(project.companyId);
  }

  return (
    <div className="dashboard-layout">
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">Signed in</p>
          <h1>Welcome, {displayName}</h1>
          <p className="hero-copy">
            Use the dashboard below to test the full lifecycle: user registration, company
            creation, project creation, company invites, project invites, and member lookup.
          </p>
        </div>

        <div className="header-actions">
          <button
            type="button"
            className="ghost-btn"
            onClick={() => void refreshSession()}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh data"}
          </button>
          <UserButton afterSignOutUrl="/" />
          <button type="button" className="ghost-btn danger" onClick={() => void signOut()}>
            Sign out
          </button>
        </div>
      </header>

      {sessionMessage ? <Notice tone={sessionTone} message={sessionMessage} /> : null}
      {companyMessage ? <Notice tone={companyTone} message={companyMessage} /> : null}

      <div className="dashboard-grid">
        <main className="dashboard-main">
          <section className="token-card">
            <div className="token-card-header">
              <div>
                <p className="eyebrow">JWT token</p>
                <h2>Use this token for authenticated API calls</h2>
              </div>
              <button type="button" className="primary-btn" onClick={copyToken} disabled={!token}>
                {copyStatus}
              </button>
            </div>

            <textarea
              className="token-box"
              readOnly
              value={token || "Token not loaded yet. Try refreshing in a moment."}
            />

            <div className="token-hint">
              <span className="hint-label">Header</span>
              <code>Authorization: Bearer &lt;token&gt;</code>
            </div>
          </section>

          <section className="workflow-card">
            <div className="section-header">
              <div>
                <p className="eyebrow">Project creation</p>
                <h2>Create a project to anchor invite testing</h2>
              </div>
            </div>

            <form className="stacked-form" onSubmit={(event) => void createProject(event)}>
              <div className="form-grid two-column">
                <label className="field">
                  <span>Project name</span>
                  <input
                    type="text"
                    value={createProjectName}
                    onChange={(event) => setCreateProjectName(event.target.value)}
                    placeholder="New office build"
                  />
                </label>

                <label className="field">
                  <span>Start date</span>
                  <input
                    type="date"
                    value={createProjectStartDate}
                    onChange={(event) => setCreateProjectStartDate(event.target.value)}
                  />
                </label>
              </div>

              <label className="field">
                <span>Description</span>
                <input
                  type="text"
                  value={createProjectDescription}
                  onChange={(event) => setCreateProjectDescription(event.target.value)}
                  placeholder="Optional short description"
                />
              </label>

              <label className="field">
                <span>Location</span>
                <input
                  type="text"
                  value={createProjectLocation}
                  onChange={(event) => setCreateProjectLocation(event.target.value)}
                  placeholder="Berlin"
                />
              </label>

              <div className="inline-actions">
                <button type="submit" className="primary-btn" disabled={projectCreateLoading || !token}>
                  {projectCreateLoading ? "Creating..." : "Create project"}
                </button>
                <span className="inline-note">
                  The backend creates the project under the signed-in user&apos;s company.
                </span>
              </div>
            </form>

            {projectCreateMessage ? (
              <Notice tone={projectCreateTone} message={projectCreateMessage} />
            ) : null}
          </section>

          <section className="workflow-card">
            <div className="section-header">
              <div>
                <p className="eyebrow">Company members</p>
                <h2>Inspect and invite company users</h2>
              </div>
              <button
                type="button"
                className="ghost-btn"
                onClick={() => void loadCompanyMembers()}
                disabled={companyMembersLoading || !token}
              >
                {companyMembersLoading ? "Loading..." : "Load company members"}
              </button>
            </div>

            <form className="stacked-form" onSubmit={(event) => void inviteCompanyMember(event)}>
              <div className="form-grid two-column">
                <label className="field">
                  <span>Company id</span>
                  <input
                    type="text"
                    value={companyId}
                    onChange={(event) => setCompanyId(event.target.value)}
                    placeholder="Auto-filled from /companies/me"
                  />
                </label>

                <label className="field">
                  <span>Company role</span>
                  <select
                    value={companyInviteRole}
                    onChange={(event) => setCompanyInviteRole(event.target.value as CompanyRole)}
                  >
                    {COMPANY_ROLE_OPTIONS.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="inline-actions">
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => {
                    if (currentCompany?.company?.id) {
                      setCompanyId(currentCompany.company.id);
                    }
                  }}
                  disabled={!currentCompany}
                >
                  Use my company
                </button>
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => {
                    if (selectedProject?.companyId) {
                      setCompanyId(selectedProject.companyId);
                    }
                  }}
                  disabled={!selectedProject}
                >
                  Use selected project company
                </button>
              </div>

              <label className="field">
                <span>Email to invite</span>
                <input
                  type="email"
                  value={companyInviteEmail}
                  onChange={(event) => setCompanyInviteEmail(event.target.value)}
                  placeholder="person@company.com"
                />
              </label>

              <button type="submit" className="primary-btn" disabled={companyInviteLoading || !token}>
                {companyInviteLoading ? "Sending invite..." : "Send company invite"}
              </button>
            </form>

            {companyInviteMessage ? (
              <Notice tone={companyInviteTone} message={companyInviteMessage} />
            ) : null}

            <div className="resource-list">
              <span className="hint-label">Current company</span>
              {currentCompany ? (
                <button type="button" className="resource-pill active" onClick={() => setCompanyId(currentCompany.company.id)}>
                  <span>{currentCompany.company.name}</span>
                  <small>
                    {currentCompany.company.id} · role: {currentCompany.role}
                  </small>
                </button>
              ) : (
                <p className="resource-empty">
                  No company loaded yet. Refresh after sign-up to fetch the company created by user.created.
                </p>
              )}
            </div>
          </section>

          <section className="workflow-card">
            <div className="section-header">
              <div>
                <p className="eyebrow">Project members</p>
                <h2>Inspect and invite project users</h2>
              </div>
              <button
                type="button"
                className="ghost-btn"
                onClick={() => void loadProjectMembers()}
                disabled={projectMembersLoading || !token}
              >
                {projectMembersLoading ? "Loading..." : "Load project members"}
              </button>
            </div>

            <form className="stacked-form" onSubmit={(event) => void inviteProjectMember(event)}>
              <div className="form-grid two-column">
                <label className="field">
                  <span>Project id</span>
                  <input
                    type="text"
                    value={projectId}
                    onChange={(event) => setProjectId(event.target.value)}
                    placeholder="Paste a project UUID"
                  />
                </label>

                <label className="field">
                  <span>Project role</span>
                  <select
                    value={projectInviteRole}
                    onChange={(event) => setProjectInviteRole(event.target.value as ProjectRole)}
                  >
                    {ROLE_OPTIONS.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="inline-actions">
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => {
                    if (projects.length > 0) {
                      selectProject(projects[0]);
                    }
                  }}
                  disabled={projects.length === 0}
                >
                  Use first loaded project
                </button>
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => {
                    if (selectedProject) {
                      selectProject(selectedProject);
                    }
                  }}
                  disabled={!selectedProject}
                >
                  Sync with selected project
                </button>
              </div>

              <label className="field">
                <span>Email to invite</span>
                <input
                  type="email"
                  value={projectInviteEmail}
                  onChange={(event) => setProjectInviteEmail(event.target.value)}
                  placeholder="person@company.com"
                />
              </label>

              <div className="invite-suggestions">
                <span className="hint-label">Existing company members</span>
                {projectInviteSuggestions.length === 0 ? (
                  <p className="resource-empty">
                    Load company members to autocomplete emails already inside the company.
                  </p>
                ) : (
                  <div className="chip-row">
                    {projectInviteSuggestions.map((member) => (
                      <button
                        key={member.userId}
                        type="button"
                        className="chip-button"
                        onClick={() => setProjectInviteEmail(member.email.toLowerCase())}
                      >
                        {member.email.toLowerCase()}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button type="submit" className="primary-btn" disabled={projectInviteLoading || !token}>
                {projectInviteLoading ? "Sending invite..." : "Send project invite"}
              </button>
            </form>

            {projectInviteMessage ? (
              <Notice tone={projectInviteTone} message={projectInviteMessage} />
            ) : null}

            <div className="resource-list">
              <span className="hint-label">Loaded projects</span>
              {projects.length === 0 ? (
                <p className="resource-empty">
                  No projects loaded yet. Refresh after login or create one above.
                </p>
              ) : (
                <div className="pill-group">
                  {projects.map((project) => (
                    <button
                      key={project.id}
                      type="button"
                      className={project.id === projectId ? "resource-pill active" : "resource-pill"}
                      onClick={() => selectProject(project)}
                    >
                      <span>{project.name}</span>
                      <small>
                        {project.id}
                        {project.role ? ` • your role: ${project.role}` : ""}
                      </small>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>
        </main>

        <aside className="dashboard-side">
          <section className="inspector-card">
            <div className="section-header">
              <div>
                <p className="eyebrow">Company members view</p>
                <h2>Who is in the company?</h2>
              </div>
            </div>

            <div className="summary-box">
              <span className="hint-label">Selected company</span>
              <strong>{companyId || "No company id selected"}</strong>
            </div>

            <button
              type="button"
              className="primary-btn"
              onClick={() => void loadCompanyMembers()}
              disabled={companyMembersLoading || !token}
            >
              {companyMembersLoading ? "Loading..." : "Load company members"}
            </button>

            {companyMembersMessage ? (
              <Notice tone={companyMembersTone} message={companyMembersMessage} />
            ) : null}

            <div className="member-list">
              {companyMembers.length === 0 ? (
                <p className="resource-empty">
                  Load a company to see members, their company role, and their project memberships.
                </p>
              ) : (
                companyMembers.map((member) => (
                  <article key={member.userId} className="member-card">
                    <div className="member-card-head">
                      <div>
                        <strong>
                          {member.firstName || member.lastName
                            ? `${member.firstName} ${member.lastName}`.trim()
                            : member.email}
                        </strong>
                        <p>{member.email}</p>
                      </div>
                      <span className="role-badge">{member.companyRole}</span>
                    </div>

                    <div className="member-meta">
                      <span className="hint-label">Projects</span>
                      {member.projects.length === 0 ? (
                        <p className="resource-empty">No project memberships yet.</p>
                      ) : (
                        <div className="project-chip-list">
                          {member.projects.map((project) => (
                            <span key={project.projectId} className="chip">
                              {project.projectName} · {project.role}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>

          <section className="inspector-card">
            <div className="section-header">
              <div>
                <p className="eyebrow">Company invites view</p>
                <h2>Invitation status timeline</h2>
              </div>
              <button
                type="button"
                className="ghost-btn"
                onClick={() => void loadCompanyInvites(token, companyId.trim())}
                disabled={companyInvitesLoading || !token || !companyId.trim()}
              >
                {companyInvitesLoading ? "Loading..." : "Load invites"}
              </button>
            </div>

            <div className="summary-box">
              <span className="hint-label">Selected company</span>
              <strong>{companyId || "No company id selected"}</strong>
            </div>

            <div className="member-list">
              {companyInvites.length === 0 ? (
                <p className="resource-empty">
                  Load a company to see invitation email, status, invited time, and accepted time.
                </p>
              ) : (
                companyInvites.map((invite) => (
                  <article key={invite.id} className="member-card">
                    <div className="member-card-head">
                      <div>
                        <strong>{invite.email}</strong>
                        <p>
                          Invited {new Date(invite.createdAt).toLocaleString()}
                          {invite.invitedByEmail ? ` by ${invite.invitedByEmail}` : ""}
                        </p>
                      </div>
                      <span className="role-badge">{invite.status}</span>
                    </div>

                    <div className="member-meta">
                      <span className="hint-label">Role</span>
                      <span className="chip">{invite.role}</span>
                      <span className="hint-label">Accepted</span>
                      <span className="chip">
                        {invite.acceptedAt
                          ? new Date(invite.acceptedAt).toLocaleString()
                          : "Not accepted yet"}
                      </span>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>

          <section className="inspector-card">
            <div className="section-header">
              <div>
                <p className="eyebrow">Project members view</p>
                <h2>Who is in the project?</h2>
              </div>
            </div>

            <div className="summary-box">
              <span className="hint-label">Selected project</span>
              <strong>{selectedProject?.name || projectId || "No project selected"}</strong>
            </div>

            <button
              type="button"
              className="primary-btn"
              onClick={() => void loadProjectMembers()}
              disabled={projectMembersLoading || !token}
            >
              {projectMembersLoading ? "Loading..." : "Load project members"}
            </button>

            {projectMembersMessage ? (
              <Notice tone={projectMembersTone} message={projectMembersMessage} />
            ) : null}

            <div className="member-list">
              {projectMembers.length === 0 ? (
                <p className="resource-empty">
                  Load a project to see members and the roles assigned inside that project.
                </p>
              ) : (
                projectMembers.map((member) => (
                  <article key={member.userId} className="member-card">
                    <div className="member-card-head">
                      <div>
                        <strong>
                          {member.firstName || member.lastName
                            ? `${member.firstName} ${member.lastName}`.trim()
                            : member.email}
                        </strong>
                        <p>{member.email}</p>
                      </div>
                      <span className="role-badge">{member.role}</span>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>

          <section className="inspector-card checklist-card">
            <div className="section-header">
              <div>
                <p className="eyebrow">Testing checklist</p>
                <h2>Suggested flow</h2>
              </div>
            </div>

            <ol className="checklist">
              <li>Sign up a new Clerk user so the backend creates the local user and company.</li>
              <li>Create a project from this dashboard.</li>
              <li>Invite a user to the company and confirm they appear in company members.</li>
              <li>Invite a user to the project and confirm they appear in project members.</li>
              <li>Use the member views to verify company roles and project roles.</li>
            </ol>
          </section>
        </aside>
      </div>
    </div>
  );
}

function Notice({ tone, message }: { tone: Tone; message: string }) {
  if (!message) return null;

  const className =
    tone === "error" ? "status-banner error" : tone === "success" ? "status-banner success" : "status-banner";

  return <div className={className}>{message}</div>;
}
