"use client";

import { useMemo, useRef, useState } from "react";
import { submitPollAction } from "@/app/actions/submissions";
import { OPTION_MAX_LENGTH, SUMMARY_MAX_LENGTH, TITLE_MAX_LENGTH } from "@/lib/submissions";

type SubmitPollFormProps = {
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
  const [summary, setSummary] = useState("");
  const [showSummaryEditor, setShowSummaryEditor] = useState(false);
  const [isAiPrepared, setIsAiPrepared] = useState(false);
  const [options, setOptions] = useState<string[]>(["", ""]);
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

    if (!isAiPrepared) {
      const prepared = await improveDraft();
      if (prepared) {
        setSubmitError("AI prep complete. Review if needed, then click Submit poll again.");
      }
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

  async function improveDraft(): Promise<boolean> {
    setImproveError(null);
    setIsImproving(true);

    try {
      const response = await fetch("/api/polls/improve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, options: cleanedOptions })
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error ?? "Could not improve draft");
      }

      setTitle(String(payload.title ?? title));
      setSummary(String(payload.summary ?? payload.description ?? summary));
      setShowSummaryEditor(true);
      setIsAiPrepared(true);

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
      return true;
    } catch (error) {
      setImproveError(error instanceof Error ? error.message : "Could not improve draft");
      return false;
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

      <section className="submit-section">
        <label className="submit-field">
          <span className="submit-field-label">Poll question</span>
          <input
          name="title"
          value={title}
          onChange={(event) => {
            setTitle(event.target.value);
            setIsAiPrepared(false);
          }}
          maxLength={TITLE_MAX_LENGTH}
          required
          placeholder="Should the UK lower the voting age to 16?"
          />
        </label>
      </section>

      <section className="submit-section">
        <div className="submit-options">
          <div className="submit-options-head">
            <p className="submit-field-label">Options</p>
            <span className="submit-mini-pill">{cleanedOptions.length}/10 filled</span>
          </div>
          {options.map((value, index) => (
            <div key={`option-${index}`} className="option-row">
              <input
                name="options"
                value={value}
                onChange={(event) => {
                  setOptions((current) =>
                    current.map((item, itemIndex) => (itemIndex === index ? event.target.value : item))
                  );
                  setIsAiPrepared(false);
                }}
                maxLength={OPTION_MAX_LENGTH}
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
              className="ghost-btn submit-add-option-btn"
              disabled={!canAddOption}
              onClick={() => setOptions((current) => [...current, ""])}
            >
              Add option
            </button>
          </div>
        </div>
      </section>

      <input type="hidden" name="durationPreset" value="30d" />
      <input type="hidden" name="endAt" value="" />

      {showSummaryEditor ? (
        <section className="submit-section">
          <label className="submit-field">
            <span className="submit-field-label">Summary (optional)</span>
            <textarea
              name="summary"
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
              maxLength={SUMMARY_MAX_LENGTH}
              rows={3}
              placeholder="AI will populate this automatically. You can edit it."
            />
          </label>
        </section>
      ) : (
        <input type="hidden" name="summary" value="" />
      )}

      <section className="submit-section submit-section-actions">
        <div className="submit-actions-row submit-actions-row-main">
          <div className="submit-actions-row">
            {!showSummaryEditor ? (
              <button
                type="button"
                className="ghost-btn submit-summary-btn"
                onClick={() => setShowSummaryEditor(true)}
                disabled={!title}
              >
                Add/edit summary
              </button>
            ) : null}
          </div>
          <button
            type="button"
            className="create-btn"
            onClick={handleSubmitClick}
            disabled={isCheckingDuplicates || isImproving || !title.trim()}
          >
            {isImproving
              ? "Preparing with AI..."
              : isCheckingDuplicates
                ? "Checking for duplicates..."
                : isAiPrepared
                  ? "Submit poll now"
                  : "Submit poll"}
          </button>
        </div>
      </section>
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

      {duplicateWarningOpen ? (
        <div className="duplicate-modal-backdrop">
          <div className="duplicate-modal">
            <h3>Possible duplicate found</h3>
            <p className="poll-blurb">
              We found similar polls. You can open them first, or submit anyway for manual review.
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
