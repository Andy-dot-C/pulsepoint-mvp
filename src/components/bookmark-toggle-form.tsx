"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type BookmarkToggleFormProps = {
  pollId: string;
  isBookmarked: boolean;
  source?: string;
  compact?: boolean;
};

type ToggleResponse = {
  ok: boolean;
  isBookmarked?: boolean;
  error?: string;
  authUrl?: string;
};

export function BookmarkToggleForm({ pollId, isBookmarked, source, compact }: BookmarkToggleFormProps) {
  const [optimisticBookmarked, setOptimisticBookmarked] = useState(isBookmarked);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    setOptimisticBookmarked(isBookmarked);
  }, [isBookmarked]);

  function getReturnTo() {
    const query = searchParams?.toString() ?? "";
    return `${pathname}${query ? `?${query}` : ""}`;
  }

  function handleToggle() {
    if (isPending) return;
    const previousState = optimisticBookmarked;
    const nextState = !previousState;
    setOptimisticBookmarked(nextState);

    startTransition(async () => {
      try {
        const response = await fetch("/api/bookmarks/toggle", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            pollId,
            intent: nextState ? "save" : "remove",
            source: source ?? (pathname.startsWith("/polls/") ? "poll_detail" : "feed"),
            returnTo: getReturnTo()
          })
        });

        const payload = (await response.json().catch(() => null)) as ToggleResponse | null;
        if (response.status === 401 && payload?.authUrl) {
          window.location.href = payload.authUrl;
          return;
        }

        if (!response.ok || !payload?.ok) {
          setOptimisticBookmarked(previousState);
          return;
        }

        setOptimisticBookmarked(Boolean(payload.isBookmarked));
        if (pathname === "/saved") {
          router.refresh();
        }
      } catch {
        setOptimisticBookmarked(previousState);
      }
    });
  }

  return (
    <button
      className={`bookmark-icon-btn ${optimisticBookmarked ? "bookmark-icon-btn-active" : ""} ${
        compact ? "bookmark-icon-btn-compact" : ""
      }`}
      type="button"
      data-no-card-open="true"
      onClick={handleToggle}
      disabled={isPending}
      aria-label={optimisticBookmarked ? "Remove bookmark" : "Save bookmark"}
      title={optimisticBookmarked ? "Remove bookmark" : "Save bookmark"}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path
          d="M7 3.5h10a1.5 1.5 0 0 1 1.5 1.5v15l-6.5-3.9-6.5 3.9V5A1.5 1.5 0 0 1 7 3.5Z"
          fill={optimisticBookmarked ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
