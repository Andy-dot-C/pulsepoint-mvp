import Link from "next/link";
import {
  deleteCommentByAdminAction,
  submitCommentAction,
  toggleCommentUpvoteAction
} from "@/app/actions/comments";
import { CommentSortKey, PollComment } from "@/lib/data/comments";

type PollCommentsProps = {
  pollId: string;
  pollSlug: string;
  comments: PollComment[];
  sort: CommentSortKey;
  graph?: string;
  timeframe?: string;
  commentStatusType?: string;
  commentStatusMessage?: string;
  signedIn: boolean;
  isAdmin: boolean;
};

export function PollComments({
  pollId,
  pollSlug,
  comments,
  sort,
  graph,
  timeframe,
  commentStatusType,
  commentStatusMessage,
  signedIn,
  isAdmin
}: PollCommentsProps) {
  const graphQuery = graph ? `&graph=${encodeURIComponent(graph)}` : "";
  const timeframeQuery = timeframe ? `&time=${encodeURIComponent(timeframe)}` : "";
  const returnTo = `/polls/${pollSlug}?comments=${sort}${graphQuery}${timeframeQuery}#comments`;
  const signInHref = `/auth?next=${encodeURIComponent(returnTo)}`;

  function avatarText(username: string): string {
    const clean = username.trim();
    if (!clean) return "?";
    const parts = clean.split(/[\s._-]+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
    }
    return (clean[0] ?? "?").toUpperCase();
  }

  function avatarStyle(username: string): { backgroundColor: string; borderColor: string; color: string } {
    const seed = username.trim().toLowerCase();
    let hash = 0;
    for (let index = 0; index < seed.length; index += 1) {
      hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
    }
    const hue = hash % 360;
    return {
      backgroundColor: `hsl(${hue} 78% 88%)`,
      borderColor: `hsl(${hue} 48% 72%)`,
      color: `hsl(${hue} 42% 24%)`
    };
  }

  return (
    <section className="comments-panel" id="comments">
      <div className="comments-head">
        <h2>Discussion</h2>
        <div className="comments-sort-row">
          <Link
            href={`/polls/${pollSlug}?comments=newest${graphQuery}${timeframeQuery}#comments`}
            scroll={false}
            className={`comments-sort-btn ${sort === "newest" ? "comments-sort-btn-active" : ""}`}
          >
            Newest
          </Link>
          <Link
            href={`/polls/${pollSlug}?comments=top${graphQuery}${timeframeQuery}#comments`}
            scroll={false}
            className={`comments-sort-btn ${sort === "top" ? "comments-sort-btn-active" : ""}`}
          >
            Top comments
          </Link>
        </div>
      </div>

      {commentStatusMessage ? (
        <p className={commentStatusType === "error" ? "auth-error" : "auth-success"}>{commentStatusMessage}</p>
      ) : null}

      {signedIn ? (
        <form action={submitCommentAction} className="comment-form">
          <input type="hidden" name="pollId" value={pollId} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <textarea name="body" rows={3} maxLength={1000} placeholder="Add your view..." required />
          <button type="submit" className="create-btn">
            Post comment
          </button>
        </form>
      ) : (
        <div className="comment-form">
          <a className="comment-signin-box" href={signInHref}>
            Sign in to add a comment
          </a>
          <a className="create-btn comment-signin-btn" href={signInHref}>
            Sign in to comment
          </a>
        </div>
      )}

      <div className="comments-list">
        {comments.length === 0 ? (
          <p className="poll-blurb">No comments yet.</p>
        ) : (
          comments.map((comment) => (
            <article key={comment.id} className="comment-card">
              <div className="comment-meta">
                <div className="comment-author">
                  <span className="comment-avatar" style={avatarStyle(comment.username)} aria-hidden="true">
                    {avatarText(comment.username)}
                  </span>
                  <p className="comment-username">{comment.username}</p>
                </div>
                <p className="poll-blurb">{new Date(comment.createdAt).toLocaleString()}</p>
              </div>
              <p className="detail-description">{comment.body}</p>
              <div className="comment-actions">
                <form action={toggleCommentUpvoteAction}>
                  <input type="hidden" name="pollId" value={pollId} />
                  <input type="hidden" name="commentId" value={comment.id} />
                  <input type="hidden" name="intent" value={comment.viewerHasUpvoted ? "remove" : "upvote"} />
                  <input type="hidden" name="returnTo" value={returnTo} />
                  <button
                    className={`comment-vote-btn ${comment.viewerHasUpvoted ? "comment-vote-btn-active" : ""}`}
                    type="submit"
                    aria-label={comment.viewerHasUpvoted ? "Remove upvote" : "Upvote comment"}
                  >
                    <span className="comment-vote-arrow" aria-hidden="true">
                      {comment.viewerHasUpvoted ? (
                        <svg className="comment-vote-icon comment-vote-icon-filled" viewBox="0 0 24 24" focusable="false">
                          <path d="M12 5 4.5 18h15L12 5Z" />
                        </svg>
                      ) : (
                        <svg className="comment-vote-icon comment-vote-icon-outline" viewBox="0 0 24 24" focusable="false">
                          <path d="M12 5 4.5 18h15L12 5Z" />
                        </svg>
                      )}
                    </span>
                    <span className="comment-vote-count">{comment.upvotes}</span>
                  </button>
                </form>
                {isAdmin ? (
                  <form action={deleteCommentByAdminAction}>
                    <input type="hidden" name="commentId" value={comment.id} />
                    <input type="hidden" name="returnTo" value={returnTo} />
                    <button className="ghost-btn comment-delete-btn" type="submit">
                      Delete
                    </button>
                  </form>
                ) : null}
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
