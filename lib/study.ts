export const studySpots = [
  {
    id: "cafe-window",
    name: "The rain window",
    venue: "Café",
    description: "A little table, a warm cup, and the world beyond the glass.",
    tile: 0,
    icon: "window",
  },
  {
    id: "cafe-table",
    name: "The shared oak table",
    venue: "Café",
    description:
      "Quiet company at the far end. Plenty of room for your thoughts.",
    tile: 1,
    icon: "table",
  },
  {
    id: "library-window",
    name: "The east alcove",
    venue: "Library",
    description: "Tall shelves, a brass lamp, and a window full of soft light.",
    tile: 2,
    icon: "books",
  },
  {
    id: "library-hearth",
    name: "Beside the hearth",
    venue: "Library",
    description: "A sheltered corner where the room feels like an exhale.",
    tile: 3,
    icon: "fire",
  },
] as const;
export type StudySpot = (typeof studySpots)[number]["id"];
export type StudyState = {
  spot: StudySpot | null;
  weather: "rain" | "sun" | "night";
  duration: number;
  endsAt: number | null;
  paused: number | null;
  intention: string;
  notes: string;
};
export const initialStudy: StudyState = {
  spot: null,
  weather: "rain",
  duration: 25,
  endsAt: null,
  paused: null,
  intention: "",
  notes: "",
};
export function readStudy(value: unknown): StudyState | null {
  const s = value as StudyState;
  return !!s &&
    (s.spot === null || studySpots.some((p) => p.id === s.spot)) &&
    ["rain", "sun", "night"].includes(s.weather) &&
    Number.isFinite(s.duration) &&
    s.duration >= 1 &&
    s.duration <= 180 &&
    (s.endsAt === null || Number.isFinite(s.endsAt)) &&
    (s.paused === null ||
      (Number.isFinite(s.paused) && s.paused >= 0 && s.paused <= 10800)) &&
    typeof s.intention === "string" &&
    s.intention.length <= 160 &&
    typeof s.notes === "string" &&
    s.notes.length <= 20000
    ? s
    : null;
}
