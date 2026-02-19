"use client";

import { useEffect, useState } from "react";

type SharePollButtonProps = {
  pollId: string;
  title: string;
  path: string;
  embedPath?: string;
  source?: string;
  compact?: boolean;
};

export function SharePollButton({ pollId, title, path, embedPath, source, compact }: SharePollButtonProps) {
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [menuOpen]);

  function flashCopied() {
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  function trackShare() {
    void fetch("/api/analytics/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        pollId,
        eventType: "poll_share",
        source: source ?? "web",
        metadata: { path }
      }),
      keepalive: true
    });
  }

  async function copyLink() {
    const url = `${window.location.origin}${path}`;
    try {
      await navigator.clipboard.writeText(url);
      flashCopied();
      trackShare();
      setMenuOpen(false);
    } catch {
      // No-op: user can still copy from address bar.
    }
  }

  async function shareViaDevice() {
    const url = `${window.location.origin}${path}`;
    if (typeof navigator.share !== "function") {
      await copyLink();
      return;
    }

    try {
      await navigator.share({ title, url });
      trackShare();
      setMenuOpen(false);
    } catch {
      // User cancelled share sheet.
    }
  }

  async function copyEmbedCode() {
    if (!embedPath) return;
    const src = `${window.location.origin}${embedPath}`;
    const code = `<iframe src="${src}" width="100%" height="420" style="border:0;border-radius:12px;overflow:hidden" loading="lazy"></iframe>`;
    try {
      await navigator.clipboard.writeText(code);
      flashCopied();
      trackShare();
      setMenuOpen(false);
    } catch {
      // No-op
    }
  }

  return (
    <div className={`share-menu ${menuOpen ? "share-menu-open" : ""}`}>
      {menuOpen ? (
        <button
          type="button"
          className="share-menu-backdrop"
          aria-label="Close share menu"
          data-no-card-open="true"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setMenuOpen(false);
          }}
        />
      ) : null}
      <button
        type="button"
        className={`share-btn ${compact ? "share-btn-compact" : ""}`}
        onClick={() => setMenuOpen((current) => !current)}
        aria-label="Share poll"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        title={copied ? "Copied" : "Share poll"}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path
            d="M12 16V4M12 4 8 8M12 4 16 8M5 12v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {compact ? null : copied ? "Copied" : "Share"}
      </button>
      {menuOpen ? (
        <div className="share-menu-pop" role="menu">
          <button type="button" className="share-menu-item" onClick={copyLink}>
            Copy link
          </button>
          <button type="button" className="share-menu-item" onClick={shareViaDevice}>
            Share via device
          </button>
          {embedPath ? (
            <button type="button" className="share-menu-item" onClick={copyEmbedCode}>
              Copy embed code
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
