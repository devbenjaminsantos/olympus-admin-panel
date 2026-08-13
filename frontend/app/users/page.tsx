"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Edit2, Plus, RefreshCcw, Search, ShieldCheck, Trash2, X } from "lucide-react";
import { ProtectedPage } from "../../components/ProtectedPage";
import { ApiError, apiFetch } from "../../lib/api";

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
};

type UserRole = "Admin" | "Manager" | "Support" | "Viewer";
type UserStatus = "Active" | "Inactive";

type UserForm = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  status: UserStatus;
};

const emptyForm: UserForm = {
  name: "",
  email: "",
  password: "",
  role: "Viewer",
  status: "Active"
};

export default function UsersPage() {
  return (
    <ProtectedPage roles={["Admin"]} subtitle="Identity and access" title="Users">
      {() => <UsersTable />}
    </ProtectedPage>
  );
}

function UsersTable() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | UserStatus>("All");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [message, setMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    void loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return users.filter((user) => {
      const matchesQuery = !normalizedQuery || [user.name, user.role, user.status]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
      const matchesStatus = statusFilter === "All" || user.status === statusFilter;

      return matchesQuery && matchesStatus;
    });
  }, [query, statusFilter, users]);

  async function loadUsers() {
    setState("loading");

    try {
      const result = await apiFetch<UserRow[]>("/api/users");
      setUsers(result);
      setState("ready");
    } catch {
      setState("error");
    }
  }

  function openCreateForm() {
    setEditingUser(null);
    setForm(emptyForm);
    setMessage(null);
    setIsFormOpen(true);
  }

  function openEditForm(user: UserRow) {
    setEditingUser(user);
    setForm({
      name: user.name,
      email: "",
      password: "",
      role: user.role,
      status: user.status
    });
    setMessage(null);
    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
    setEditingUser(null);
    setForm(emptyForm);
    setMessage(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      if (editingUser) {
        await apiFetch<UserRow>(`/api/users/${editingUser.id}`, {
          method: "PUT",
          headers: {
            "content-type": "application/json"
          },
          body: JSON.stringify({
            name: form.name,
            email: form.email,
            role: form.role,
            status: form.status
          })
        });
      } else {
        await apiFetch<UserRow>("/api/users", {
          method: "POST",
          headers: {
            "content-type": "application/json"
          },
          body: JSON.stringify(form)
        });
      }

      await loadUsers();
      closeForm();
    } catch (error) {
      setMessage(getUserErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(user: UserRow) {
    setMessage(null);

    try {
      await apiFetch<void>(`/api/users/${user.id}`, {
        method: "DELETE"
      });
      await loadUsers();
    } catch (error) {
      setMessage(getUserErrorMessage(error));
    }
  }

  if (state === "loading") {
    return <div className="state">Loading</div>;
  }

  if (state === "error") {
    return <div className="state state-error">Unable to load users</div>;
  }

  const activeUsers = users.filter((user) => user.status === "Active").length;

  return (
    <div className="users-page">
      <div className="data-toolbar">
        <div className="data-toolbar-summary">
          <strong>{users.length} users</strong>
          <span>{activeUsers} accounts currently active</span>
        </div>
        <div className="data-toolbar-actions">
          <label className="search-field">
            <Search aria-hidden size={17} />
            <span className="sr-only">Search users</span>
            <input onChange={(event) => setQuery(event.target.value)} placeholder="Search by name, role, or status" type="search" value={query} />
          </label>
          <button aria-label="Refresh users" className="icon-button" onClick={() => void loadUsers()} title="Refresh users" type="button">
            <RefreshCcw aria-hidden size={16} />
          </button>
          <button className="button" onClick={openCreateForm} type="button">
            <Plus aria-hidden size={16} />
            <span>New user</span>
          </button>
        </div>
      </div>

      <div className="segmented-control" aria-label="Filter users by status">
        {(["All", "Active", "Inactive"] as const).map((status) => (
          <button
            aria-pressed={statusFilter === status}
            className={statusFilter === status ? "segmented-control-active" : ""}
            key={status}
            onClick={() => setStatusFilter(status)}
            type="button"
          >
            {status}
          </button>
        ))}
      </div>

      {message ? <div className="alert alert-error">{message}</div> : null}

      <div className={`users-workspace ${isFormOpen ? "users-workspace-panel-open" : ""}`}>
        <section className="data-table-panel" aria-label="User access records">
          {users.length === 0 ? (
            <div className="state">No users have been created yet.</div>
          ) : filteredUsers.length === 0 ? (
            <div className="state">No users match the current filters.</div>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Protected email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <div className="user-identity">
                          <span aria-hidden className="client-avatar">{getInitials(user.name)}</span>
                          <strong>{user.name}</strong>
                        </div>
                      </td>
                      <td><span className="protected-value"><ShieldCheck aria-hidden size={14} /> {maskEmail(user.email)}</span></td>
                      <td><span className={`role-badge role-badge-${user.role.toLowerCase()}`}>{user.role}</span></td>
                      <td><span className={`status-pill user-status-${user.status.toLowerCase()}`}>{user.status}</span></td>
                      <td>
                        <div className="row-actions">
                          <button aria-label={`Edit ${user.name}`} className="icon-button" onClick={() => openEditForm(user)} title="Edit user" type="button">
                            <Edit2 aria-hidden size={16} />
                          </button>
                          <button aria-label={`Delete ${user.name}`} className="icon-button danger-button" onClick={() => void handleDelete(user)} title="Delete user" type="button">
                            <Trash2 aria-hidden size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {isFormOpen ? (
          <aside className="detail-panel user-detail-panel" aria-labelledby="user-panel-title">
            <form onSubmit={handleSubmit}>
              <div className="detail-panel-header">
                <div>
                  <span className="dashboard-kicker">Access record</span>
                  <h2 id="user-panel-title">{editingUser ? "Edit user" : "New user"}</h2>
                </div>
                <button aria-label="Close user panel" className="icon-button" onClick={closeForm} title="Close" type="button">
                  <X aria-hidden size={16} />
                </button>
              </div>
              {editingUser ? (
                <div className="protected-note">
                  <ShieldCheck aria-hidden size={16} />
                  <span>Email is protected. Re-enter it to save changes.</span>
                </div>
              ) : null}
              <div className="detail-panel-fields">
                <div className="field">
                  <label htmlFor="user-name">Name</label>
                  <input className="input" id="user-name" minLength={2} onChange={(event) => setForm({ ...form, name: event.target.value })} required value={form.name} />
                </div>
                <div className="field">
                  <label htmlFor="user-email">Email</label>
                  <input className="input" id="user-email" onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder={editingUser ? maskEmail(editingUser.email) : undefined} required type="email" value={form.email} />
                </div>
                {!editingUser ? (
                  <div className="field">
                    <label htmlFor="user-password">Password</label>
                    <input className="input" id="user-password" minLength={8} onChange={(event) => setForm({ ...form, password: event.target.value })} required type="password" value={form.password} />
                  </div>
                ) : null}
                <div className="field">
                  <label htmlFor="user-role">Role</label>
                  <select className="input" id="user-role" onChange={(event) => setForm({ ...form, role: event.target.value as UserRole })} value={form.role}>
                    <option value="Admin">Admin</option>
                    <option value="Manager">Manager</option>
                    <option value="Support">Support</option>
                    <option value="Viewer">Viewer</option>
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="user-status">Status</label>
                  <select className="input" id="user-status" onChange={(event) => setForm({ ...form, status: event.target.value as UserStatus })} value={form.status}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="detail-panel-actions">
                <button className="button button-secondary" onClick={closeForm} type="button">Cancel</button>
                <button className="button" disabled={isSaving} type="submit">{isSaving ? "Saving" : "Save user"}</button>
              </div>
            </form>
          </aside>
        ) : null}
      </div>
    </div>
  );
}

function getInitials(name: string): string {
  return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function maskEmail(email: string): string {
  const [localPart, domain] = email.split("@");

  if (!localPart || !domain) {
    return "Protected";
  }

  return `${localPart.slice(0, 1)}${"*".repeat(Math.max(localPart.length - 1, 3))}@${domain}`;
}

function getUserErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 409) {
      return "Email already exists.";
    }

    if (error.status === 400) {
      return "Operation rejected. Check role, status, or last active admin rule.";
    }

    if (error.status === 403) {
      return "Permission denied.";
    }
  }

  return "Unable to save user.";
}
