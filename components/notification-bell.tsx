"use client";

import { Bell, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { API_URL } from "@/lib/api";
import { authenticatedFetch, type StoredUser } from "@/lib/auth";

type Notification = {
  id: number;
  title: string;
  body: string;
  notification_type: string;
  created_at: string;
  is_read: boolean;
  post?: { id: number; slug: string } | null;
  post_id?: number | null;
  slug?: string | null;
};

export function NotificationBell({ user }: { user: StoredUser | null }) {
  const router = useRouter();
  const [items, setItems] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const reconnectTimer = useRef<number | null>(null);

  useEffect(() => {
    if (!user) {
      setItems([]);
      setOpen(false);
      return;
    }

    let socket: WebSocket | null = null;
    let stopped = false;

    async function loadNotifications() {
      try {
        const response = await authenticatedFetch(`${API_URL}/notification/`, {
          headers: { Accept: "application/json" },
        });
        if (!response.ok || stopped) return;
        const payload: unknown = await response.json();
        if (!stopped) setItems(readNotifications(payload));
      } catch {
        // Live WebSocket notifications can still arrive if history is unavailable.
      }
    }

    function connect() {
      const token = localStorage.getItem("tfacts-access");
      if (!token || stopped) return;

      const url = new URL("/ws/notifications/", API_URL);
      url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
      url.searchParams.set("token", token);
      socket = new WebSocket(url);

      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as { event?: string; data?: Notification };
          if (
            (message.event !== "notification" && message.event !== "post_approval") ||
            !message.data
          ) return;
          const notification = toNotification(message.data!);
          setItems((current) => [notification, ...current.filter((item) => item.id !== notification.id)]);
        } catch {
          // Ignore malformed socket messages.
        }
      };

      socket.onclose = () => {
        if (!stopped) reconnectTimer.current = window.setTimeout(connect, 3000);
      };
    }

    void loadNotifications();
    connect();
    return () => {
      stopped = true;
      if (reconnectTimer.current !== null) window.clearTimeout(reconnectTimer.current);
      socket?.close();
    };
  }, [user?.id]);

  if (!user) return null;

  const unread = items.filter((item) => !item.is_read).length;

  async function markAllRead() {
    const unreadIds = items.filter((item) => !item.is_read).map((item) => item.id);
    if (!unreadIds.length) return;

    setItems((current) => current.map((item) => ({ ...item, is_read: true })));
    await Promise.all(
      unreadIds.map((id) =>
        authenticatedFetch(`${API_URL}/notification/${id}/`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ is_read: true }),
        }),
      ),
    );
  }

  async function deleteNotification(id: number) {
    const previous = items;
    setItems((current) => current.filter((item) => item.id !== id));
    try {
      const response = await authenticatedFetch(`${API_URL}/notification/${id}/`, {
        method: "DELETE",
        headers: { Accept: "application/json" },
      });
      if (!response.ok) setItems(previous);
    } catch {
      setItems(previous);
    }
  }

  function openNotification(item: Notification) {
    const destination = notificationDestination(item, user);
    if (destination) router.push(destination);
  }

  return (
    <div className="notification-menu">
      <button
        className="notification-button"
        type="button"
        onClick={() => {
          setOpen((current) => !current);
          void markAllRead();
        }}
        aria-label={unread ? `${unread} unread notifications` : "Notifications"}
        aria-expanded={open}
      >
        <Bell size={19} />
        {unread > 0 && <span className="notification-count">{unread > 9 ? "9+" : unread}</span>}
      </button>
      {open && (
        <section className="notification-panel" aria-label="Notifications">
          <div className="notification-heading"><strong>Notifications</strong><button type="button" onClick={() => setOpen(false)} aria-label="Close notifications"><X size={16} /></button></div>
          {items.length ? <div className="notification-list">{items.map((item) => <article className="notification-item" key={item.id}><div><button className="notification-open" type="button" onClick={() => openNotification(item)} disabled={!notificationDestination(item, user)}><strong>{item.title}</strong><p>{item.body}</p><time>{new Date(item.created_at).toLocaleString()}</time></button><button className="notification-delete" type="button" onClick={() => void deleteNotification(item.id)} aria-label={`Delete ${item.title}`}><Trash2 size={14} /></button></div></article>)}</div> : <p className="notification-empty">New post decisions will appear here.</p>}
        </section>
      )}
    </div>
  );
}

function readNotifications(payload: unknown): Notification[] {
  if (Array.isArray(payload)) return payload as Notification[];
  if (!payload || typeof payload !== "object") return [];

  const record = payload as { results?: unknown; data?: unknown };
  if (Array.isArray(record.results)) return record.results as Notification[];
  if (Array.isArray(record.data)) return record.data as Notification[];
  return [];
}

function toNotification(notification: Notification): Notification {
  if (notification.post || !notification.post_id || !notification.slug) return notification;
  return {
    ...notification,
    post: { id: notification.post_id, slug: notification.slug },
  };
}

function notificationDestination(
  item: Notification,
  user: StoredUser | null,
): string | null {
  if (user?.role === "moderator" || user?.role === "super_admin") {
    return "/moderation";
  }

  const post = item.post || (
    item.post_id && item.slug
      ? { id: item.post_id, slug: item.slug }
      : null
  );
  if (!post) return null;

  if (item.notification_type === "post_rejected") {
    return `/profile/posts/${post.id}`;
  }
  return `/articles/${post.id}/${post.slug}`;
}
