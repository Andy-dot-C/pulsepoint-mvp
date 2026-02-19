export type PollStatus = {
  key: "open" | "closing-soon" | "closed";
  label: "Open" | "Closing soon" | "Closed";
  isClosed: boolean;
  isClosingSoon: boolean;
};

const CLOSE_SOON_HOURS = 24;

export function getPollStatus(endsAt?: string): PollStatus {
  if (!endsAt) {
    return {
      key: "open",
      label: "Open",
      isClosed: false,
      isClosingSoon: false
    };
  }

  const endMs = Date.parse(endsAt);
  if (Number.isNaN(endMs)) {
    return {
      key: "open",
      label: "Open",
      isClosed: false,
      isClosingSoon: false
    };
  }

  const nowMs = Date.now();
  if (endMs <= nowMs) {
    return {
      key: "closed",
      label: "Closed",
      isClosed: true,
      isClosingSoon: false
    };
  }

  if (endMs - nowMs <= CLOSE_SOON_HOURS * 60 * 60 * 1000) {
    return {
      key: "closing-soon",
      label: "Closing soon",
      isClosed: false,
      isClosingSoon: true
    };
  }

  return {
    key: "open",
    label: "Open",
    isClosed: false,
    isClosingSoon: false
  };
}
