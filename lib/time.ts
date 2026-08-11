import { useEffect, useState } from "react";

// Ticks once a minute so anything displaying data age stays accurate for as
// long as the component stays mounted, even without a refetch.
export const useNowTicking = (intervalMs: number = 60 * 1000): Date => {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(interval);
  }, [intervalMs]);
  return now;
};

export const formatDataAge = (latestTs: number, now: Date): string => {
  const ageMinutes = Math.round((now.getTime() - latestTs) / (60 * 1000));
  if (ageMinutes < 1) return "just now";
  if (ageMinutes < 60) return `${ageMinutes} min ago`;
  const hours = Math.floor(ageMinutes / 60);
  const minutes = ageMinutes % 60;
  if (hours < 24) {
    const duration = minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
    return `${duration} ago`;
  }
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  const duration = remHours === 0 ? `${days}d` : `${days}d ${remHours}h`;
  return `${duration} ago`;
};

// Helper function to format a relative time string.
export const getRelativeTimeString = (
  date: string | Date | undefined
): string => {
  if (!date) return "";
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const diffMs = Date.now() - dateObj.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "just now";
  if (diffMins === 1) return "1 minute ago";
  if (diffMins < 60) return `${diffMins} minutes ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24)
    return diffHours === 1 ? "1 hour ago" : `${diffHours} hours ago`;

  const diffDays = Math.floor(diffHours / 24);
  return diffDays === 1 ? "1 day ago" : `${diffDays} days ago`;
};

// Current time in Europe/London as "HH:MM", regardless of the runtime's local timezone.
export const getLondonHHMM = (date: Date = new Date()): string =>
  date.toLocaleTimeString("en-GB", {
    timeZone: "Europe/London",
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  });

// Current hour (0-23) in Europe/London, regardless of the runtime's local timezone.
export const getLondonHour = (date: Date = new Date()): number =>
  parseInt(
    date.toLocaleTimeString("en-GB", {
      timeZone: "Europe/London",
      hour12: false,
      hour: "2-digit",
    }),
    10
  );

// Extracts "HH:MM" from an ISO timestamp string, e.g. for sunrise/sunset fields.
export const hhmmOfISO = (iso: string): string | null =>
  iso.split("T")[1]?.slice(0, 5) ?? null;
