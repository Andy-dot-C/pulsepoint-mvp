import { submitVoteAction } from "@/app/actions/votes";

type VoteOptionFormProps = {
  pollId: string;
  optionId: string;
  returnTo: string;
  label: string;
  rightText: string;
  percent: number;
  disabled?: boolean;
};

export function VoteOptionForm({
  pollId,
  optionId,
  returnTo,
  label,
  rightText,
  percent,
  disabled = false
}: VoteOptionFormProps) {
  const safePercent = Math.max(0, Math.min(100, Number.isFinite(percent) ? percent : 0));

  return (
    <form action={submitVoteAction}>
      <input type="hidden" name="pollId" value={pollId} />
      <input type="hidden" name="optionId" value={optionId} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <button className="option-btn" type="submit" disabled={disabled} aria-disabled={disabled}>
        <span className="option-btn-fill" aria-hidden="true" style={{ width: `${safePercent}%` }} />
        <span className="option-btn-content">
          <span>{label}</span>
          <strong>{rightText}</strong>
        </span>
      </button>
    </form>
  );
}
