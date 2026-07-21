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
  const duration = minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
  return `${duration} ago`;
};
