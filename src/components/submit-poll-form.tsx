"use client";

import { useMemo, useRef, useState } from "react";
import { submitPollAction } from "@/app/actions/submissions";
import { categories } from "@/lib/mock-data";

type SubmitPollFormProps = {
  defaultCategory?: string;
  statusType?: string;
  statusMessage?: string;
};

type DuplicateMatch = {
  pollId: string;
  slug: string;
  title: string;
  score: number;
};

export function SubmitPollForm({
  defaultCategory = "politics",
  statusType,
  statusMessage
}: SubmitPollFormProps) {
  const [formElement, setFormElement] = useState<HTMLFormElement | null>(null);
  const duplicateOverrideInputRef = useRef<HTMLInputElement | null>(null);
  const possibleDuplicateIdsInputRef = useRef<HTMLInputElement | null>(null);
  const [isImproving, setIsImproving] = useState(false);
  const [improveError, setImproveError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [duplicateError, setDuplicateError] = useState<string | null>(null);
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);
  const allowNativeSubmitRef = useRef(false);
  const [duplicateWarningOpen, setDuplicateWarningOpen] = useState(false);
  const duplicateOverrideRef = useRef(false);
  const possibleDuplicateIdsRef = useRef<string[]>([]);
  const [possibleDuplicates, setPossibleDuplicates] = useState<DuplicateMatch[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(defaultCategory);
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [durationPreset, setDurationPreset] = useState("30d");
  const [endAt, setEndAt] = useState("");
  const [optionChanges, setOptionChanges] = useState<Array<{ from: string; to: string }>>([]);

  const canAddOption = options.length < 10;
  const canRemoveOption = options.length > 2;

  const cleanedOptions = useMemo(
    () => options.map((value) => value.trim()).filter(Boolean),
    [options]
  );

  function submitNow() {
    if (duplicateOverrideInputRef.current) {
      duplicateOverrideInputRef.current.value = duplicateOverrideRef.current ? "1" : "";
    }
    if (possibleDuplicateIdsInputRef.current) {
      possibleDuplicateIdsInputRef.current.value = possibleDuplicateIdsRef.current.join(",");
    }
    allowNativeSubmitRef.current = true;
    formElement?.requestSubmit();
  }

  async function runDuplicateCheck(): Promise<boolean> {
    setDuplicateError(null);
    setIsCheckingDuplicates(true);

    try {
      const response = await fetch("/api/polls/duplicate-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          category,
          options: cleanedOptions
        })
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error ?? "Could not check duplicates");
      }

      const matches: DuplicateMatch[] = Array.isArray(payload.matches)
        ? payload.matches
            .map((item: unknown) => {
              if (!item || typeof item !== "object") return null;
              const record = item as Record<string, unknown>;
              return {
                pollId: String(record.pollId ?? ""),
                slug: String(record.slug ?? ""),
                title: String(record.title ?? ""),
                score: Number(record.score ?? 0)
              };
            })
            .filter(
              (item: DuplicateMatch | null): item is DuplicateMatch =>
                Boolean(item?.pollId && item?.slug && item?.title)
            )
        : [];

      if (matches.length > 0) {
        setPossibleDuplicates(matches);
        const ids = matches.map((item) => item.pollId);
        possibleDuplicateIdsRef.current = ids;
        setDuplicateWarningOpen(true);
        return false;
      }

      setPossibleDuplicates([]);
      possibleDuplicateIdsRef.current = [];
      duplicateOverrideRef.current = false;
      return true;
    } catch (error) {
      setDuplicateError(error instanceof Error ? error.message : "Could not check duplicates");
      return false;
    } finally {
      setIsCheckingDuplicates(false);
    }
  }

  async function handleSubmitClick() {
    setSubmitError(null);
    if (!formElement?.reportValidity()) {
      return;
    }

    const normalizedOptions = options
      .map((value) => value.trim())
      .filter(Boolean)
      .map((value) => value.toLowerCase());
    const uniqueOptionCount = new Set(normalizedOptions).size;
    if (uniqueOptionCount < 2) {
      setSubmitError("Polls must have between 2 and 10 unique options.");
      return;
    }

    if (duplicateOverrideRef.current) {
      submitNow();
      return;
    }

    const canSubmit = await runDuplicateCheck();
    if (canSubmit) {
      submitNow();
    }
  }

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
    <form
      action={submitPollAction}
      className="submit-form"
      ref={setFormElement}
      onSubmit={(event) => {
        if (allowNativeSubmitRef.current) {
          allowNativeSubmitRef.current = false;
          return;
        }
        event.preventDefault();
        void handleSubmitClick();
      }}
    >
      <input ref={duplicateOverrideInputRef} type="hidden" name="duplicateOverride" defaultValue="" />
      <input ref={possibleDuplicateIdsInputRef} type="hidden" name="possibleDuplicateIds" defaultValue="" />
      {statusMessage ? (
        <p className={statusType === "error" ? "auth-error" : "auth-success"}>{statusMessage}</p>
      ) : null}

      <label>
        Poll title
        <input
          name="title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
          placeholder="Should the UK lower the voting age to 16?"
        />
      </label>

      <label>
        Category
        <select name="category" value={category} onChange={(event) => setCategory(event.target.value)}>
          {categories.map((item) => (
            <option key={item.key} value={item.key}>
              {item.label}
            </option>
          ))}
        </select>
      </label>

      <div className="submit-options">
        <p>Options (2-10)</p>
        {options.map((value, index) => (
          <div key={`option-${index}`} className="option-row">
            <input
              name="options"
              value={value}
              onChange={(event) => {
                setOptions((current) =>
                  current.map((item, itemIndex) => (itemIndex === index ? event.target.value : item))
                );
              }}
              placeholder={`Option ${index + 1}`}
              required={index < 2}
            />
            {canRemoveOption ? (
              <button
                type="button"
                className="ghost-btn"
                onClick={() =>
                  setOptions((current) => current.filter((_, itemIndex) => itemIndex !== index))
                }
              >
                Remove
              </button>
            ) : null}
          </div>
        ))}
        <div className="submit-actions-row">
          <button
            type="button"
            className="ghost-btn"
            disabled={!canAddOption}
            onClick={() => setOptions((current) => [...current, ""])}
          >
            Add option
          </button>
          <span>{cleanedOptions.length}/10 filled</span>
        </div>
      </div>

      <label>
        Description
        <textarea
          name="description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          required
          rows={4}
          placeholder="Context users need before voting."
        />
      </label>

      <label>
        Poll duration
        <select
          name="durationPreset"
          value={durationPreset}
          onChange={(event) => setDurationPreset(event.target.value)}
        >
          <option value="1d">1 day</option>
          <option value="7d">7 days</option>
          <option value="30d">30 days</option>
          <option value="90d">90 days</option>
          <option value="all-time">No end date</option>
          <option value="custom">Custom date</option>
        </select>
      </label>
      {durationPreset === "custom" ? (
        <label>
          Custom end date
          <input
            type="datetime-local"
            name="endAt"
            value={endAt}
            onChange={(event) => setEndAt(event.target.value)}
          />
        </label>
      ) : (
        <input type="hidden" name="endAt" value="" />
      )}

      <div className="submit-actions-row">
        <button type="button" className="ghost-btn" onClick={improveDraft} disabled={isImproving || !title}>
          {isImproving ? "Improving..." : "AI improve wording + descriptions"}
        </button>
        <button type="button" className="create-btn" onClick={handleSubmitClick} disabled={isCheckingDuplicates}>
          {isCheckingDuplicates ? "Checking for duplicates..." : "Submit poll"}
        </button>
      </div>
      {duplicateError ? <p className="auth-error">{duplicateError}</p> : null}
      {submitError ? <p className="auth-error">{submitError}</p> : null}

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
      <p className="submit-hint">
        AI assist is instructed to keep wording neutral, improve clarity, and preserve intended names/options.
      </p>
      <p className="submit-hint">
        Politics and flagged wording go to moderation. Lower-risk polls can auto-publish.
      </p>

      {duplicateWarningOpen ? (
        <div className="duplicate-modal-backdrop">
          <div className="duplicate-modal">
            <h3>Possible duplicate found</h3>
            <p className="poll-blurb">
              We found similar polls in this category. You can open them first, or submit anyway for manual review.
            </p>
            <div className="duplicate-list">
              {possibleDuplicates.map((item) => (
                <a key={item.pollId} className="duplicate-link" href={`/polls/${item.slug}`} target="_blank" rel="noreferrer">
                  <span>{item.title}</span>
                  <strong>{Math.round(item.score * 100)}% match</strong>
                </a>
              ))}
            </div>
            <div className="submit-actions-row">
              <button
                type="button"
                className="ghost-btn"
                onClick={() => {
                  setDuplicateWarningOpen(false);
                  duplicateOverrideRef.current = false;
                }}
              >
                Go back and edit
              </button>
              <button
                type="button"
                className="create-btn"
                onClick={() => {
                  setDuplicateWarningOpen(false);
                  duplicateOverrideRef.current = true;
                  window.setTimeout(() => submitNow(), 0);
                }}
              >
                Submit anyway (send to review)
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </form>
  );
}
