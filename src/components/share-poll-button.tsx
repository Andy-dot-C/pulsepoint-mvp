"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

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
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleOtherMenuOpen(event: Event) {
      const customEvent = event as CustomEvent<{ pollId?: string }>;
      if (customEvent.detail?.pollId !== pollId) {
        setMenuOpen(false);
      }
    }

    window.addEventListener("poll-share-menu-open", handleOtherMenuOpen as EventListener);
    return () => {
      window.removeEventListener("poll-share-menu-open", handleOtherMenuOpen as EventListener);
    };
  }, [pollId]);

  useEffect(() => {
    const parentCard = wrapperRef.current?.closest(".poll-card") ?? null;
    if (!parentCard) return;
    parentCard.classList.toggle("poll-card-share-open", menuOpen);
    return () => {
      parentCard.classList.remove("poll-card-share-open");
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node | null;
      if (!target) return;
      const wrapper = wrapperRef.current;
      const menu = menuRef.current;
      if (wrapper?.contains(target)) return;
      if (menu?.contains(target)) return;
      setMenuOpen(false);
    }

    function updateMenuPosition() {
      const trigger = buttonRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const parentCard = wrapperRef.current?.closest(".poll-card") as HTMLElement | null;
      const cardRect = parentCard?.getBoundingClientRect();
      const menuWidth = 180;
      const desiredRightEdge = cardRect?.right ?? rect.right;
      const left = Math.min(
        window.innerWidth - menuWidth - 8,
        Math.max(8, desiredRightEdge - menuWidth)
      );
      const top = Math.max(8, rect.top - 6);
      setMenuPosition({ top, left });
    }

    updateMenuPosition();

    document.addEventListener("keydown", handleEscape);
    document.addEventListener("pointerdown", handlePointerDown, true);
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("pointerdown", handlePointerDown, true);
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
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
    <div
      className={`share-menu ${compact ? "share-menu-compact-anchor" : ""} ${menuOpen ? "share-menu-open" : ""}`}
      data-share-poll-id={pollId}
      ref={wrapperRef}
    >
      <button
        ref={buttonRef}
        type="button"
        className={`share-btn ${compact ? "share-btn-compact" : ""}`}
        onClick={() =>
          setMenuOpen((current) => {
            const next = !current;
            if (next) {
              window.dispatchEvent(new CustomEvent("poll-share-menu-open", { detail: { pollId } }));
            }
            return next;
          })
        }
        aria-label="Share poll"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        title={copied ? "Copied" : "Share poll"}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <circle cx="6" cy="12" r="2.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="17.5" cy="6" r="2.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="17.5" cy="18" r="2.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <path d="M8 11 15.3 7.1M8 13l7.3 3.9" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        {compact ? null : copied ? "Copied" : "Share"}
      </button>
      {menuOpen && typeof document !== "undefined"
        ? createPortal(
            <>
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
              <div
                ref={menuRef}
                className="share-menu-pop share-menu-pop-floating"
                role="menu"
                style={{
                  top: menuPosition?.top ?? 0,
                  left: menuPosition?.left ?? 0
                }}
              >
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
            </>,
            document.body
          )
        : null}
    </div>
  );
}
