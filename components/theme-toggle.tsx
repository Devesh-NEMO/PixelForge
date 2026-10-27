"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const STORAGE_KEY = "pixelforge-theme";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState<boolean | null>(null);

  useEffect(() => {
    setIsDark(document.documentElement.dataset.theme === "dark");
  }, []);

  const toggle = () => {
    const next =
      document.documentElement.dataset.theme === "dark" ? "light" : "dark";

    document.documentElement.dataset.theme = next;
    document.documentElement.style.colorScheme = next;
    setIsDark(next === "dark");

    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* Private mode — the theme still applies for this session. */
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle dark mode"
      aria-pressed={isDark ?? undefined}
      title="Toggle dark mode"
      className="press grid h-8 w-8 place-items-center border-[1.5px] border-ink bg-paper hover:lime-fill hover:shadow-[2px_2px_0_var(--shadow-color)]"
    >
      <Sun size={14} strokeWidth={2.4} className="hidden dark:block" />
      <Moon size={14} strokeWidth={2.4} className="dark:hidden" />
    </button>
  );
}
