"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Bookmark, ChevronLeft, Compass, Home, LogIn, LogOut, Menu, PenLine, Search, ShieldCheck, Sparkles, Users, X } from "lucide-react";
import { UserAvatar } from "./user-avatar";
import { NotificationBell } from "./notification-bell";
import { AUTH_CHANGE_EVENT, clearAuthSession, getStoredUser, hasAuthSession, type StoredUser } from "@/lib/auth";

const items: { href: string; label: string; icon: typeof Home; roles?: string[] }[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/saved", label: "Saved", icon: Bookmark },
  { href: "/write", label: "Write", icon: PenLine },
  { href: "/moderation", label: "Moderate", icon: ShieldCheck, roles: ["moderator", "super_admin"] },
  { href: "/users", label: "Users", icon: Users, roles: ["moderator", "super_admin"] },
];

const protectedRoutePrefixes = [
  "/saved",
  "/write",
  "/profile",
  "/moderation",
  "/users",
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [user, setUser] = useState<StoredUser | null>(null);

  useEffect(() => {
    const syncAuth = () => setUser(hasAuthSession() ? getStoredUser() : null);
    const initialSync = window.setTimeout(() => {
      setCollapsed(localStorage.getItem("tfacts-sidebar") === "collapsed");
      syncAuth();
    }, 0);
    window.addEventListener(AUTH_CHANGE_EVENT, syncAuth);
    window.addEventListener("storage", syncAuth);
    return () => {
      window.clearTimeout(initialSync);
      window.removeEventListener(AUTH_CHANGE_EVENT, syncAuth);
      window.removeEventListener("storage", syncAuth);
    };
  }, []);
  useEffect(() => {
    const closeMenu = window.setTimeout(() => setMobileOpen(false), 0);
    return () => window.clearTimeout(closeMenu);
  }, [pathname]);
  useEffect(() => {
    const requiresLogin = protectedRoutePrefixes.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    );
    if (!requiresLogin || hasAuthSession()) return;

    const next = `${pathname}${window.location.search}`;
    router.replace(`/login?next=${encodeURIComponent(next)}`);
  }, [pathname, router]);
  function toggle() {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("tfacts-sidebar", next ? "collapsed" : "expanded");
  }
  function search(event: FormEvent) {
    event.preventDefault();
    if (query.trim().length > 1) router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  }
  function logout() {
    clearAuthSession();
    setMobileOpen(false);
    router.push("/");
  }

  return (
    <div className={`app-shell ${collapsed ? "is-collapsed" : ""}`}>
      <aside className={`sidebar ${mobileOpen ? "is-open" : ""}`} aria-label="Primary navigation">
        <div className="brand-row">
          <Link className="brand" href="/" aria-label="tfacts home"><span className="brand-mark">t</span><span className="nav-label">tfacts</span></Link>
          <button className="mobile-close" onClick={() => setMobileOpen(false)} aria-label="Close menu"><X size={21} /></button>
        </div>
        <nav className="nav-list">
          {items.filter((item) => !item.roles || item.roles.includes(user?.role || "")).map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return <Link key={href} href={href} className={`nav-item ${active ? "active" : ""}`} aria-current={active ? "page" : undefined} title={collapsed ? label : undefined}><Icon size={20} /><span className="nav-label">{label}</span></Link>;
          })}
        </nav>
        <div className="sidebar-card">
          <Sparkles size={20} /><div className="nav-label"><strong>Stay curious.</strong><span>A good fact can change how you see everything.</span></div>
        </div>
        <div className="sidebar-bottom">
          {user ? (
            <button className="nav-item" onClick={logout} title={collapsed ? "Sign out" : undefined}><LogOut size={20} /><span className="nav-label">Sign out</span></button>
          ) : (
            <Link className="nav-item" href="/login" title={collapsed ? "Sign in" : undefined}><LogIn size={20} /><span className="nav-label">Sign in</span></Link>
          )}
          <button className="collapse-button" onClick={toggle} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} aria-expanded={!collapsed}><ChevronLeft size={18} /><span className="nav-label">Minimize</span></button>
        </div>
      </aside>
      {mobileOpen && <button className="sidebar-backdrop" onClick={() => setMobileOpen(false)} aria-label="Close menu" />}
      <div className="main-column">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Open menu"><Menu size={22} /></button>
          <form className="search-box" role="search" onSubmit={search}><Search size={18} /><label className="sr-only" htmlFor="site-search">Search tfacts</label><input id="site-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search facts, topics, ideas…" /></form>
           <Link href="/write" className="topbar-write"><PenLine size={17} /><span>Write a fact</span></Link>
           <NotificationBell user={user} />
           {user && <Link href="/profile" className="avatar-button" aria-label="Your profile"><UserAvatar userId={user.id} size={37} /></Link>}
        </header>
        <main id="main-content" className="page-container">{children}</main>
        <footer className="footer"><Link className="brand footer-brand" href="/"><span className="brand-mark">t</span><span>tfacts</span></Link><p>Technology, made clear.</p><div><Link href="/explore">Explore</Link><Link href="/write">Contribute</Link><a href="mailto:hello@tfacts.dev">Contact</a></div><small>© {new Date().getFullYear()} tfacts</small></footer>
      </div>
    </div>
  );
}
