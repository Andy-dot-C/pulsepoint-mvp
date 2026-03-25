import { Poll } from "@/lib/types";

type ImageRule = {
  keywords: string[];
  imageUrl: string;
};

function favicon(domainUrl: string): string {
  return `https://www.google.com/s2/favicons?sz=128&domain_url=${encodeURIComponent(domainUrl)}`;
}

const LOCAL_ICONS = {
  politics: "/poll-icons/politics.svg",
  economy: "/poll-icons/economy.svg",
  sport: "/poll-icons/sport.svg",
  entertainment: "/poll-icons/entertainment.svg",
  world: "/poll-icons/world.svg",
  culture: "/poll-icons/culture.svg",
  hotTakes: "/poll-icons/hot-takes.svg",
  ukFlag: "/poll-icons/uk-flag.svg",
  usFlag: "/poll-icons/us-flag.svg",
  ai: "/poll-icons/ai.svg",
  social: "/poll-icons/social.svg"
} as const;

const LOGO_RULES: ImageRule[] = [
  {
    keywords: ["premier league", "top scorer", "var"],
    imageUrl: favicon("https://www.premierleague.com")
  },
  {
    keywords: ["champions league", "uefa"],
    imageUrl: favicon("https://www.uefa.com/uefachampionsleague/")
  },
  {
    keywords: ["formula 1", "f1", "grand prix", "sprint weekend"],
    imageUrl: favicon("https://www.formula1.com")
  },
  {
    keywords: ["bank of england", "rates", "inflation"],
    imageUrl: LOCAL_ICONS.economy
  },
  {
    keywords: ["oscar", "academy awards"],
    imageUrl: favicon("https://www.oscars.org")
  },
  {
    keywords: [
      " uk ",
      " u.k. ",
      "britain",
      "british",
      "england",
      "scotland",
      "wales",
      "northern ireland",
      "westminster",
      "house of commons",
      "house of lords",
      "mps",
      "labour",
      "tory"
    ],
    imageUrl: LOCAL_ICONS.ukFlag
  },
  {
    keywords: [
      " us ",
      " u.s. ",
      "usa",
      "u.s.a.",
      "united states",
      "american",
      "america",
      "congress",
      "senate",
      "house of representatives",
      "white house",
      "biden",
      "trump",
      "republican",
      "democrat"
    ],
    imageUrl: LOCAL_ICONS.usFlag
  },
  {
    keywords: ["parliament", "uk election", "referendum", "voting age", "mps"],
    imageUrl: LOCAL_ICONS.ukFlag
  }
];

const PHOTO_RULES: ImageRule[] = [
  {
    keywords: ["immigration", "asylum", "border", "deport", "migrant"],
    imageUrl: LOCAL_ICONS.culture
  },
  {
    keywords: ["tariff", "trade war", "trade", "consumer prices", "cost of living"],
    imageUrl: LOCAL_ICONS.economy
  },
  {
    keywords: ["assisted dying", "terminally ill", "euthanasia"],
    imageUrl: LOCAL_ICONS.hotTakes
  },
  {
    keywords: ["social media", "under-16", "under 16", "online safety", "platform"],
    imageUrl: LOCAL_ICONS.social
  },
  {
    keywords: ["ceasefire", "military", "security surges", "emergency powers", "conflict"],
    imageUrl: LOCAL_ICONS.world
  },
  {
    keywords: ["legal immigration", "visa", "citizenship", "increased, reduced, or kept the same"],
    imageUrl: LOCAL_ICONS.politics
  },
  {
    keywords: ["movie", "film", "release", "streaming", "cinema"],
    imageUrl: LOCAL_ICONS.entertainment
  },
  {
    keywords: ["ai", "artificial intelligence", "technology", "tech", "software", "chip", "robot", "cloud", "app"],
    imageUrl: LOCAL_ICONS.ai
  },
  {
    keywords: ["high streets", "cities", "pedestrianise"],
    imageUrl: LOCAL_ICONS.world
  },
  {
    keywords: ["rail", "commuter"],
    imageUrl: LOCAL_ICONS.world
  },
  {
    keywords: ["work week", "tuition", "graduate tax", "economy"],
    imageUrl: LOCAL_ICONS.economy
  },
  {
    keywords: ["football", "arsenal", "real madrid", "bayern", "inter"],
    imageUrl: LOCAL_ICONS.sport
  }
];

const CATEGORY_FALLBACKS: Record<string, string> = {
  politics: LOCAL_ICONS.politics,
  sport: LOCAL_ICONS.sport,
  entertainment: LOCAL_ICONS.entertainment,
  business: LOCAL_ICONS.economy,
  technology: LOCAL_ICONS.ai,
  // Legacy categories kept for backward compatibility with older seeded rows.
  culture: LOCAL_ICONS.culture,
  "hot-takes": LOCAL_ICONS.hotTakes
};

function matchRule(haystack: string, rules: ImageRule[]): string | null {
  for (const rule of rules) {
    if (rule.keywords.some((keyword) => haystack.includes(keyword))) {
      return rule.imageUrl;
    }
  }
  return null;
}

export function pollIconImageUrl(poll: Poll): string {
  const haystack = `${poll.title} ${poll.options.map((option) => option.label).join(" ")}`
    .toLowerCase()
    .replace(/\s+/g, " ");

  return (
    matchRule(haystack, LOGO_RULES) ??
    matchRule(haystack, PHOTO_RULES) ??
    CATEGORY_FALLBACKS[poll.category] ??
    LOCAL_ICONS.world
  );
}
