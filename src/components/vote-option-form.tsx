import { submitVoteAction } from "@/app/actions/votes";
import type { CSSProperties } from "react";

type VoteOptionFormProps = {
  pollId: string;
  optionId: string;
  returnTo: string;
  label: string;
  rightText: string;
  percent: number;
  variant?: "default" | "binary" | "line";
  fillColor?: string;
  accentColor?: string;
  selected?: boolean;
  disabled?: boolean;
};

function colorToTint(color: string): string | null {
  const hex = color.trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) return null;
  const red = Number.parseInt(hex.slice(0, 2), 16);
  const green = Number.parseInt(hex.slice(2, 4), 16);
  const blue = Number.parseInt(hex.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, 0.04)`;
}

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
  selected = false,
  disabled = false
}: VoteOptionFormProps) {
  const safePercent = Math.max(0, Math.min(100, Number.isFinite(percent) ? percent : 0));
  const selectedColor = accentColor ?? fillColor;
  const style: CSSProperties = {};
  if (accentColor) {
    style["--binary-percent-color" as string] = accentColor;
    if (variant === "line") {
      style["--option-line-percent-color" as string] = accentColor;
    }
  }
  if (selectedColor) {
    style["--option-selected-color" as string] = selectedColor;
    const selectedTint = colorToTint(selectedColor);
    if (selectedTint) {
      style["--option-selected-tint" as string] = selectedTint;
    }
  }

  return (
    <form action={submitVoteAction}>
      <input type="hidden" name="pollId" value={pollId} />
      <input type="hidden" name="optionId" value={optionId} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <button
        className={`option-btn ${variant === "binary" ? "option-btn-binary" : ""}${variant === "line" ? " option-btn-line" : ""}${selected ? " option-btn-selected" : ""}`}
        type="submit"
        disabled={disabled}
        aria-disabled={disabled}
        aria-pressed={selected}
        style={Object.keys(style).length > 0 ? style : undefined}
      >
        {variant === "binary" || variant === "line" ? null : (
          <span
            className="option-btn-fill"
            aria-hidden="true"
            style={{ width: `${safePercent}%`, ...(fillColor ? { backgroundColor: fillColor } : {}) }}
          />
        )}
        {variant === "line" ? (
          <span className="option-btn-line-content">
            <span className="option-btn-line-header">
              <span className="option-btn-line-label">{label}</span>
              <strong className="option-btn-line-percent">{rightText}</strong>
            </span>
            <span className="option-btn-line-track" aria-hidden="true">
              <span
                className="option-btn-line-fill"
                style={{ width: `${safePercent}%`, ...(accentColor ? { backgroundColor: accentColor } : {}) }}
              />
            </span>
          </span>
        ) : (
          <span className="option-btn-content">
            <span>{label}</span>
            <strong>{rightText}</strong>
          </span>
        )}
      </button>
    </form>
  );
}
