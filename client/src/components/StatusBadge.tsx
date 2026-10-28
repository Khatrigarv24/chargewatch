import type { ChargerStatus } from "../api";

const LABEL: Record<ChargerStatus, string> = {
  available: "available",
  charging: "charging",
  faulted: "faulted",
  offline: "offline",
};

const TEXT: Record<ChargerStatus, string> = {
  available: "text-status-available",
  charging: "text-ground",
  faulted: "text-status-faulted",
  offline: "text-status-offline",
};

const DOT: Record<ChargerStatus, string> = {
  available: "bg-status-available",
  charging: "bg-ground",
  faulted: "bg-status-faulted",
  offline: "bg-status-offline",
};

export default function StatusBadge({ status }: { status: ChargerStatus }) {
  // Only "charging" gets a filled, moving badge -- it's the one state that
  // actually has current flowing right now. Everything else stays quiet:
  // a dot and text, no fill, nothing animating.
  if (status === "charging") {
    return (
      <span
        className={`charge-flow inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-sm font-medium ${TEXT[status]}`}
      >
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${DOT[status]}`} aria-hidden="true" />
        {LABEL[status]}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 text-sm ${TEXT[status]}`}>
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${DOT[status]}`} aria-hidden="true" />
      {LABEL[status]}
    </span>
  );
}
