"use client";

import { type KeyboardEvent, type MouseEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";

type PollCardShellProps = {
  href: string;
  ariaLabel: string;
  children: ReactNode;
};

const INTERACTIVE_SELECTOR =
  "a,button,input,textarea,select,label,[role='button'],[data-no-card-open='true']";

function hasModifierKey(event: MouseEvent<HTMLElement>) {
  return event.metaKey || event.ctrlKey || event.altKey || event.shiftKey;
}

export function PollCardShell({ href, ariaLabel, children }: PollCardShellProps) {
  const router = useRouter();

  function openPoll() {
    router.push(href);
  }

  function handleClick(event: MouseEvent<HTMLElement>) {
    if (event.defaultPrevented) return;
    if (event.button !== 0) return;
    if (hasModifierKey(event)) return;
    const target = event.target as HTMLElement | null;
    if (target?.closest(INTERACTIVE_SELECTOR)) return;
    openPoll();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key !== "Enter" && event.key !== " ") return;
    const target = event.target as HTMLElement | null;
    if (target?.closest(INTERACTIVE_SELECTOR)) return;
    event.preventDefault();
    openPoll();
  }

  return (
    <article
      className="poll-card poll-card-clickable"
      role="link"
      aria-label={ariaLabel}
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      {children}
    </article>
  );
}
