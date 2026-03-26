"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const HIDDEN_QUERY_KEYS = [
  "lang",
  "date",
  "month",
  "editEntry",
  "editHabit",
  "message",
  "error",
];

export function CleanUrlBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const rawQuery = searchParams.toString();

    if (!rawQuery) {
      return;
    }

    const params = new URLSearchParams(rawQuery);
    let hasChanges = false;

    HIDDEN_QUERY_KEYS.forEach((key) => {
      if (params.has(key)) {
        params.delete(key);
        hasChanges = true;
      }
    });

    if (!hasChanges) {
      return;
    }

    const nextQuery = params.toString();
    const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;
    window.history.replaceState(window.history.state, "", nextUrl);
  }, [pathname, searchParams]);

  return null;
}

