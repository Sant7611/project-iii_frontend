import Link from "next/link";
export default function NotFound() { return <div className="empty-state"><h1>That fact wandered off.</h1><p>The article may have moved or is no longer published.</p><Link className="button button-primary" href="/explore">Explore other facts</Link></div>; }
