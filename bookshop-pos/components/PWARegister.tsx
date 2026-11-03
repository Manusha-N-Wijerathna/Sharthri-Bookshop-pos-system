"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export default function PWARegister() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSTip, setShowIOSTip] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            console.log("PWA Service Worker registered with scope:", registration.scope);
          })
          .catch((error) => {
            console.warn("Service Worker registration failed:", error);
          });
      });
    }

    // 2. Check if already running in standalone mode (installed app)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // 3. Detect iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // 4. Capture BeforeInstallPromptEvent for Android / Chrome / Edge / Desktop
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      setIsInstallable(true);

      // Check if user previously dismissed in this session
      const dismissed = sessionStorage.getItem("pwa_install_dismissed");
      if (!dismissed) {
        setShowBanner(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // 5. Custom trigger from Navbar or UI
    const handleCustomTrigger = () => {
      if (deferredPrompt) {
        handleInstallClick();
      } else if (isIosDevice) {
        setShowIOSTip(true);
      } else {
        setShowBanner(true);
      }
    };

    window.addEventListener("pwa-trigger-install", handleCustomTrigger);

    // 6. Track successful installation
    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setShowBanner(false);
      setDeferredPrompt(null);
      console.log("Sharthri POS PWA was successfully installed!");
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("pwa-trigger-install", handleCustomTrigger);
    };
  }, []);

  async function handleInstallClick() {
    if (!deferredPrompt) {
      if (isIOS) {
        setShowIOSTip(true);
      }
      return;
    }

    // Trigger native install prompt
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setIsInstalled(true);
      setShowBanner(false);
    }
    setDeferredPrompt(null);
    setIsInstallable(false);
  }

  function handleDismiss() {
    setShowBanner(false);
    setShowIOSTip(false);
    sessionStorage.setItem("pwa_install_dismissed", "true");
  }

  // If already installed or neither installable nor iOS, render nothing
  if (isInstalled) return null;
  if (!showBanner && !showIOSTip && !isInstallable) return null;

  return (
    <>
      {/* Floating PWA Install Prompt Banner */}
      {showBanner && (
        <div className="fixed bottom-20 sm:bottom-6 right-3 sm:right-6 z-50 max-w-sm w-[calc(100%-1.5rem)] animate-fade-in no-print">
          <div className="p-4 rounded-3xl border border-[#1ecbe1]/40 bg-white/95 dark:bg-[#060a12]/95 backdrop-blur-2xl shadow-2xl shadow-[#1ecbe1]/20 flex items-center justify-between gap-3 text-slate-900 dark:text-white">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative h-11 w-11 shrink-0 rounded-2xl overflow-hidden bg-white p-1 border border-slate-200 dark:border-white/10 shadow-md">
                <Image
                  src="/brand-logo.png"
                  alt="Sharthri POS App"
                  width={44}
                  height={44}
                  className="object-contain"
                />
              </div>
              <div className="min-w-0">
                <div className="font-extrabold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span className="truncate">Sharthri POS App</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-[#1ecbe1]/20 text-[#0891b2] dark:text-[#1ecbe1] font-bold uppercase">
                    PWA
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  Install for fast offline POS checkout
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleInstallClick}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#1ecbe1] to-[#06b6d4] text-slate-950 font-extrabold text-xs shadow-md shadow-[#1ecbe1]/30 hover:brightness-110 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2.2"
                  stroke="currentColor"
                  className="w-3.5 h-3.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                  />
                </svg>
                <span>Install</span>
              </button>
              <button
                type="button"
                onClick={handleDismiss}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white transition-all text-sm cursor-pointer"
                title="Dismiss"
              >
                &times;
              </button>
            </div>
          </div>
        </div>
      )}

      {/* iOS Safari Installation Instruction Modal */}
      {showIOSTip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fade-in no-print">
          <div className="p-6 rounded-3xl max-w-sm w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-2xl text-center space-y-3">
            <div className="h-14 w-14 mx-auto rounded-2xl bg-white p-1 border border-slate-200 shadow-md">
              <Image
                src="/brand-logo.png"
                alt="Sharthri POS"
                width={56}
                height={56}
                className="object-contain"
              />
            </div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              Install Sharthri POS on iOS
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              To install this POS app on your iPhone or iPad:
            </p>
            <div className="text-left text-xs bg-slate-100 dark:bg-slate-800/60 p-3.5 rounded-2xl space-y-2 border border-slate-200 dark:border-white/10">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#0891b2] dark:text-[#1ecbe1]">1.</span>
                <span>Tap the <strong>Share</strong> button in Safari toolbar.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#0891b2] dark:text-[#1ecbe1]">2.</span>
                <span>Scroll down and tap <strong>Add to Home Screen</strong>.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#0891b2] dark:text-[#1ecbe1]">3.</span>
                <span>Tap <strong>Add</strong> in the top right corner.</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowIOSTip(false)}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#1ecbe1] to-[#06b6d4] text-slate-950 font-extrabold text-xs shadow-md cursor-pointer active:scale-95 transition-all"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
