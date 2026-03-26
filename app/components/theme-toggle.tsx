"use client";

import { useEffect, useSyncExternalStore } from "react";

import { copy, type Lang } from "@/app/i18n";

type Theme = "light" | "dark";

const STORAGE_KEY = "theme-preference";
const THEME_CHANGE_EVENT = "theme-change";

function resolveTheme(): Theme {
  if (typeof window === "undefined") {
    return "light";
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);

  if (stored === "light" || stored === "dark") {
    return stored;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

function getServerThemeSnapshot(): Theme {
  return "light";
}

function subscribeToThemeChanges(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const handleChange = () => onStoreChange();
  const handleStorage = (event: StorageEvent) => {
    if (!event.key || event.key === STORAGE_KEY) {
      onStoreChange();
    }
  };

  mediaQuery.addEventListener("change", handleChange);
  window.addEventListener("storage", handleStorage);
  window.addEventListener(THEME_CHANGE_EVENT, handleChange);

  return () => {
    mediaQuery.removeEventListener("change", handleChange);
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(THEME_CHANGE_EVENT, handleChange);
  };
}

export function ThemeToggle({ lang }: { lang: Lang }) {
  const t = copy[lang];
  const theme = useSyncExternalStore(
    subscribeToThemeChanges,
    resolveTheme,
    getServerThemeSnapshot
  );

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  function toggleTheme() {
    const nextTheme = theme === "light" ? "dark" : "light";
    window.localStorage.setItem(STORAGE_KEY, nextTheme);
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  }

  return (
    <button
      aria-label={`${t.themeLabel}: ${theme === "light" ? t.themeLight : t.themeDark}`}
      className="theme-toggle"
      onClick={toggleTheme}
      type="button"
    >
      <span className="theme-toggle-label">{t.themeLabel}</span>
      <strong>{theme === "light" ? t.themeLight : t.themeDark}</strong>
    </button>
  );
}
