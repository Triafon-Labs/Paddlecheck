import { useEffect, useRef } from "react";
import { Status } from "@/types";

const STATUS_EMOJIS: Record<Status, string> = {
  "Light Green": "✅",
  "Dark Green": "📈",
  Amber: "⚠️",
  Red: "🚨",
  "No Paddling": "⛔",
  Unknown: "🤷",
};

export const useNotifications = (
  status: Status | undefined,
  riverLevel: number | undefined
) => {
  const prevStatusRef = useRef<Status | undefined>(undefined);

  useEffect(() => {
    if (!status) return;
    if (typeof window === "undefined") return;
    if (!("Notification" in window)) return;

    const notificationsEnabled =
      localStorage.getItem("notificationsEnabled") === "true";
    if (!notificationsEnabled) return;
    if (Notification.permission !== "granted") return;

    const prev = prevStatusRef.current;
    prevStatusRef.current = status;

    // Don't notify on first load, only on change
    if (prev === undefined || prev === status) return;

    const emoji = STATUS_EMOJIS[status] ?? "";
    const levelText =
      riverLevel !== undefined ? ` — 🛶 River: ${riverLevel.toFixed(2)}m` : "";
    new Notification(`${emoji} Paddlecheck`, {
      body: `Status changed to ${status}${levelText}`,
      icon: "/web-app-manifest-192x192.png",
    });
  }, [status, riverLevel]);
};
