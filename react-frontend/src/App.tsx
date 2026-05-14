import { useEffect, useMemo, useState, type FormEvent } from "react";
import { SignIn, SignUp, SignedIn, SignedOut, useAuth, useUser, UserButton } from "@clerk/clerk-react";

type AuthMode = "sign-in" | "sign-up";
type ProjectRole = "ADMIN" | "CONTRACTOR" | "VIEWER";

type ProjectSummary = {
  id: string;
  name: string;
  description?: string | null;
  location?: string | null;
  startDate?: string | null;
  companyId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

type ApiResponse<T> = {
  success: boolean;
  data: T;
  error?: unknown;
  timestamp: string;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";
const APP_URL = import.meta.env.VITE_APP_URL ?? window.location.origin;
const ROLE_OPTIONS: ProjectRole[] = ["CONTRACTOR", "VIEWER", "ADMIN"];

export default function App() {
  const [mode, setMode] = useState<AuthMode>("sign-in");

  return (
    <div className="page-shell">
      <SignedOut>
        <div className="auth-layout">
          <section className="hero-card">
            <p className="eyebrow">Claimo backend testing</p>
            <h1>Sign in, sign up, and test project invites.</h1>
            <p className="hero-copy">
              Use Clerk on the right, then create a project invite from the signed-in
              dashboard to verify the invite lifecycle end to end.
            </p>

            <div className="feature-list">
              <div className="feature-item">
                <span className="feature-label">Step 1</span>
                <span>Sign in or sign up with Clerk</span>
              </div>
              <div className="feature-item">
                <span className="feature-label">Step 2</span>
                <span>Open the signed-in dashboard and choose a project</span>
              </div>
              <div className="feature-item">
                <span className="feature-label">Step 3</span>
                <span>Send the invite and watch the webhook flow in the backend</span>
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
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<ProjectRole>("VIEWER");
  const [loading, setLoading] = useState(false);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [copyStatus, setCopyStatus] = useState("Copy token");
  const [statusMessage, setStatusMessage] = useState("");
  const [statusTone, setStatusTone] = useState<"success" | "error" | "neutral">("neutral");

  const displayName = useMemo(() => {
    if (!user) return "User";
    return user.fullName || user.username || user.primaryEmailAddress?.emailAddress || "User";
  }, [user]);

  useEffect(() => {
    void refreshSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    if (!selectedProjectId && projects.length > 0) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  async function refreshSession() {
    setLoading(true);
    setStatusMessage("");

    try {
      const jwt = await getToken({ template: "testing" });
      const nextToken = jwt ?? "";
      setToken(nextToken);

      if (nextToken) {
        await loadProjects(nextToken);
      } else {
        setProjects([]);
      }
    } catch (error) {
      console.error("Failed to load Clerk token", error);
      setStatusTone("error");
      setStatusMessage("Failed to load your Clerk token.");
    } finally {
      setLoading(false);
    }
  }

  async function loadProjects(jwtToken: string) {
    setProjectsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/projects`, {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to load projects (${response.status})`);
      }

      const json = (await response.json()) as ApiResponse<ProjectSummary[]>;
      setProjects(json.data ?? []);
      setStatusMessage("");
    } catch (error) {
      console.error(error);
      setProjects([]);
      setStatusTone("error");
      setStatusMessage("Could not load projects. Check the backend and your JWT.");
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

  async function sendInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token) {
      setStatusTone("error");
      setStatusMessage("Token is not loaded yet.");
      return;
    }

    if (!selectedProjectId) {
      setStatusTone("error");
      setStatusMessage("Choose a project first.");
      return;
    }

    const trimmedEmail = inviteEmail.trim().toLowerCase();
    if (!trimmedEmail) {
      setStatusTone("error");
      setStatusMessage("Enter an email address.");
      return;
    }

    setInviteSubmitting(true);
    setStatusMessage("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/projects/${selectedProjectId}/members`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: trimmedEmail,
            role: inviteRole,
          }),
        },
      );

      if (!response.ok) {
        let message = `Invite failed (${response.status})`;
        try {
          const json = await response.json();
          message = json?.error?.message || json?.message || message;
        } catch {
          // Ignore JSON parse failures and keep the generic error.
        }
        throw new Error(message);
      }

      setStatusTone("success");
      setStatusMessage(`Invite sent to ${trimmedEmail}.`);
      setInviteEmail("");
      await loadProjects(token);
    } catch (error) {
      console.error(error);
      setStatusTone("error");
      setStatusMessage(error instanceof Error ? error.message : "Failed to send invite.");
    } finally {
      setInviteSubmitting(false);
    }
  }

  const selectedProject = projects.find((project) => project.id === selectedProjectId);

  return (
    <div className="dashboard-layout">
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">Signed in</p>
          <h1>Welcome, {displayName}</h1>
          <p className="hero-copy">
            Your Clerk JWT from the <code>testing</code> template is available below and
            can be used to send project invites.
          </p>
        </div>

        <div className="header-actions">
          <button type="button" className="ghost-btn" onClick={() => void refreshSession()} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh data"}
          </button>
          <UserButton afterSignOutUrl="/" />
          <button type="button" className="ghost-btn danger" onClick={() => void signOut()}>
            Sign out
          </button>
        </div>
      </header>

      {statusMessage ? (
        <div
          className={
            statusTone === "error"
              ? "status-banner error"
              : statusTone === "success"
                ? "status-banner success"
                : "status-banner"
          }
        >
          {statusMessage}
        </div>
      ) : null}

      <div className="dashboard-grid">
        <main className="token-card">
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
        </main>

        <section className="invite-card">
          <div className="invite-card-header">
            <div>
              <p className="eyebrow">Project invite</p>
              <h2>Send an invite to test the Clerk webhook flow</h2>
            </div>
            <button
              type="button"
              className="ghost-btn"
              onClick={() => void loadProjects(token)}
              disabled={projectsLoading || !token}
            >
              {projectsLoading ? "Loading..." : "Reload projects"}
            </button>
          </div>

          <form className="invite-form" onSubmit={(event) => void sendInvite(event)}>
            <label className="field">
              <span>Project</span>
              <select
                value={selectedProjectId}
                onChange={(event) => setSelectedProjectId(event.target.value)}
              >
                <option value="">Select a project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name} {project.location ? `• ${project.location}` : ""}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Or paste project id</span>
              <input
                type="text"
                value={selectedProjectId}
                onChange={(event) => setSelectedProjectId(event.target.value)}
                placeholder="UUID from the backend"
              />
            </label>

            <label className="field">
              <span>Email to invite</span>
              <input
                type="email"
                value={inviteEmail}
                onChange={(event) => setInviteEmail(event.target.value)}
                placeholder="person@company.com"
              />
            </label>

            <label className="field">
              <span>Project role</span>
              <select value={inviteRole} onChange={(event) => setInviteRole(event.target.value as ProjectRole)}>
                {ROLE_OPTIONS.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </label>

            <button type="submit" className="primary-btn" disabled={inviteSubmitting || !token}>
              {inviteSubmitting ? "Sending invite..." : "Send project invite"}
            </button>
          </form>

          <div className="invite-meta">
            <div className="invite-summary">
              <span className="hint-label">Selected project</span>
              <strong>{selectedProject?.name || "No project selected"}</strong>
            </div>

            <div className="project-list">
              <span className="hint-label">Loaded projects</span>
              {projects.length === 0 ? (
                <p className="project-empty">
                  No projects loaded yet. Refresh after login or paste a project id above.
                </p>
              ) : (
                projects.map((project) => (
                  <button
                    key={project.id}
                    type="button"
                    className={project.id === selectedProjectId ? "project-pill active" : "project-pill"}
                    onClick={() => setSelectedProjectId(project.id)}
                  >
                    <span>{project.name}</span>
                    <small>{project.id}</small>
                  </button>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
