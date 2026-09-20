import { API_URL } from "./api";

export const AUTH_CHANGE_EVENT = "tfacts-auth-change";

export type StoredUser = {
  id: number;
  username: string;
  email: string;
  role: string;
};

const STORAGE = {
  access: "tfacts-access",
  refresh: "tfacts-refresh",
  user: "tfacts-user",
} as const;

const LEGACY_STORAGE = {
  access: "quillora-access",
  refresh: "quillora-refresh",
  user: "quillora-user",
} as const;

let refreshPromise: Promise<string | null> | null = null;

function migrateLegacySession(): void {
  if (typeof window === "undefined") return;

  for (const key of Object.keys(STORAGE) as Array<keyof typeof STORAGE>) {
    if (!localStorage.getItem(STORAGE[key])) {
      const legacyValue = localStorage.getItem(LEGACY_STORAGE[key]);
      if (legacyValue) localStorage.setItem(STORAGE[key], legacyValue);
    }
    localStorage.removeItem(LEGACY_STORAGE[key]);
  }
}

export function getStoredUser(): StoredUser | null {
  if (typeof window === "undefined") return null;
  migrateLegacySession();

  const value = localStorage.getItem(STORAGE.user);
  if (!value) return null;

  try {
    const user = JSON.parse(value) as StoredUser;
    return user.id && user.username ? user : null;
  } catch {
    return null;
  }
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  migrateLegacySession();
  return localStorage.getItem(STORAGE.access);
}

export function hasAuthSession(): boolean {
  if (typeof window === "undefined") return false;
  migrateLegacySession();
  return Boolean(localStorage.getItem(STORAGE.access) && getStoredUser());
}

export function storeAuthSession(
  access: string,
  refresh: string,
  user: StoredUser,
): void {
  localStorage.setItem(STORAGE.access, access);
  localStorage.setItem(STORAGE.refresh, refresh);
  localStorage.setItem(STORAGE.user, JSON.stringify(user));
  clearLegacySession();
  notifyAuthChange();
}

export function updateStoredUser(user: StoredUser): void {
  localStorage.setItem(STORAGE.user, JSON.stringify(user));
  notifyAuthChange();
}

export function clearAuthSession(): void {
  localStorage.removeItem(STORAGE.access);
  localStorage.removeItem(STORAGE.refresh);
  localStorage.removeItem(STORAGE.user);
  clearLegacySession();
  notifyAuthChange();
}

export async function authenticatedFetch(
  input: string,
  init: RequestInit = {},
): Promise<Response> {
  migrateLegacySession();
  const access = localStorage.getItem(STORAGE.access);
  const response = await fetch(input, withBearerToken(init, access));

  if (response.status !== 401) return response;

  const refreshedAccess = await refreshAccessToken();
  if (!refreshedAccess) {
    if (!localStorage.getItem(STORAGE.refresh)) redirectToLogin();
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
    migrateLegacySession();
    const refresh = localStorage.getItem(STORAGE.refresh);
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

      const payload = (await response.json()) as {
        access?: string;
        refresh?: string;
      };
      if (!payload.access) {
        clearAuthSession();
        return null;
      }

      localStorage.setItem(STORAGE.access, payload.access);
      if (payload.refresh) {
        localStorage.setItem(STORAGE.refresh, payload.refresh);
      }
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

function clearLegacySession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(LEGACY_STORAGE.access);
  localStorage.removeItem(LEGACY_STORAGE.refresh);
  localStorage.removeItem(LEGACY_STORAGE.user);
}

function notifyAuthChange(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
  }
}

function redirectToLogin(): void {
  if (typeof window === "undefined" || window.location.pathname === "/login") return;
  const returnTo = `${window.location.pathname}${window.location.search}`;
  window.location.assign(`/login?next=${encodeURIComponent(returnTo)}`);
}
