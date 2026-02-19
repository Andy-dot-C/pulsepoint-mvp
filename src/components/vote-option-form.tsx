import { submitVoteAction } from "@/app/actions/votes";

type VoteOptionFormProps = {
  pollId: string;
  optionId: string;
  returnTo: string;
  label: string;
  rightText: string;
  disabled?: boolean;
};

export function VoteOptionForm({
  pollId,
  optionId,
  returnTo,
  label,
  rightText,
  disabled = false
}: VoteOptionFormProps) {
  return (
    <form action={submitVoteAction}>
      <input type="hidden" name="pollId" value={pollId} />
      <input type="hidden" name="optionId" value={optionId} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <button className="option-btn" type="submit" disabled={disabled} aria-disabled={disabled}>
        <span>{label}</span>
        <strong>{rightText}</strong>
      </button>
    </form>
  );
}
