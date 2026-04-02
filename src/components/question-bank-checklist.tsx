"use client";

import { useEffect, useMemo, useState } from "react";

type QuestionBankChecklistProps = {
  lockedQuestions: string[];
  currentQuestions: string[];
  proposedQuestions: string[];
};

type QuestionItem = {
  id: string;
  text: string;
  group: "current" | "proposed";
};

const STORAGE_KEY = "question-bank-selection-v1";

function toStableId(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .trim()
    .replace(/\s+/g, "-");
}

export function QuestionBankChecklist({ lockedQuestions, currentQuestions, proposedQuestions }: QuestionBankChecklistProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const lockedItems = useMemo<QuestionItem[]>(
    () =>
      lockedQuestions.map((question) => ({
        id: `locked-${toStableId(question)}`,
        text: question,
        group: "current"
      })),
    [lockedQuestions]
  );

  const currentItems = useMemo<QuestionItem[]>(
    () =>
      currentQuestions
        .filter((question) => !lockedItems.some((locked) => locked.text.toLowerCase() === question.toLowerCase()))
        .map((question) => ({
          id: `current-${toStableId(question)}`,
          text: question,
          group: "current"
        })),
    [currentQuestions, lockedItems]
  );

  const proposedItems = useMemo<QuestionItem[]>(
    () =>
      proposedQuestions.map((question) => ({
        id: `proposed-${toStableId(question)}`,
        text: question,
        group: "proposed"
      })),
    [proposedQuestions]
  );

  const allItems = useMemo(() => [...lockedItems, ...currentItems, ...proposedItems], [lockedItems, currentItems, proposedItems]);
  const allIds = useMemo(() => allItems.map((item) => item.id), [allItems]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as string[];
      const valid = new Set(parsed.filter((id) => allIds.includes(id)));
      setSelectedIds(valid);
    } catch {
      setSelectedIds(new Set());
    }
  }, [allIds]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...selectedIds]));
  }, [selectedIds]);

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelectedIds(new Set(allIds));
  const clearAll = () => setSelectedIds(new Set());

  const selectedCurrent = [...lockedItems, ...currentItems].filter((item) => selectedIds.has(item.id)).length;
  const selectedProposed = proposedItems.filter((item) => selectedIds.has(item.id)).length;
  const selectedTotal = selectedIds.size;

  const copySelected = async () => {
    const selectedQuestions = allItems.filter((item) => selectedIds.has(item.id)).map((item) => item.text);
    if (selectedQuestions.length === 0) return;
    await navigator.clipboard.writeText(selectedQuestions.join("\n"));
  };

  return (
    <section className="question-bank-panel">
      <header className="question-bank-toolbar">
        <div>
          <h1>Question Bank</h1>
          <p>
            Current selected: {selectedTotal} ({selectedCurrent} current, {selectedProposed} new)
          </p>
        </div>
        <div className="question-bank-toolbar-actions">
          <button type="button" onClick={selectAll}>
            Select all
          </button>
          <button type="button" onClick={clearAll}>
            Clear all
          </button>
          <button type="button" onClick={copySelected}>
            Copy selected
          </button>
        </div>
      </header>

      <div className="question-bank-grid">
        <article className="question-bank-column">
          <h2>Locked Investor Picks ({lockedItems.length})</h2>
          <ul>
            {lockedItems.map((item) => (
              <li key={item.id}>
                <label>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(item.id)}
                    onChange={() => toggle(item.id)}
                  />
                  <span>{item.text}</span>
                </label>
              </li>
            ))}
          </ul>
        </article>

        <article className="question-bank-column">
          <h2>Current Questions ({currentItems.length})</h2>
          <ul>
            {currentItems.map((item) => (
              <li key={item.id}>
                <label>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(item.id)}
                    onChange={() => toggle(item.id)}
                  />
                  <span>{item.text}</span>
                </label>
              </li>
            ))}
          </ul>
        </article>

        <article className="question-bank-column">
          <h2>New Suggestions ({proposedItems.length})</h2>
          <ul>
            {proposedItems.map((item) => (
              <li key={item.id}>
                <label>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(item.id)}
                    onChange={() => toggle(item.id)}
                  />
                  <span>{item.text}</span>
                </label>
              </li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
}
