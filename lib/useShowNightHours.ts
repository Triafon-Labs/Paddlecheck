"use client";

import { useCallback, useEffect, useState } from "react";
import { STORAGE_KEYS, SETTINGS_CHANGED_EVENT } from "./storageKeys";

const read = () =>
  typeof window !== "undefined" &&
  localStorage.getItem(STORAGE_KEYS.FORECAST_SHOW_NIGHT) === "true";

// Whether the forecast chart shows night hours, shared between the Settings
// switch and the chart, which need to agree without a reload. Off by
// default: darkness alone pushes every night hour up a step, so for
// planning a paddle they're mostly noise.
export const useShowNightHours = (): [boolean, (show: boolean) => void] => {
  const [show, setShow] = useState(read);

  useEffect(() => {
    const handler = () => setShow(read());
    window.addEventListener(SETTINGS_CHANGED_EVENT, handler);
    return () => window.removeEventListener(SETTINGS_CHANGED_EVENT, handler);
  }, []);

  const update = useCallback((next: boolean) => {
    localStorage.setItem(STORAGE_KEYS.FORECAST_SHOW_NIGHT, String(next));
    setShow(next);
    window.dispatchEvent(new Event(SETTINGS_CHANGED_EVENT));
  }, []);

  return [show, update];
};
