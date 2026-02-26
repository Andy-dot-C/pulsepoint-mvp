export type PollColorTheme = {
  primary: string;
  secondary: string;
  optionFill: readonly [string, string, string, string];
};

export const POLL_COLOR_THEMES: readonly PollColorTheme[] = [
  {
    primary: "#1E3A8A",
    secondary: "#93C5FD",
    optionFill: ["#DBEAFE", "#BFDBFE", "#E2E8F0", "#E5E7EB"]
  },
  {
    primary: "#14532D",
    secondary: "#A7F3D0",
    optionFill: ["#DCFCE7", "#A7F3D0", "#E2E8F0", "#E5E7EB"]
  },
  {
    primary: "#0F766E",
    secondary: "#FDE68A",
    optionFill: ["#CCFBF1", "#FEF9C3", "#E2E8F0", "#E5E7EB"]
  },
  {
    primary: "#14B8A6",
    secondary: "#6366F1",
    optionFill: ["#CCFBF1", "#E0E7FF", "#E2E8F0", "#E5E7EB"]
  },
  {
    primary: "#3B82F6",
    secondary: "#22C55E",
    optionFill: ["#DBEAFE", "#DCFCE7", "#E2E8F0", "#E5E7EB"]
  },
  {
    primary: "#F43F5E",
    secondary: "#10B981",
    optionFill: ["#FFE4E6", "#D1FAE5", "#E2E8F0", "#E5E7EB"]
  }
];

export const YES_NO_COLOR_THEME: PollColorTheme = {
  primary: "#3B82F6",
  secondary: "#22C55E",
  optionFill: ["#DBEAFE", "#DCFCE7", "#E2E8F0", "#E5E7EB"]
};

export function getPollColorTheme(seed: string): PollColorTheme {
  void seed;
  return YES_NO_COLOR_THEME;
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
  if (optionIndex === 0) return theme.primary;
  if (optionIndex === 1) return theme.secondary;
  return "#94a3b8";
}
