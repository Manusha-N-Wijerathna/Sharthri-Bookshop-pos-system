"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // 1. Check local storage or document class
    const saved = localStorage.getItem("theme") as "light" | "dark" | null;
    const isDark = saved ? saved === "dark" : document.documentElement.classList.contains("dark");
    const active = isDark ? "dark" : "light";
    setTheme(active);
    if (active === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    setMounted(true);
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);

    if (next === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }

  // Prevent hydration mismatch: render placeholder until mounted
  if (!mounted) {
    return (
      <div className="h-9 w-9 rounded-xl border border-white/10 bg-white/5" />
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="flex items-center gap-1.5 rounded-xl border border-slate-300/80 dark:border-white/10 bg-white/80 dark:bg-white/5 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-[#1ecbe1] hover:text-[#0891b2] dark:hover:border-[#1ecbe1]/60 dark:hover:text-[#1ecbe1] active:scale-95 transition-all shadow-sm backdrop-blur-md cursor-pointer group"
      title={theme === "dark" ? "Switch to Light Theme" : "Switch to Dark Theme"}
      aria-label="Toggle Theme"
    >
      {theme === "dark" ? (
        <>
          {/* Sun Icon for Dark Mode (click to switch to Light) */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4 text-[#1ecbe1] group-hover:rotate-45 transition-transform duration-300"
          >
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2" />
            <path d="M12 20v2" />
            <path d="m4.93 4.93 1.41 1.41" />
            <path d="m17.66 17.66 1.41 1.41" />
            <path d="M2 12h2" />
            <path d="M20 12h2" />
            <path d="m6.34 17.66-1.41 1.41" />
            <path d="m19.07 4.93-1.41 1.41" />
          </svg>
          <span className="hidden sm:inline font-semibold">Light</span>
        </>
      ) : (
        <>
          {/* Moon Icon for Light Mode (click to switch to Dark) */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4 text-[#0891b2] group-hover:-rotate-12 transition-transform duration-300"
          >
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
          </svg>
          <span className="hidden sm:inline font-semibold">Dark</span>
        </>
      )}
    </button>
  );
}

