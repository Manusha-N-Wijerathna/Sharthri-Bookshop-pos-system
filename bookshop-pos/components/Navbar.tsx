"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import ThemeToggle from "./ThemeToggle";

interface NavbarProps {
  user: {
    name?: string | null;
    email?: string | null;
    role: "admin" | "cashier";
  };
}

export default function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();

  const isAdmin = user.role === "admin";

  const navLinks = [
    ...(isAdmin
      ? [
          { href: "/admin/products", label: "Inventory & Products" },
          { href: "/admin/analytics", label: "Analytics" },
        ]
      : []),
    { href: "/sell", label: "POS Checkout" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-[#060a12]/80 backdrop-blur-2xl shadow-sm dark:shadow-lg dark:shadow-black/20 transition-colors">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-6 sm:gap-8">
          <Link href={isAdmin ? "/admin/products" : "/sell"} className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#1ecbe1] to-[#0891b2] text-slate-950 shadow-md shadow-[#1ecbe1]/25 group-hover:shadow-[#1ecbe1]/40 group-hover:scale-105 transition-all">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
              >
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                <path d="M8 7h6" />
                <path d="M8 11h4" />
              </svg>
            </div>
            <div>
              <span className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white group-hover:text-[#0891b2] dark:group-hover:text-[#1ecbe1] transition-colors">
                Sharthri Bookshop
              </span>
              <span className="block text-[10px] uppercase font-extrabold tracking-wider text-[#0891b2] dark:text-[#1ecbe1]">
                POS System
              </span>
            </div>
          </Link>

          {/* Nav Items */}
          <nav className="hidden md:flex items-center gap-1.5">
            {navLinks.map((link) => {
              const isActive = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                    isActive
                      ? "bg-[#1ecbe1]/15 text-[#0891b2] dark:text-[#1ecbe1] border border-[#1ecbe1]/40 shadow-sm shadow-[#1ecbe1]/20"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white border border-transparent"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User profile & actions */}
        <div className="flex items-center gap-2.5 sm:gap-4">
          {/* Theme Toggle Button */}
          <ThemeToggle />

          {/* Profile Badge */}
          <div className="flex items-center gap-2 sm:gap-3 pl-1 sm:pl-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-bold text-[#0891b2] dark:text-[#1ecbe1] shadow-inner">
              {user.name ? user.name[0].toUpperCase() : "U"}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-bold text-slate-900 dark:text-white">{user.name || "User"}</span>
              <div className="flex items-center gap-1.5">
                <span
                  className={`inline-block h-1.5 w-1.5 rounded-full ${
                    isAdmin
                      ? "bg-[#0891b2] dark:bg-[#1ecbe1] shadow-[0_0_8px_#1ecbe1]"
                      : "bg-emerald-500 shadow-[0_0_8px_#10b981]"
                  }`}
                />
                <span className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
                  {user.role}
                </span>
              </div>
            </div>
          </div>

          {/* Sign Out Button */}
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100/80 dark:bg-white/5 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 transition-all hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-300 active:scale-95 cursor-pointer"
            title="Sign out"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              className="h-3.5 w-3.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
              />
            </svg>
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
}
