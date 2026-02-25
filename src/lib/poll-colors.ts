type PollColorTheme = {
  primary: string;
  secondary: string;
  optionFill: readonly [string, string, string, string];
};

const POLL_COLOR_THEMES: readonly PollColorTheme[] = [
  {
    primary: "#FF5B5B",
    secondary: "#3B82F6",
    optionFill: ["#FFD6D6", "#DBEAFE", "#E9D5FF", "#E5E7EB"]
  },
  {
    primary: "#14B8A6",
    secondary: "#6366F1",
    optionFill: ["#CCFBF1", "#E0E7FF", "#FDE68A", "#E5E7EB"]
  },
  {
    primary: "#22C55E",
    secondary: "#F59E0B",
    optionFill: ["#DCFCE7", "#FEF3C7", "#DBEAFE", "#E5E7EB"]
  },
  {
    primary: "#A855F7",
    secondary: "#06B6D4",
    optionFill: ["#F3E8FF", "#CFFAFE", "#FECACA", "#E5E7EB"]
  },
  {
    primary: "#EC4899",
    secondary: "#0EA5E9",
    optionFill: ["#FCE7F3", "#E0F2FE", "#EDE9FE", "#E5E7EB"]
  },
  {
    primary: "#F43F5E",
    secondary: "#10B981",
    optionFill: ["#FFE4E6", "#D1FAE5", "#FEF3C7", "#E5E7EB"]
  },
  {
    primary: "#3B82F6",
    secondary: "#22C55E",
    optionFill: ["#DBEAFE", "#DCFCE7", "#FCE7F3", "#E5E7EB"]
  },
  {
    primary: "#8B5CF6",
    secondary: "#F97316",
    optionFill: ["#EDE9FE", "#FFEDD5", "#D1FAE5", "#E5E7EB"]
  }
];

function hashSeed(seed: string): number {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }
  return hash;
}

export function getPollColorTheme(seed: string): PollColorTheme {
  const normalized = seed.trim();
  if (!normalized) return POLL_COLOR_THEMES[0];
  const index = hashSeed(normalized) % POLL_COLOR_THEMES.length;
  return POLL_COLOR_THEMES[index];
}

export function getPollOptionFillColor(seed: string, optionIndex: number): string {
  const theme = getPollColorTheme(seed);
  if (optionIndex <= 0) return theme.optionFill[0];
  if (optionIndex === 1) return theme.optionFill[1];
  if (optionIndex === 2) return theme.optionFill[2];
  return theme.optionFill[3];
}

export function getPollOptionLineColor(seed: string, optionIndex: number): string {
  const theme = getPollColorTheme(seed);
  if (optionIndex === 0) {
    return theme.primary;
  }
  return "#94a3b8";
}
