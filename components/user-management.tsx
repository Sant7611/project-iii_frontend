"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Search, Trash2, UserPlus, Users, X } from "lucide-react";

import { API_URL } from "@/lib/api";
import { authenticatedFetch, getStoredUser, hasAuthSession } from "@/lib/auth";

export type ManagedUser = {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  role: "user" | "moderator" | "super_admin";
  is_active?: boolean;
  profile?: { avatar: string | null; bio: string; address: string };
  post_count?: number;
};

export function UserManagement() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [actorRole, setActorRole] = useState("");
  const [addingModerator, setAddingModerator] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadUsers() {
      const actor = getStoredUser();
      if (!actor || !hasAuthSession()) {
        if (!cancelled) {
          setMessage("Sign in with a moderator or super-admin account.");
          setLoading(false);
        }
        return;
      }

      setActorRole(actor.role);
      try {
        const response = await authenticatedFetch(
          `${API_URL}/management/users/`,
          { headers: { Accept: "application/json" } },
        );
        const payload = await readResponse(response);
        if (response.status === 404) {
          throw new Error(
            "GET /api/management/users/ has not been added to the backend yet.",
          );
        }
        if (!response.ok) {
          throw new Error("You do not have permission to manage users.");
        }
        if (!cancelled) setUsers(extractUsers(payload));
      } catch (reason) {
        if (!cancelled) {
          setMessage(
            reason instanceof Error
              ? reason.message
              : "The accounts could not be loaded.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadUsers();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredUsers = useMemo(
    () =>
      users.filter((user) =>
        user.role === "user" &&
        [
          user.username,
          user.first_name,
          user.last_name,
          user.email,
          user.role,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [users, query],
  );

  const filteredModerators = useMemo(
    () =>
      users.filter(
        (user) =>
          user.role === "moderator" &&
          [user.username, user.first_name, user.last_name, user.email]
            .join(" ")
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [users, query],
  );

  async function createModerator(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreateError("");

    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") || "");
    const password2 = String(form.get("password2") || "");
    if (password !== password2) {
      setCreateError("Passwords must match.");
      return;
    }

    setCreating(true);
    try {
      const response = await authenticatedFetch(
        `${API_URL}/management/users/create_moderator/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            username: form.get("username"),
            first_name: form.get("first_name"),
            last_name: form.get("last_name"),
            email: form.get("email"),
            phone: form.get("phone"),
            password,
            password2,
          }),
        },
      );
      const payload = await readResponse(response);
      if (response.status === 404 || response.status === 405) {
        throw new Error(
            "The backend does not expose the moderator-creation endpoint.",
        );
      }
      if (!response.ok) throw new Error(apiError(payload));

      const moderator = normalizeCreatedModerator(payload, form);
      setUsers((current) => [moderator, ...current]);
      setAddingModerator(false);
      setMessage(`${moderator.username} was added as a moderator.`);
    } catch (reason) {
      setCreateError(
        reason instanceof Error
          ? reason.message
          : "The moderator could not be created.",
      );
    } finally {
      setCreating(false);
    }
  }

  async function remove(user: ManagedUser) {
    if (!window.confirm(`Remove ${user.username}? Their account should be soft-deleted.`)) return;

    const response = await authenticatedFetch(
      `${API_URL}/management/users/${user.id}/`,
      {
        method: "DELETE",
        headers: { Accept: "application/json" },
      },
    );
    if (response.ok) {
      setUsers((items) => items.filter((item) => item.id !== user.id));
      setMessage(`${user.username} was removed.`);
    } else {
      setMessage("The account could not be removed.");
    }
  }

  return (
    <>
      <header className="page-heading">
        <span className="kicker">Role-safe oversight</span>
        <h1>User management</h1>
        <p>
          View user and moderator profiles and their contributions. Account
          information remains read-only here.
        </p>
      </header>

      <div className="management-toolbar">
        <label className="search-box">
          <Search size={17} />
          <span className="sr-only">Search users</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search users…"
          />
        </label>
        <div className="management-toolbar-actions">
          <span>
            {actorRole === "super_admin"
              ? `${filteredUsers.length} users · ${filteredModerators.length} moderators`
              : `${filteredUsers.length} users`}
          </span>
          {actorRole === "super_admin" && (
            <button
              className="button button-primary"
              onClick={() => {
                setCreateError("");
                setAddingModerator(true);
              }}
            >
              <UserPlus size={16} /> Add moderator
            </button>
          )}
        </div>
      </div>

      {message && (
        <div className="notice" role="status">
          {message}
        </div>
      )}

      {loading ? (
        <div className="empty-state">
          <p>Loading accounts…</p>
        </div>
      ) : (
        <div className="management-lists">
          <ManagedAccountList
            title="Users"
            users={filteredUsers}
            onRemove={remove}
          />
          {actorRole === "super_admin" && (
            <ManagedAccountList
              title="Moderators"
              users={filteredModerators}
              onRemove={remove}
            />
          )}
        </div>
      )}

      {addingModerator && actorRole === "super_admin" && (
        <div className="modal-backdrop" role="presentation">
          <section
            className="profile-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-moderator-title"
          >
            <button
              className="modal-close"
              onClick={() => setAddingModerator(false)}
              aria-label="Close moderator form"
            >
              <X size={20} />
            </button>
            <h2 id="add-moderator-title">Add moderator</h2>
            <p className="modal-intro">
              This account will be created with the moderator role.
            </p>
            <form className="form" onSubmit={createModerator}>
              <div className="form-split">
                <div className="field">
                  <label htmlFor="moderator-first-name">First name</label>
                  <input
                    id="moderator-first-name"
                    name="first_name"
                    autoComplete="given-name"
                  />
                </div>
                <div className="field">
                  <label htmlFor="moderator-last-name">Last name</label>
                  <input
                    id="moderator-last-name"
                    name="last_name"
                    autoComplete="family-name"
                  />
                </div>
              </div>
              <div className="field">
                <label htmlFor="moderator-username">Username</label>
                <input
                  id="moderator-username"
                  name="username"
                  autoComplete="username"
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="moderator-email">Email</label>
                <input
                  id="moderator-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="moderator-phone">Phone</label>
                <input
                  id="moderator-phone"
                  name="phone"
                  autoComplete="tel"
                />
              </div>
              <div className="form-split">
                <div className="field">
                  <label htmlFor="moderator-password">Password</label>
                  <input
                    id="moderator-password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="moderator-password2">
                    Confirm password
                  </label>
                  <input
                    id="moderator-password2"
                    name="password2"
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    required
                  />
                </div>
              </div>
              {createError && (
                <div className="form-error" role="alert">
                  {createError}
                </div>
              )}
              <button className="button button-primary" disabled={creating}>
                <UserPlus size={16} />
                {creating ? "Creating…" : "Create moderator"}
              </button>
            </form>
          </section>
        </div>
      )}
    </>
  );
}

function ManagedAccountList({
  title,
  users,
  onRemove,
}: {
  title: string;
  users: ManagedUser[];
  onRemove: (user: ManagedUser) => void;
}) {
  return (
    <section className="management-list-section">
      <div className="section-heading management-list-heading">
        <div>
          <span className="kicker">Accounts</span>
          <h2>{title}</h2>
        </div>
        <span>{users.length}</span>
      </div>
      {users.length ? (
        <div className="user-table-wrap">
          <table className="user-table">
            <thead>
              <tr>
                <th>{title.slice(0, -1)}</th>
                <th>Posts</th>
                <th>Status</th>
                <th><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td><Link href={`/users/${user.id}`} className="table-user"><span className="user-avatar">{user.profile?.avatar ? <img src={user.profile.avatar} alt="" /> : null}</span><span><strong>{[user.first_name, user.last_name].filter(Boolean).join(" ") || user.username}</strong><small>{user.email}</small></span></Link></td>
                  <td>{user.post_count ?? "—"}</td>
                  <td>{user.is_active === false ? "Removed" : "Active"}</td>
                  <td><button className="icon-button danger" onClick={() => onRemove(user)} aria-label={`Remove ${user.username}`}><Trash2 size={16} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state management-empty"><Users size={30} /><h2>No {title.toLowerCase()}</h2><p>No permitted accounts matched your search.</p></div>
      )}
    </section>
  );
}

async function readResponse(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

function extractUsers(payload: unknown): ManagedUser[] {
  if (Array.isArray(payload)) return payload as ManagedUser[];
  if (!payload || typeof payload !== "object") return [];
  const response = payload as {
    results?: ManagedUser[];
    data?: ManagedUser[] | { results?: ManagedUser[] };
  };
  if (Array.isArray(response.results)) return response.results;
  if (Array.isArray(response.data)) return response.data;
  return response.data?.results || [];
}

function extractCreatedUser(payload: unknown): ManagedUser {
  if (!payload || typeof payload !== "object") {
    throw new Error("The backend returned an invalid moderator response.");
  }
  const response = payload as { data?: ManagedUser };
  const user = response.data || (payload as ManagedUser);
  if (!user.id || !user.username) {
    throw new Error("The backend returned an invalid moderator response.");
  }
  return user;
}

function normalizeCreatedModerator(
  payload: unknown,
  form: FormData,
): ManagedUser {
  const created = extractCreatedUser(payload);
  return {
    ...created,
    first_name: created.first_name || String(form.get("first_name") || ""),
    last_name: created.last_name || String(form.get("last_name") || ""),
    phone: created.phone || String(form.get("phone") || ""),
    role: "moderator",
  };
}

function apiError(payload: unknown): string {
  if (!payload || typeof payload !== "object") {
    return "The moderator could not be created.";
  }
  const response = payload as Record<string, unknown>;
  if (typeof response.message === "string") return response.message;
  if (typeof response.detail === "string") return response.detail;
  return Object.entries(response)
    .map(([field, value]) =>
      `${field}: ${Array.isArray(value) ? value.join(" ") : String(value)}`,
    )
    .join(" ");
}
