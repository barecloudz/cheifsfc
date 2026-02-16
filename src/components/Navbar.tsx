"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home" },
  { href: "/schedule", label: "Schedule" },
  { href: "/table", label: "Table" },
  { href: "/team", label: "Team" },
];

export default function Navbar() {
  const pathname = usePathname();

  // Hide on admin/login/player pages — those have their own headers
  if (pathname.startsWith("/admin")) return null;
  if (pathname.startsWith("/player")) return null;
  // Hide on subpages that use PageHeader
  if (pathname.startsWith("/matches/")) return null;

  return (
    <nav className="app-header">
      <div className="w-full max-w-5xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 active:opacity-70 transition-opacity">
          <Image
            src="/logo.png"
            alt="Chiefs FC"
            width={34}
            height={34}
          />
          <span className="text-base font-bold text-gold-gradient">Chiefs FC</span>
        </Link>

        <div className="flex items-center gap-5">
          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-7">
            {links.map((link) => {
              const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium transition-colors relative py-1 ${
                    active ? "text-maroon" : "text-muted hover:text-foreground"
                  }`}
                >
                  {link.label}
                  {active && (
                    <span className="absolute -bottom-[17px] left-0 right-0 h-[2px] bg-maroon rounded-full" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Login button */}
          <Link
            href="/player/login"
            className="btn-touch flex items-center gap-1.5 bg-maroon text-white text-xs font-semibold px-4 py-2 rounded-full active:scale-95"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            Login
          </Link>
        </div>
      </div>
    </nav>
  );
}
