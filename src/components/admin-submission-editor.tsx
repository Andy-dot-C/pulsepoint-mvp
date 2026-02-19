"use client";

import { useMemo, useState } from "react";
import {
  approveSubmissionAction,
  mergeSubmissionAction,
  rejectSubmissionAction
} from "@/app/actions/submissions";
import { categories } from "@/lib/mock-data";

type Submission = {
  id: string;
  title: string;
  description: string;
  category_key: string;
  options: string[];
  created_at: string;
  end_at: string | null;
};

type Props = {
  submission: Submission;
};

export function AdminSubmissionEditor({ submission }: Props) {
  const [title, setTitle] = useState(submission.title);
  const [description, setDescription] = useState(submission.description);
  const [category, setCategory] = useState(submission.category_key);
  const [options, setOptions] = useState<string[]>(submission.options);
  const [isImproving, setIsImproving] = useState(false);
  const [improveError, setImproveError] = useState<string | null>(null);
  const [optionChanges, setOptionChanges] = useState<Array<{ from: string; to: string }>>([]);

  const cleanedOptions = useMemo(
    () => options.map((value) => value.trim()).filter(Boolean),
    [options]
  );

  async function improveDraft() {
    setImproveError(null);
    setIsImproving(true);

    try {
      const response = await fetch("/api/polls/improve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, category, options: cleanedOptions })
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error ?? "Could not improve draft");
      }

      setTitle(String(payload.title ?? title));
      setDescription(String(payload.description ?? description));

      if (Array.isArray(payload.options) && payload.options.length >= 2) {
        setOptions(payload.options.map((value: unknown) => String(value)));
      }
      if (Array.isArray(payload.optionChanges)) {
        setOptionChanges(
          payload.optionChanges
            .map((item: unknown) => {
              if (!item || typeof item !== "object") return null;
              const record = item as Record<string, unknown>;
              return {
                from: String(record.from ?? ""),
                to: String(record.to ?? "")
              };
            })
            .filter((item: { from: string; to: string } | null): item is { from: string; to: string } =>
              Boolean(item?.from && item?.to)
            )
        );
      } else {
        setOptionChanges([]);
      }
    } catch (error) {
      setImproveError(error instanceof Error ? error.message : "Could not improve draft");
    } finally {
      setIsImproving(false);
    }
  }

  return (
    <article className="detail-card" style={{ marginTop: 16 }}>
      <p className="eyebrow">Submitted {new Date(submission.created_at).toLocaleString()}</p>
      <form action={approveSubmissionAction} className="submit-form">
        <input type="hidden" name="submissionId" value={submission.id} />
        <input type="hidden" name="originalEndAt" value={submission.end_at ?? ""} />

        <label>
          Title
          <input name="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </label>

        <label>
          Category
          <select name="category" value={category} onChange={(e) => setCategory(e.target.value)}>
            {categories.map((item) => (
              <option key={item.key} value={item.key}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          Description
          <textarea
            name="description"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </label>

        <div className="submit-options">
          <p>Options</p>
          {options.map((option, index) => (
            <input
              key={`${submission.id}-opt-${index}`}
              name="options"
              value={option}
              onChange={(e) =>
                setOptions((current) =>
                  current.map((item, itemIndex) => (itemIndex === index ? e.target.value : item))
                )
              }
              required
            />
          ))}
        </div>

        <label>
          End date (optional)
          <input
            type="datetime-local"
            name="endAt"
            defaultValue={submission.end_at ? new Date(submission.end_at).toISOString().slice(0, 16) : ""}
          />
        </label>

        <label>
          Review notes
          <textarea name="reviewNotes" rows={3} placeholder="Notes for moderation audit trail" />
        </label>

        <div className="submit-actions-row">
          <button type="button" className="ghost-btn" onClick={improveDraft} disabled={isImproving || !title}>
            {isImproving ? "Improving..." : "AI neutralize + improve"}
          </button>
          <button type="submit" className="create-btn">
            Approve (with edits if changed)
          </button>
        </div>

        {improveError ? <p className="auth-error">{improveError}</p> : null}
        {optionChanges.length > 0 ? (
          <div className="submit-options-change">
            <p>AI spelling/wording updates:</p>
            {optionChanges.map((change, index) => (
              <p key={`${change.from}-${change.to}-${index}`}>
                {change.from} {"->"} {change.to}
              </p>
            ))}
          </div>
        ) : null}
        <p className="submit-hint">AI assist is instructed to keep wording neutral and preserve intended meaning.</p>
      </form>

      <div className="submit-actions-row" style={{ marginTop: 10 }}>
        <form action={rejectSubmissionAction}>
          <input type="hidden" name="submissionId" value={submission.id} />
          <input type="hidden" name="reviewNotes" value="Rejected by moderator" />
          <button type="submit" className="ghost-btn">
            Reject
          </button>
        </form>

        <form action={mergeSubmissionAction} className="inline-form">
          <input type="hidden" name="submissionId" value={submission.id} />
          <input name="duplicateOfSubmissionId" placeholder="Duplicate of submission ID" required />
          <input type="hidden" name="reviewNotes" value="Merged as duplicate" />
          <button type="submit" className="ghost-btn">
            Merge duplicate
          </button>
        </form>
      </div>
    </article>
  );
}
