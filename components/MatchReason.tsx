"use client";

import { useEffect, useState } from "react";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

type Props = {
  fallback: string;
  locale: Locale;
};

export function MatchReason({ fallback, locale }: Props) {
  const [text, setText] = useState(fallback);
  const [ai, setAi] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    fetch("/api/ai/reason", {
      method: "POST",
      signal: ctrl.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fallback: fallback.slice(0, 300), locale }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        const line = (json as { source?: string; data?: { text?: string } } | null)?.data?.text?.trim();
        if (!cancelled && json?.source === "ai" && line) {
          setText(line);
          setAi(true);
        }
      })
      .catch(() => {
        // ponytail: silent fallback keeps the rule-based line; upgrade path is a retry affordance.
      });
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [fallback, locale]);

  return (
    <p className="small">
      {ai && (
        <>
          <span className="tag tag--accent">{t(locale, "ai.badge")}</span>{" "}
        </>
      )}
      {text}
    </p>
  );
}
