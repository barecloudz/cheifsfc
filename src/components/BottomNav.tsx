"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const tabs = [
  {
    href: "/",
    label: "Home",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "var(--maroon)" : "none"} stroke={active ? "var(--maroon)" : "var(--gray)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    href: "/schedule",
    label: "Schedule",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "var(--maroon)" : "var(--gray)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    href: "/table",
    label: "Table",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "var(--maroon)" : "var(--gray)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 9H4.5a2.5 2.5 0 010-5C7 4 7 7 7 7" />
        <path d="M18 9h1.5a2.5 2.5 0 000-5C17 4 17 7 17 7" />
        <path d="M4 22h16" />
        <path d="M10 22V10" />
        <path d="M14 22V10" />
        <path d="M6 9h12v4a8 8 0 01-12 0V9z" />
      </svg>
    ),
  },
  {
    href: "/team",
    label: "Team",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "var(--maroon)" : "var(--gray)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87" />
        <path d="M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
  },
  {
    href: "/player",
    label: "My Card",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "var(--maroon)" : "none"} stroke={active ? "var(--maroon)" : "var(--gray)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

export default function BottomNav() {
  const pathname = usePathname();
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.showPlayerStats !== undefined) setShowStats(data.showPlayerStats);
      })
      .catch(() => {});
  }, []);

  if (pathname.startsWith("/admin") || pathname === "/player/login") return null;

  function handleNavClick() {
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-card-border md:hidden shadow-[0_-2px_12px_rgba(0,0,0,0.06)]">
      <div className="flex items-center justify-around h-16 px-4 max-w-lg mx-auto">
        {[...tabs, ...(showStats ? [{
          href: "/stats",
          label: "Stats",
          icon: (active: boolean) => (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "var(--maroon)" : "var(--gray)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 20V10" /><path d="M12 20V4" /><path d="M6 20v-6" />
            </svg>
          ),
        }] : [])].map((tab) => {
          const isActive = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              onClick={handleNavClick}
              className="flex flex-col items-center gap-0.5 min-w-[64px] py-2 active:opacity-70 transition-opacity"
            >
              {tab.icon(isActive)}
              <span
                className={`text-[10px] font-semibold transition-colors ${
                  isActive ? "text-maroon" : "text-gray"
                }`}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
