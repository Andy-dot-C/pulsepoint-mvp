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
  commentStatusType,
  commentStatusMessage,
  signedIn,
  isAdmin
}: PollCommentsProps) {
  const returnTo = `/polls/${pollSlug}?comments=${sort}#comments`;
  const signInHref = `/auth?next=${encodeURIComponent(returnTo)}`;

  return (
    <section className="comments-panel" id="comments">
      <div className="comments-head">
        <h2>Discussion</h2>
        <div className="comments-sort-row">
          <Link
            href={`/polls/${pollSlug}?comments=newest#comments`}
            scroll={false}
            className={`comments-sort-btn ${sort === "newest" ? "comments-sort-btn-active" : ""}`}
          >
            Newest
          </Link>
          <Link
            href={`/polls/${pollSlug}?comments=top#comments`}
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
                <p className="eyebrow">{comment.username}</p>
                <p className="poll-blurb">{new Date(comment.createdAt).toLocaleString()}</p>
              </div>
              <p className="detail-description">{comment.body}</p>
              <div className="comment-actions">
                <form action={toggleCommentUpvoteAction}>
                  <input type="hidden" name="pollId" value={pollId} />
                  <input type="hidden" name="commentId" value={comment.id} />
                  <input type="hidden" name="intent" value={comment.viewerHasUpvoted ? "remove" : "upvote"} />
                  <input type="hidden" name="returnTo" value={returnTo} />
                  <button className={`comment-vote-btn ${comment.viewerHasUpvoted ? "comment-vote-btn-active" : ""}`} type="submit">
                    ▲ {comment.upvotes}
                  </button>
                </form>
                {isAdmin ? (
                  <form action={deleteCommentByAdminAction}>
                    <input type="hidden" name="commentId" value={comment.id} />
                    <input type="hidden" name="returnTo" value={returnTo} />
                    <button className="ghost-btn" type="submit">
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
