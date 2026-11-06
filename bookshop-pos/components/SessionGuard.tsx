"use client";

import { useEffect, useRef } from "react";
import { signOut, useSession } from "next-auth/react";
import { usePathname } from "next/navigation";

// 120 minutes of total inactivity locks the terminal
const INACTIVITY_TIMEOUT_MS = 120 * 60 * 1000;
const SESSION_STORAGE_KEY = "sharthri_pos_active_session";

export default function SessionGuard() {
  const pathname = usePathname();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Only run on protected application pages (skip /login)
    if (pathname.startsWith("/login")) {
      return;
    }

    // 1. Check if the program was closed and reopened
    const activeSessionFlag = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!activeSessionFlag) {
      // If there's an existing cookie session but sessionStorage is empty,
      // it means the user closed the browser / program and launched it again!
      fetch("/api/auth/session")
        .then((res) => res.json())
        .then((data) => {
          if (data?.user?.id) {
            // First time after program reopen: force re-authentication for POS security
            sessionStorage.removeItem(SESSION_STORAGE_KEY);
            signOut({ callbackUrl: "/login?reason=reopened" });
          } else {
            // No session anyway
            sessionStorage.setItem(SESSION_STORAGE_KEY, "guest");
          }
        })
        .catch(() => {});
      return;
    }

    // 2. Inactivity auto-lock timer
    function resetInactivityTimer() {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        console.warn("POS terminal locked due to inactivity.");
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
        signOut({ callbackUrl: "/login?reason=timeout" });
      }, INACTIVITY_TIMEOUT_MS);
    }

    // Register user activity listeners
    const activityEvents = ["mousedown", "keydown", "touchstart", "scroll"];
    activityEvents.forEach((event) => {
      window.addEventListener(event, resetInactivityTimer, { passive: true });
    });

    // Start timer initially
    resetInactivityTimer();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      activityEvents.forEach((event) => {
        window.removeEventListener(event, resetInactivityTimer);
      });
    };
  }, [pathname]);

  return null;
}
