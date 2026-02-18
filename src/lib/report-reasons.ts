export const REPORT_REASONS = [
  { value: "duplicate", label: "Duplicate poll" },
  { value: "factual_error", label: "Factual error" },
  { value: "misleading", label: "Misleading wording" },
  { value: "abuse_or_hate", label: "Abusive or hateful" },
  { value: "off_topic", label: "Off-topic category" },
  { value: "other", label: "Other" }
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number]["value"];

export function isReportReason(value: string): value is ReportReason {
  return REPORT_REASONS.some((reason) => reason.value === value);
}

