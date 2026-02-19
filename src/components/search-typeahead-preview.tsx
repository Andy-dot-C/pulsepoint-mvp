"use client";

import { useMemo, useState } from "react";

type MockPoll = {
  title: string;
  category: string;
  votes30d: number;
  options: string[];
};

const MOCK_POLLS: MockPoll[] = [
  {
    title: "Who is the best singer right now?",
    category: "entertainment",
    votes30d: 9400,
    options: ["Taylor Swift", "Billie Eilish", "Adele", "The Weeknd"]
  },
  {
    title: "Who should win Best Actor at the Oscars?",
    category: "entertainment",
    votes30d: 8100,
    options: ["Cillian Murphy", "Paul Giamatti", "Bradley Cooper", "Colman Domingo"]
  },
  {
    title: "Who is the best footballer of all time?",
    category: "sport",
    votes30d: 15200,
    options: ["Lionel Messi", "Cristiano Ronaldo", "Pele", "Diego Maradona"]
  },
  {
    title: "Who is the most popular UK politician today?",
    category: "politics",
    votes30d: 6200,
    options: ["Keir Starmer", "Rishi Sunak", "Nigel Farage", "Barack Obama"]
  },
  {
    title: "Who should lead the Conservative Party next?",
    category: "politics",
    votes30d: 5100,
    options: ["Kemi Badenoch", "Priti Patel", "James Cleverly", "Robert Jenrick"]
  },
  {
    title: "Who is your favorite movie director?",
    category: "culture",
    votes30d: 2700,
    options: ["Christopher Nolan", "Greta Gerwig", "Steven Spielberg", "Denis Villeneuve"]
  }
];

const CATEGORY_SUGGESTIONS = ["Politics", "Sport", "Entertainment", "Culture", "Hot Takes"];
const FALLBACK_POLLS = [...MOCK_POLLS].sort((a, b) => b.votes30d - a.votes30d).slice(0, 6);
const FALLBACK_CATEGORIES = ["Politics", "Sport", "Entertainment", "Culture", "Hot Takes"];
const MIN_SUGGESTIONS = 5;

function scoreMatch(query: string, title: string): number {
  const q = query.toLowerCase().trim();
  const t = title.toLowerCase();
  if (!q) return 0;
  if (t === q) return 100;
  if (t.startsWith(q)) return 80;
  if (t.includes(q)) return 50;
  return 0;
}

function scoreOptionMatch(query: string, options: string[]): number {
  const q = query.toLowerCase().trim();
  if (!q) return 0;
  let best = 0;
  for (const option of options) {
    const value = option.toLowerCase();
    if (value === q) {
      best = Math.max(best, 120);
      continue;
    }
    if (value.startsWith(q)) {
      best = Math.max(best, 95);
      continue;
    }
    if (value.includes(q)) {
      best = Math.max(best, 70);
    }
  }
  return best;
}

function scoreCategoryMatch(query: string, category: string): number {
  const q = query.toLowerCase().trim();
  const c = category.toLowerCase();
  if (!q) return 0;
  if (c === q) return 100;
  if (c.startsWith(q)) return 80;
  if (c.includes(q)) return 50;
  return 0;
}

export function SearchTypeaheadPreview() {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);

  const showDropdown = focused && query.trim().length > 0;
  const normalizedQuery = query.trim().toLowerCase();

  const results = useMemo(() => {
    if (!query.trim()) return [];
    return MOCK_POLLS.map((poll) => {
      const titleScore = scoreMatch(query, poll.title);
      const optionScore = scoreOptionMatch(query, poll.options);
      return { poll, score: Math.max(titleScore, optionScore), titleScore, optionScore };
    })
      .filter((item) => item.score > 0)
      .sort(
        (left, right) =>
          right.score - left.score ||
          right.optionScore - left.optionScore ||
          right.poll.votes30d - left.poll.votes30d
      )
      .slice(0, 6);
  }, [query]);

  const categoryResults = useMemo(
    () =>
      CATEGORY_SUGGESTIONS.map((category) => ({
        category,
        score: scoreCategoryMatch(normalizedQuery, category)
      }))
        .filter((item) => item.score > 0)
        .sort((left, right) => right.score - left.score || left.category.localeCompare(right.category))
        .slice(0, 6),
    [normalizedQuery]
  );

  const pollSuggestions = useMemo(() => {
    const direct = results.map((item) => ({ poll: item.poll, score: item.score }));
    const usedTitles = new Set(direct.map((item) => item.poll.title));
    const filled = [...direct];

    for (const poll of FALLBACK_POLLS) {
      if (filled.length >= MIN_SUGGESTIONS) break;
      if (usedTitles.has(poll.title)) continue;
      filled.push({ poll, score: 0 });
      usedTitles.add(poll.title);
    }

    return filled.slice(0, Math.max(MIN_SUGGESTIONS, 6));
  }, [results]);

  const categorySuggestions = useMemo(() => {
    const direct = [...categoryResults];
    const used = new Set(direct.map((item) => item.category));
    const filled = [...direct];

    for (const category of FALLBACK_CATEGORIES) {
      if (filled.length >= MIN_SUGGESTIONS) break;
      if (used.has(category)) continue;
      filled.push({ category, score: 0 });
      used.add(category);
    }

    return filled.slice(0, MIN_SUGGESTIONS);
  }, [categoryResults]);

  return (
    <main className="page-shell">
      <article className="detail-card">
        <h1>Search Typeahead Preview</h1>
        <p className="poll-blurb">Mock only. This is for UI/UX approval before wiring live search data.</p>

        <div className="preview-search-wrap">
          <label className="eyebrow" htmlFor="preview-search-input">
            Search polls
          </label>
          <div className="preview-search-shell">
            <input
              id="preview-search-input"
              className="search-input"
              placeholder='Try typing "who is" or "uk"...'
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => window.setTimeout(() => setFocused(false), 120)}
            />

            {showDropdown ? (
              <section className="preview-typeahead-panel">
                {results.length === 0 ? (
                  <p className="poll-blurb">No exact poll match. Showing related/trending polls.</p>
                ) : null}
                <div className="preview-typeahead-list">
                  {pollSuggestions.map((item) => (
                    <button key={item.poll.title} type="button" className="preview-typeahead-item">
                      <span>{item.poll.title}</span>
                      <small>
                        {item.poll.category} • {item.poll.votes30d.toLocaleString()} votes (30d)
                      </small>
                      <small>Options: {item.poll.options.slice(0, 3).join(", ")}</small>
                    </button>
                  ))}
                </div>

                <div className="preview-category-strip">
                  <p className="eyebrow">Browse categories</p>
                  {categoryResults.length === 0 ? <p className="poll-blurb">No exact category match. Showing top categories.</p> : null}
                  <div className="category-row">
                    {categorySuggestions.map((item) => (
                      <button
                        key={item.category}
                        type="button"
                        className={`category ${item.score > 0 ? "category-active" : ""}`}
                      >
                        {item.category}
                      </button>
                    ))}
                  </div>
                </div>
              </section>
            ) : null}
          </div>
        </div>
      </article>
    </main>
  );
}
