"use client";

import { useEffect, useRef } from "react";

type PollImpressionTrackerProps = {
  pollId: string;
};

export function PollImpressionTracker({ pollId }: PollImpressionTrackerProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const key = `pulsepoint:impression:${pollId}`;
    if (window.sessionStorage.getItem(key)) {
      return;
    }

    let sent = false;
    const observer = new IntersectionObserver(
      (entries) => {
        if (sent) return;
        const entry = entries[0];
        if (!entry?.isIntersecting || entry.intersectionRatio < 0.5) return;

        sent = true;
        window.sessionStorage.setItem(key, "1");
        void fetch("/api/analytics/events", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            pollId,
            eventType: "poll_impression",
            source: "feed_card"
          }),
          keepalive: true
        });
        observer.disconnect();
      },
      { threshold: [0.5] }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [pollId]);

  return <div ref={ref} className="poll-impression-anchor" aria-hidden="true" />;
}
