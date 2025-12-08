"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/insights", label: "Insights" },
  { href: "/platform", label: "Platform" }
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const checkLogin = () => {
      const loggedIn = localStorage.getItem("shikshanetra_logged_in") === "true";
      setIsLoggedIn(loggedIn);
    };
    checkLogin();
    // Listen for storage changes (when user logs in/out)
    window.addEventListener("storage", checkLogin);
    // Also check periodically for same-tab changes
    const interval = setInterval(checkLogin, 1000);
    return () => {
      window.removeEventListener("storage", checkLogin);
      clearInterval(interval);
    };
  }, []);

  return (
    <header className="sticky top-0 z-40">
      <nav className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:py-3.5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-600 text-sm font-bold text-white shadow-sm">
              SN
            </div>
            <Link href="/" className="text-lg font-semibold tracking-tight text-slate-900">
              <span className="text-primary-600">Shiksha</span>Netra
            </Link>
          </div>
          <div className="hidden items-center gap-8 md:flex absolute left-1/2 -translate-x-1/2">
            <div className="flex items-center gap-6 text-sm font-medium text-slate-700">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="transition hover:text-primary-700"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="hidden items-center gap-3 md:flex">
            <Link href="/demo" className="btn-outline text-sm">
              Live Demo
            </Link>
            {isLoggedIn ? (
              <Link href="/dashboard" className="btn-primary text-sm">
                Dashboard
              </Link>
            ) : (
              <Link href="/signup" className="btn-primary text-sm">
                Signup
              </Link>
            )}
          </div>

          <button
            onClick={() => setOpen((o) => !o)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 md:hidden"
            aria-label="Toggle navigation"
          >
            <span className="sr-only">Open menu</span>
            <div className="space-y-1.5">
              <span className="block h-0.5 w-5 rounded-full bg-slate-700" />
              <span className="block h-0.5 w-5 rounded-full bg-slate-700" />
              <span className="block h-0.5 w-5 rounded-full bg-slate-700" />
            </div>
          </button>
        </div>
        {open && (
          <div className="border-t border-slate-200 bg-white px-4 pb-4 pt-2 md:hidden">
            <div className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="rounded-md px-2 py-2 transition hover:bg-slate-50"
                >
                  {link.label}
                </Link>
              ))}
            </div>
            <div className="mt-3 flex flex-col gap-2">
              <Link
                href="/demo"
                onClick={() => setOpen(false)}
                className="btn-outline w-full text-sm"
              >
                Live Demo
              </Link>
              {isLoggedIn ? (
                <Link
                  href="/dashboard"
                  onClick={() => setOpen(false)}
                  className="btn-primary w-full text-sm"
                >
                  Dashboard
                </Link>
              ) : (
                <Link
                  href="/signup"
                  onClick={() => setOpen(false)}
                  className="btn-primary w-full text-sm"
                >
                  Signup
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}


