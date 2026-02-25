import { submitVoteAction } from "@/app/actions/votes";
import type { CSSProperties } from "react";

type VoteOptionFormProps = {
  pollId: string;
  optionId: string;
  returnTo: string;
  label: string;
  rightText: string;
  percent: number;
  variant?: "default" | "binary";
  fillColor?: string;
  accentColor?: string;
  disabled?: boolean;
};

export function VoteOptionForm({
  pollId,
  optionId,
  returnTo,
  label,
  rightText,
  percent,
  variant = "default",
  fillColor,
  accentColor,
  disabled = false
}: VoteOptionFormProps) {
  const safePercent = Math.max(0, Math.min(100, Number.isFinite(percent) ? percent : 0));

  return (
    <form action={submitVoteAction}>
      <input type="hidden" name="pollId" value={pollId} />
      <input type="hidden" name="optionId" value={optionId} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <button
        className={`option-btn ${variant === "binary" ? "option-btn-binary" : ""}`}
        type="submit"
        disabled={disabled}
        aria-disabled={disabled}
        style={accentColor ? ({ ["--binary-percent-color" as string]: accentColor } as CSSProperties) : undefined}
      >
        {variant === "binary" ? null : (
          <span
            className="option-btn-fill"
            aria-hidden="true"
            style={{ width: `${safePercent}%`, ...(fillColor ? { backgroundColor: fillColor } : {}) }}
          />
        )}
        <span className="option-btn-content">
          <span>{label}</span>
          <strong>{rightText}</strong>
        </span>
      </button>
    </form>
  );
}
