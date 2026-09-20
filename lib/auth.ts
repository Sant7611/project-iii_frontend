import { API_URL } from "./api";

export const AUTH_CHANGE_EVENT = "tfacts-auth-change";

export type StoredUser = {
  id: number;
  username: string;
  email: string;
  role: string;
};

let refreshPromise: Promise<string | null> | null = null;

export function getStoredUser(): StoredUser | null {
  if (typeof window === "undefined") return null;

  const value = localStorage.getItem("tfacts-user");
  if (!value) return null;

  try {
    const user = JSON.parse(value) as StoredUser;
    return user.id && user.username ? user : null;
  } catch {
    return null;
  }
}

export function hasAuthSession(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(localStorage.getItem("tfacts-access") && getStoredUser());
}

export function storeAuthSession(
  access: string,
  refresh: string,
  user: StoredUser,
): void {
  localStorage.setItem("tfacts-access", access);
  localStorage.setItem("tfacts-refresh", refresh);
  localStorage.setItem("tfacts-user", JSON.stringify(user));
  notifyAuthChange();
}

export function updateStoredUser(user: StoredUser): void {
  localStorage.setItem("tfacts-user", JSON.stringify(user));
  notifyAuthChange();
}

export function clearAuthSession(): void {
  localStorage.removeItem("tfacts-access");
  localStorage.removeItem("tfacts-refresh");
  localStorage.removeItem("tfacts-user");
  notifyAuthChange();
}

export async function authenticatedFetch(
  input: string,
  init: RequestInit = {},
): Promise<Response> {
  const access = localStorage.getItem("tfacts-access");
  const response = await fetch(input, withBearerToken(init, access));

  if (response.status !== 401) return response;

  const refreshedAccess = await refreshAccessToken();
  if (!refreshedAccess) {
    if (!localStorage.getItem("tfacts-refresh")) redirectToLogin();
    return response;
  }

  return fetch(input, withBearerToken(init, refreshedAccess));
}

function withBearerToken(init: RequestInit, token: string | null): RequestInit {
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return { ...init, headers };
}

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refresh = localStorage.getItem("tfacts-refresh");
    if (!refresh) {
      clearAuthSession();
      return null;
    }

    try {
      const response = await fetch(`${API_URL}/token/refresh/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ refresh }),
      });
      if (!response.ok) {
        clearAuthSession();
        return null;
      }

      const payload = (await response.json()) as { access?: string };
      if (!payload.access) {
        clearAuthSession();
        return null;
      }

      localStorage.setItem("tfacts-access", payload.access);
      notifyAuthChange();
      return payload.access;
    } catch {
      return null;
    }
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

function notifyAuthChange(): void {
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
}

function redirectToLogin(): void {
  if (window.location.pathname === "/login") return;
  const returnTo = `${window.location.pathname}${window.location.search}`;
  window.location.assign(`/login?next=${encodeURIComponent(returnTo)}`);
}
