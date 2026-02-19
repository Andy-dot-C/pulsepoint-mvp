"use client";

import { useEffect, useState } from "react";

type FlashBannerProps = {
  message: string;
  tone?: "success";
  autoHideMs?: number;
};

export function FlashBanner({ message, tone = "success", autoHideMs = 2200 }: FlashBannerProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(false), autoHideMs);
    return () => window.clearTimeout(timer);
  }, [autoHideMs]);

  if (!visible) return null;

  return (
    <article className={`flash-banner ${tone === "success" ? "flash-banner-success" : ""}`} style={{ marginTop: 12 }}>
      <p>{message}</p>
    </article>
  );
}
