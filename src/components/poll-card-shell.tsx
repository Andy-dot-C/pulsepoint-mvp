"use client";

import { type KeyboardEvent, type MouseEvent, type ReactNode, useState } from "react";
import { useRouter } from "next/navigation";

type PollCardShellProps = {
  href: string;
  ariaLabel: string;
  className?: string;
  children: ReactNode;
};

const INTERACTIVE_SELECTOR =
  "a,button,input,textarea,select,label,[role='button'],[data-no-card-open='true']";

function hasModifierKey(event: MouseEvent<HTMLElement>) {
  return event.metaKey || event.ctrlKey || event.altKey || event.shiftKey;
}

export function PollCardShell({ href, ariaLabel, className, children }: PollCardShellProps) {
  const router = useRouter();
  const [isOpening, setIsOpening] = useState(false);

  function openPoll() {
    setIsOpening(true);
    router.push(href);
  }

  function openPollInNewTab() {
    window.open(href, "_blank", "noopener,noreferrer");
  }

  function handlePointerEnter() {
    router.prefetch(href);
  }

  function handleFocus() {
    router.prefetch(href);
  }

  function handleClick(event: MouseEvent<HTMLElement>) {
    if (event.defaultPrevented) return;
    if (event.button === 1) {
      openPollInNewTab();
      return;
    }
    if (event.button !== 0) return;
    const target = event.target as HTMLElement | null;
    if (target?.closest(INTERACTIVE_SELECTOR)) return;
    if (event.metaKey || event.ctrlKey) {
      openPollInNewTab();
      return;
    }
    if (hasModifierKey(event)) return;
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
      className={`poll-card poll-card-clickable${className ? ` ${className}` : ""}${isOpening ? " poll-card-opening" : ""}`}
      role="link"
      aria-label={ariaLabel}
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={handlePointerEnter}
      onFocus={handleFocus}
    >
      {children}
    </article>
  );
}
