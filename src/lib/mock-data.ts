import { Category, FeedTab, Poll } from "@/lib/types";

export const categories: Category[] = [
  { key: "politics", label: "Politics" },
  { key: "sport", label: "Sport" },
  { key: "entertainment", label: "Entertainment" },
  { key: "culture", label: "Culture" },
  { key: "hot-takes", label: "Hot Takes" }
];

export const feedTabs: FeedTab[] = [
  { key: "trending", label: "Trending" },
  { key: "new", label: "New" },
  { key: "most-voted", label: "Most Voted" }
];

export const polls: Poll[] = [
  {
    id: "poll-1",
    slug: "should-uk-lower-voting-age-to-16",
    title: "Should the UK lower the voting age to 16?",
    blurb: "A recurring Westminster topic with broad impact on turnout and civic education.",
    description:
      "Parliament periodically revisits voting age reform. This poll tracks how sentiment shifts as party leaders and MPs debate democratic participation for younger voters.",
    category: "politics",
    createdAt: "2026-02-15T08:10:00Z",
    endsAt: "2026-03-01T00:00:00Z",
    isTrending: true,
    options: [
      { id: "yes", label: "Yes", votes: 1241 },
      { id: "no", label: "No", votes: 971 }
    ],
    trend: [
      { label: "24h", totalVotes: 510, shares: { yes: 0.52, no: 0.48 } },
      { label: "7d", totalVotes: 1702, shares: { yes: 0.56, no: 0.44 } },
      { label: "30d", totalVotes: 2212, shares: { yes: 0.56, no: 0.44 } }
    ]
  },
  {
    id: "poll-2",
    slug: "who-should-win-best-actor-oscar",
    title: "Who should win Best Actor at the Oscars?",
    blurb: "Public sentiment before awards night can diverge sharply from critics and betting odds.",
    description:
      "This poll captures fan preference for this season's frontrunners and reveals whether general audiences align with academy narratives.",
    category: "entertainment",
    createdAt: "2026-02-16T09:00:00Z",
    isTrending: true,
    options: [
      { id: "candidate-a", label: "Candidate A", votes: 902 },
      { id: "candidate-b", label: "Candidate B", votes: 876 },
      { id: "candidate-c", label: "Candidate C", votes: 301 }
    ],
    trend: [
      {
        label: "24h",
        totalVotes: 610,
        shares: { "candidate-a": 0.45, "candidate-b": 0.42, "candidate-c": 0.13 }
      },
      {
        label: "7d",
        totalVotes: 1800,
        shares: { "candidate-a": 0.42, "candidate-b": 0.41, "candidate-c": 0.17 }
      },
      {
        label: "30d",
        totalVotes: 2079,
        shares: { "candidate-a": 0.43, "candidate-b": 0.42, "candidate-c": 0.15 }
      }
    ]
  },
  {
    id: "poll-3",
    slug: "greatest-premier-league-midfielder-ever",
    title: "Greatest Premier League midfielder of all time?",
    blurb: "Legacy debates drive high engagement and shares across football communities.",
    description:
      "A fan-driven ranking poll designed to benchmark generational sentiment. Ideal for repeat participation as new clips and debates trend.",
    category: "sport",
    createdAt: "2026-02-14T13:45:00Z",
    isTrending: false,
    options: [
      { id: "player-a", label: "Player A", votes: 2210 },
      { id: "player-b", label: "Player B", votes: 1844 },
      { id: "player-c", label: "Player C", votes: 930 }
    ],
    trend: [
      {
        label: "24h",
        totalVotes: 400,
        shares: { "player-a": 0.43, "player-b": 0.37, "player-c": 0.2 }
      },
      {
        label: "7d",
        totalVotes: 2810,
        shares: { "player-a": 0.44, "player-b": 0.37, "player-c": 0.19 }
      },
      {
        label: "30d",
        totalVotes: 4984,
        shares: { "player-a": 0.44, "player-b": 0.37, "player-c": 0.19 }
      }
    ]
  }
];

export function totalVotes(poll: Poll): number {
  return poll.options.reduce((sum, option) => sum + option.votes, 0);
}
