"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAdmin = user.role === "admin";

  const navLinks = [
    ...(isAdmin
      ? [
          {
            href: "/admin/products",
            label: "Inventory & Products",
            icon: (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
              </svg>
            ),
          },
          {
            href: "/admin/analytics",
            label: "Analytics",
            icon: (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
            ),
          },
        ]
      : []),
    {
      href: "/sell",
      label: "POS Checkout",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
        </svg>
      ),
    },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-white/10 bg-white/85 dark:bg-[#060a12]/85 backdrop-blur-2xl shadow-sm dark:shadow-lg dark:shadow-black/20 transition-colors">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-3 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-4 sm:gap-8">
          <Link
            href={isAdmin ? "/admin/products" : "/sell"}
            className="flex items-center gap-2.5 sm:gap-3 group"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#1ecbe1] to-[#0891b2] text-slate-950 shadow-md shadow-[#1ecbe1]/25 group-hover:shadow-[#1ecbe1]/40 group-hover:scale-105 transition-all">
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
              <span className="text-sm sm:text-base font-extrabold tracking-tight text-slate-900 dark:text-white group-hover:text-[#0891b2] dark:group-hover:text-[#1ecbe1] transition-colors leading-none block">
                Sharthri Bookshop
              </span>
              <span className="block text-[9px] sm:text-[10px] uppercase font-extrabold tracking-wider text-[#0891b2] dark:text-[#1ecbe1] mt-0.5">
                POS System
              </span>
            </div>
          </Link>

          {/* Nav Items (Desktop) */}
          <nav className="hidden md:flex items-center gap-1.5">
            {navLinks.map((link) => {
              const isActive = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all flex items-center gap-1.5 ${
                    isActive
                      ? "bg-[#1ecbe1]/15 text-[#0891b2] dark:text-[#1ecbe1] border border-[#1ecbe1]/40 shadow-sm shadow-[#1ecbe1]/20"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white border border-transparent"
                  }`}
                >
                  {link.icon}
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Section: Theme Toggle, Profile & Mobile Hamburger */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Theme Toggle Button */}
          <ThemeToggle />

          {/* Profile Badge (Desktop) */}
          <div className="hidden sm:flex items-center gap-2.5 pl-1 sm:pl-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-bold text-[#0891b2] dark:text-[#1ecbe1] shadow-inner">
              {user.name ? user.name[0].toUpperCase() : "U"}
            </div>
            <div className="flex flex-col text-left">
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

          {/* Sign Out Button (Desktop) */}
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="hidden sm:flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100/80 dark:bg-white/5 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 transition-all hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-300 active:scale-95 cursor-pointer"
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
            <span>Sign Out</span>
          </button>

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
            className="flex md:hidden items-center justify-center h-9 w-9 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-200 hover:text-[#0891b2] dark:hover:text-[#1ecbe1] active:scale-95 transition-all cursor-pointer ml-1"
          >
            {mobileMenuOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.2" stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.2" stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Dropdown Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200/80 dark:border-white/10 bg-white/95 dark:bg-[#060a12]/95 backdrop-blur-2xl px-4 py-4 space-y-3 shadow-2xl animate-fade-in">
          {/* User profile row in mobile menu */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/15 text-xs font-bold text-[#0891b2] dark:text-[#1ecbe1]">
                {user.name ? user.name[0].toUpperCase() : "U"}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-900 dark:text-white">{user.name || "User"}</span>
                <span className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400">
                  Role: <strong className="text-[#0891b2] dark:text-[#1ecbe1]">{user.role}</strong>
                </span>
              </div>
            </div>

            {/* Mobile Sign out */}
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-xs font-bold text-rose-600 dark:text-rose-300 hover:bg-rose-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-3.5 h-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
              </svg>
              Sign Out
            </button>
          </div>

          {/* Links list */}
          <nav className="flex flex-col gap-1.5 pt-1">
            {navLinks.map((link) => {
              const isActive = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? "bg-[#1ecbe1]/15 text-[#0891b2] dark:text-[#1ecbe1] border border-[#1ecbe1]/40 shadow-sm shadow-[#1ecbe1]/10"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white border border-transparent"
                  }`}
                >
                  <span className={isActive ? "text-[#0891b2] dark:text-[#1ecbe1]" : "text-slate-500 dark:text-slate-400"}>
                    {link.icon}
                  </span>
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
