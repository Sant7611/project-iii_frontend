"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Bookmark, Compass, Home, LogIn, LogOut, Menu, PenLine, Search, ShieldCheck, Sparkles, Users, X } from "lucide-react";
import { UserAvatar } from "./user-avatar";
import { NotificationBell } from "./notification-bell";
import { AUTH_CHANGE_EVENT, clearAuthSession, getStoredUser, hasAuthSession, type StoredUser } from "@/lib/auth";

const items = [
  { href: "/", label: "Home", icon: Home },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/saved", label: "Saved", icon: Bookmark },
  { href: "/write", label: "Write", icon: PenLine },
  { href: "/moderation", label: "Moderation", icon: ShieldCheck, roles: ["moderator", "super_admin"] },
  { href: "/users", label: "People", icon: Users, roles: ["moderator", "super_admin"] },
];

const protectedRoutes = ["/saved", "/write", "/profile", "/moderation", "/users"];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [user, setUser] = useState<StoredUser | null>(null);

  useEffect(() => {
    const sync = () => setUser(hasAuthSession() ? getStoredUser() : null);
    sync();
    window.addEventListener(AUTH_CHANGE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(AUTH_CHANGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setOpen(false), 0);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    if (!protectedRoutes.some((route) => pathname === route || pathname.startsWith(route + "/"))) return;
    if (!hasAuthSession()) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [pathname, router]);

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    const value = query.trim();
    if (value.length >= 3) router.push(`/search?q=${encodeURIComponent(value)}`);
  }

  function logout() {
    clearAuthSession();
    router.push("/");
  }

  return (
    <div className="quillora-shell">
      <header className="quillora-topbar">
        <button className="mobile-menu" onClick={() => setOpen(true)} aria-label="Open navigation"><Menu size={21} /></button>
        <Link href="/" className="quillora-brand" aria-label="TFacts home">
          <span className="quillora-mark">T</span>
          <span><strong>TFacts</strong><small>Ideas worth reading</small></span>
        </Link>

        <form className="quillora-search" onSubmit={submitSearch}>
          <Search size={17} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search stories, ideas, topics…" />
        </form>

        <div className="topbar-actions">
          {user && <NotificationBell user={user} />}
          {user ? (
            <>
              <Link href="/write" className="primary-pill"><PenLine size={16} /> Write</Link>
              <Link href="/profile" className="avatar-button" aria-label="Profile"><UserAvatar userId={user.id} username={user.username} size={38} /></Link>
            </>
          ) : (
            <Link href="/login" className="primary-pill"><LogIn size={16} /> Sign in</Link>
          )}
        </div>
      </header>

      <aside className={`quillora-sidebar ${open ? "is-open" : ""}`}>
        <div className="sidebar-mobile-head">
          <Link href="/" className="quillora-brand"><span className="quillora-mark">T</span><strong>TFacts</strong></Link>
          <button onClick={() => setOpen(false)} aria-label="Close navigation"><X size={20} /></button>
        </div>

        <nav>
          {items.filter(item => !item.roles || item.roles.includes(user?.role || "")).map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return <Link key={href} href={href} className={active ? "active" : ""}><Icon size={18} /><span>{label}</span></Link>;
          })}
        </nav>

        <div className="sidebar-insight">
          <Sparkles size={18} />
          <strong>Read beyond the headline.</strong>
          <p>Search by relevance, save what matters, and get recommendations shaped by what you like.</p>
        </div>

        {user && <button className="sidebar-logout" onClick={logout}><LogOut size={17} /> Sign out</button>}
      </aside>

      {open && <button className="sidebar-overlay" onClick={() => setOpen(false)} aria-label="Close navigation" />}

      <main id="main-content" className="quillora-main">{children}</main>

      <footer className="quillora-footer">
        <div><span className="quillora-mark">T</span><div><strong>TFacts</strong><p>Thoughtful stories, clearer discovery.</p></div></div>
        <div><Link href="/explore">Explore</Link><Link href="/write">Write</Link><Link href="/saved">Saved</Link></div>
        <small>© {new Date().getFullYear()} TFacts</small>
      </footer>
    </div>
  );
}
