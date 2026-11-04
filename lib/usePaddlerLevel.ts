"use client";

import { useEffect, useState } from "react";
import { PaddlerType } from "@/types";
import { STORAGE_KEYS, PADDLER_LEVEL_CHANGED_EVENT } from "./storageKeys";
import { toPaddlerLevel } from "./paddlingMatrix";

const read = () =>
  toPaddlerLevel(localStorage.getItem(STORAGE_KEYS.PADDLER_LEVEL));

// The paddler level chosen in Settings, kept in step with changes made there
// (the in-tab event) and in other tabs (the "storage" event, which only fires
// in *other* tabs per spec). `undefined` until it has been read: localStorage
// isn't available during server rendering, so it is read after mount rather
// than in the initial state, which would differ between server and client.
export const usePaddlerLevel = (): PaddlerType | null | undefined => {
  const [level, setLevel] = useState<PaddlerType | null | undefined>(undefined);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLevel(read());
    const handleLevelChanged = () => setLevel(read());
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === STORAGE_KEYS.PADDLER_LEVEL) {
        setLevel(toPaddlerLevel(event.newValue));
      }
    };
    window.addEventListener(PADDLER_LEVEL_CHANGED_EVENT, handleLevelChanged);
    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener(
        PADDLER_LEVEL_CHANGED_EVENT,
        handleLevelChanged
      );
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  return level;
};
