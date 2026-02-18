import { toggleBookmarkAction } from "@/app/actions/bookmarks";

type BookmarkToggleFormProps = {
  pollId: string;
  isBookmarked: boolean;
  returnTo: string;
  compact?: boolean;
};

export function BookmarkToggleForm({ pollId, isBookmarked, returnTo, compact }: BookmarkToggleFormProps) {
  return (
    <form action={toggleBookmarkAction}>
      <input type="hidden" name="pollId" value={pollId} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <input type="hidden" name="intent" value={isBookmarked ? "remove" : "save"} />
      <button
        className={`bookmark-icon-btn ${isBookmarked ? "bookmark-icon-btn-active" : ""} ${
          compact ? "bookmark-icon-btn-compact" : ""
        }`}
        type="submit"
        aria-label={isBookmarked ? "Remove bookmark" : "Save bookmark"}
        title={isBookmarked ? "Remove bookmark" : "Save bookmark"}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path
            d="M7 3.5h10a1.5 1.5 0 0 1 1.5 1.5v15l-6.5-3.9-6.5 3.9V5A1.5 1.5 0 0 1 7 3.5Z"
            fill={isBookmarked ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </form>
  );
}
