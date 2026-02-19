"use client";

import { useEffect } from "react";

type PollViewTrackerProps = {
  pollId: string;
};

const VIEW_DEDUP_WINDOW_MS = 30 * 60 * 1000;

export function PollViewTracker({ pollId }: PollViewTrackerProps) {
  useEffect(() => {
    const key = `pulsepoint:view:${pollId}`;
    const now = Date.now();
    const previousRaw = window.sessionStorage.getItem(key);
    const previous = previousRaw ? Number(previousRaw) : 0;

    if (Number.isFinite(previous) && now - previous < VIEW_DEDUP_WINDOW_MS) {
      return;
    }

    window.sessionStorage.setItem(key, String(now));
    void fetch("/api/analytics/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        pollId,
        eventType: "poll_view",
        source: "poll_detail"
      }),
      keepalive: true
    });
  }, [pollId]);

  return null;
}
