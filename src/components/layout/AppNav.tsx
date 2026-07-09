"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { type User } from "@supabase/supabase-js";
import { CircleUserRound, Menu, X } from "lucide-react";

export function AppNav() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + "/");

  return (
    <>
      <nav className="sticky top-0 z-50 bg-background/85 backdrop-blur-xl border-b border-border">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight">
            <Image src="/assets/logo.png" alt="Lukluk" width={28} height={28} className="transition-transform duration-300 hover:rotate-[-5deg] hover:scale-110" />
            Lukluk
          </Link>

          {/* Loading skeleton */}
          {loading && (
            <div className="hidden sm:flex items-center gap-6">
              <div className="h-5 w-20 animate-pulse rounded-md bg-muted" />
              <div className="h-9 w-36 animate-pulse rounded-full bg-muted" />
            </div>
          )}

          {/* Logged-in nav (desktop) */}
          {!loading && user && (
            <div className="hidden sm:flex items-center gap-6">
              <Link
                href="/dashboard"
                className={`text-sm font-medium transition-colors ${isActive("/dashboard") ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                Dashboard
              </Link>
              <Link
                href="/community"
                className={`text-sm font-medium transition-colors ${isActive("/community") ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                Community
              </Link>
              <Link
                href="/profile"
                className={`inline-flex items-center gap-1.5 text-sm font-medium transition-colors ${isActive("/profile") ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                <CircleUserRound className="h-3.5 w-3.5" />
                Profile
              </Link>
            </div>
          )}

          {/* Logged-out nav (desktop) */}
          {!loading && !user && pathname === "/" && (
            <div className="hidden sm:flex items-center gap-8">
              <Link
                href="#how-it-works"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                How It Works
              </Link>
              <Link
                href="#features"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Features
              </Link>
              <Link
                href="/experiences"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Experiences
              </Link>
              <Link
                href="/community"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Community
              </Link>
              <Link
                href="/auth/google"
                className="inline-flex items-center gap-2.5 rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background shadow-[0_2px_8px_rgba(26,26,46,0.2)] transition-all hover:bg-[#2d2d4a] hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(26,26,46,0.3)]"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Sign in with Google
              </Link>
            </div>
          )}

          {!loading && !user && pathname !== "/" && (
            <div className="hidden sm:flex items-center gap-8">
              <Link
                href="/community"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Community
              </Link>
              <Link
                href="/auth/google"
                className="inline-flex items-center gap-2.5 rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background shadow-[0_2px_8px_rgba(26,26,46,0.2)] transition-all hover:bg-[#2d2d4a] hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(26,26,46,0.3)]"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Sign in with Google
              </Link>
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(true)}
            className="sm:hidden flex h-10 w-10 items-center justify-center rounded-full text-foreground hover:bg-muted transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {menuOpen && (
        <>
          <div className="sm:hidden fixed inset-0 z-50 bg-black/40" onClick={() => setMenuOpen(false)} />
          <div className="sm:hidden fixed inset-y-0 right-0 z-50 w-[280px] bg-white shadow-xl flex flex-col animate-slide-in-right">
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
                <Image src="/assets/logo.png" alt="Lukluk" width={24} height={24} />
                Lukluk
              </Link>
              <button
                onClick={() => setMenuOpen(false)}
                className="h-8 w-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Drawer Links */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {loading ? (
                <div className="space-y-3">
                  <div className="h-10 animate-pulse rounded-lg bg-gray-100" />
                  <div className="h-10 animate-pulse rounded-lg bg-gray-100" />
                </div>
              ) : user ? (
                <>
                  <div className="mb-4 flex items-center gap-3 rounded-xl bg-gray-50 px-4 py-3">
                    <div className="h-9 w-9 rounded-full bg-orange-100 flex items-center justify-center">
                      <CircleUserRound className="h-5 w-5 text-orange-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  <nav className="space-y-1">
                    <Link
                      href="/dashboard"
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                        isActive("/dashboard") ? "bg-orange-50 text-orange-600" : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/community"
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                        isActive("/community") ? "bg-orange-50 text-orange-600" : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      Community
                    </Link>
                    <Link
                      href="/profile"
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                        isActive("/profile") ? "bg-orange-50 text-orange-600" : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <CircleUserRound className="h-4 w-4" />
                      Profile
                    </Link>
                  </nav>

                  <div className="my-4 h-px bg-gray-200" />

                  <button
                    onClick={handleSignOut}
                    className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <nav className="space-y-1">
                  <Link
                    href="/auth/google"
                    className="flex items-center justify-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background shadow-sm transition-all hover:bg-[#2d2d4a]"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Sign in with Google
                  </Link>
                </nav>
              )}
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in-right {
          animation: slideInRight 0.25s ease-out;
        }
      `}</style>
    </>
  );
}
