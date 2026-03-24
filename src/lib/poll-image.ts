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
  world: "/poll-icons/world.svg"
} as const;

const LOGO_RULES: ImageRule[] = [
  {
    keywords: ["premier league", "top scorer", "var"],
    imageUrl: favicon("https://www.premierleague.com")
  },
  {
    keywords: ["champions league", "uefa"],
    imageUrl: favicon("https://www.uefa.com")
  },
  {
    keywords: ["formula 1", "f1", "grand prix", "sprint weekend"],
    imageUrl: favicon("https://www.formula1.com")
  },
  {
    keywords: ["bank of england", "rates", "inflation"],
    imageUrl: favicon("https://www.bankofengland.co.uk")
  },
  {
    keywords: ["oscar", "academy awards"],
    imageUrl: favicon("https://www.oscars.org")
  },
  {
    keywords: ["parliament", "uk election", "referendum", "voting age", "mps"],
    imageUrl: favicon("https://www.parliament.uk")
  }
];

const PHOTO_RULES: ImageRule[] = [
  {
    keywords: ["movie", "film", "release", "streaming", "cinema"],
    imageUrl: LOCAL_ICONS.entertainment
  },
  {
    keywords: ["ai", "artificial intelligence", "technology", "tech", "software", "chip", "robot", "cloud", "app"],
    imageUrl: LOCAL_ICONS.world
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
  technology: LOCAL_ICONS.world,
  // Legacy categories kept for backward compatibility with older seeded rows.
  culture: LOCAL_ICONS.world,
  "hot-takes": LOCAL_ICONS.economy
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
