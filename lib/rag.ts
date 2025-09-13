import { KayakConditions, Status } from "@/types";

export const levelDescriptions: Record<number, string> = {
  1.0: "Able to launch from the landing stage – OK.",
  1.15: "Water over one end of the landing stage.",
  1.38: "10 cm over the landing stage; able to launch OK.",
  1.48: "On the concrete lower deck – wet feet!",
  1.52: "5 cm over the concrete lower deck; not deep enough – wet feet!",
  1.55: "Boat well below the concrete for easy access; water shallow nearby – wet feet.",
  1.68: "10 cm over the concrete lower deck; boat floats – dry feet.",
  2.0: "Bollards submerged; launch with care to avoid collisions.",
  2.12: "Halfway up steps; caution with rudders. Portage around the lock at Diglis.",
  2.75: "10th step level with water; concrete terrace slightly wet – wet feet possible.",
  4.28: "Almost on the car park – dry feet! Pitchcroft unlikely paddleable; monitor levels closely.",
  4.3: "Pitchcroft still unlikely paddleable; monitor levels closely.",
  4.37: "5 cm on the car park; not deep enough for boats – wet feet. Pitchcroft still unlikely paddleable.",
  4.4: "Water coming onto the WCC car park; Pitchcroft paddleable near the boathouse; avoid the far side.",
  4.49: "Water on the car park; safe to park only if falling. Variable paddling conditions on Pitchcroft depending on water flow.",
  4.62: "Plenty of water on Pitchcroft for paddling.",
  4.7: "Water just in the boathouse – Pitchcroft paddleable.",
  5.01: "Boathouse flooding. Pitchcroft paddleable, but shallow on the far side; watch for underwater posts.",
  5.02: "Deep water in the boathouse; boats can float out to the car park. Pitchcroft paddleable, but shallow on the far side; watch for underwater posts.",
  5.18: "Grand Stand Road flooded; unsafe to access the boathouse; water flowing back over the road adds risks.",
  5.54: "Sabrina Bridge closed; North Parade underwater; dangerous flows.",
  5.55: "Boathouse inaccessible; dangerous flow – paddling not advised.",
};

export const ragStatus: Record<Status, { color: string; emoji: string }> = {
  Unknown: { color: "#bdbdbd", emoji: "🤷" },
  "Light Green": { color: "#81c784", emoji: "✅" },
  "Dark Green": { color: "#388e3c", emoji: "✅" },
  Amber: { color: "#ff9800", emoji: "🔶" },
  Red: { color: "#f44336", emoji: "❌" },
  "No Paddling": { color: "#000000", emoji: "⛔" },
};

export const criteria: { [key in Status]?: (c: KayakConditions) => boolean } = {
  Red: (c) => {
    if (c.riverLevel && c.riverLevel >= 2.5) return true;
    if (c.windSpeed && c.windSpeed > 15) return true;
    return false;
  },
  Amber: (c) => {
    if (c.riverLevel && c.riverLevel >= 2.0) return true;
    if (c.windSpeed && c.windSpeed > 10) return true;
    if (c.rain) return true;
    if (c.dark) return true;
    return false;
  },
  "Dark Green": (c) => {
    if (c.riverLevel && c.riverLevel >= 1.5) return true;
    return false;
  },
  "Light Green": () => {
    return true; // Default if no other criteria met
  },
};

export const calculateInitialRag = (level: number): Status => {
  if (level < 1.0) return "Light Green";
  if (level < 1.4) return "Dark Green";
  if (level < 2.2) return "Amber";
  if (level < 5) return "Red";
  return "No Paddling";
};

export const calculateFinalRagStatus = (
  conditions: KayakConditions
): Status => {
  // Placeholder function - just returns the initial status for now
  return conditions.initialStatus || "Unknown";
};
