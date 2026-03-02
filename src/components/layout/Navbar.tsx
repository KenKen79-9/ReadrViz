"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { BookOpen, BarChart2, Users, Compass, User, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { GlobalSearch } from "@/components/layout/GlobalSearch";

const NAV = [
  { href: "/books", label: "Discover", icon: Compass },
  { href: "/shelves", label: "My Shelves", icon: BookOpen },
  { href: "/dashboard", label: "Analytics", icon: BarChart2 },
  { href: "/clubs", label: "Clubs", icon: Users },
];

export function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-14 gap-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-serif font-bold text-lg text-ink shrink-0">
            <span className="w-7 h-7 rounded-md bg-accent flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </span>
            ReadrViz
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1 flex-1">
            {NAV.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                  pathname.startsWith(href)
                    ? "bg-accent-light text-accent"
                    : "text-ink-secondary hover:text-ink hover:bg-border-subtle"
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </nav>

          {/* Search */}
          <div className="flex-1 max-w-xs hidden sm:block">
            <GlobalSearch />
          </div>

          {/* User menu */}
          <div className="flex items-center gap-2 ml-auto">
            {session ? (
              <div className="flex items-center gap-2">
                <Link
                  href={`/profile/${session.user.username}`}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-border-subtle transition-colors"
                >
                  {session.user.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={session.user.image} alt="" className="w-6 h-6 rounded-full object-cover" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-accent-light flex items-center justify-center">
                      <User className="w-3 h-3 text-accent" />
                    </div>
                  )}
                  <span className="text-sm font-medium text-ink hidden sm:block">
                    {session.user.name ?? session.user.username}
                  </span>
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="p-1.5 rounded-md text-ink-tertiary hover:text-ink hover:bg-border-subtle transition-colors"
                  aria-label="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="text-sm font-medium text-ink-secondary hover:text-ink transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="text-sm font-medium bg-accent text-white px-3 py-1.5 rounded-md hover:bg-accent-hover transition-colors"
                >
                  Get started
                </Link>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-1.5 rounded-md text-ink-secondary hover:bg-border-subtle"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {menuOpen && (
          <div className="md:hidden border-t border-border py-3 space-y-1 animate-slide-up">
            <div className="px-1 pb-2">
              <GlobalSearch />
            </div>
            {NAV.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  pathname.startsWith(href)
                    ? "bg-accent-light text-accent"
                    : "text-ink-secondary hover:text-ink hover:bg-border-subtle"
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
