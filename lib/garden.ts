export const flowers = [
  {
    id: "moonbell",
    name: "Bluebell",
    latin: "Hyacinthoides",
    color: "#a8c9ef",
    tile: 0,
    description: "Woodland bells in soft blue",
  },
  {
    id: "starlily",
    name: "Stargazer lily",
    latin: "Lilium orientalis",
    color: "#eab0d8",
    tile: 1,
    description: "Fragrant, speckled pink petals",
  },
  {
    id: "sunsprig",
    name: "Golden dahlia",
    latin: "Dahlia pinnata",
    color: "#e7c687",
    tile: 2,
    description: "Intricate layers of warm gold",
  },
  {
    id: "rose",
    name: "English rose",
    latin: "Rosa",
    color: "#e6bdca",
    tile: 3,
    description: "Soft blush, slowly unfolding",
  },
  {
    id: "peony",
    name: "Peony",
    latin: "Paeonia",
    color: "#d993b2",
    tile: 4,
    description: "A generous ruffle of pink",
  },
  {
    id: "lavender",
    name: "Lavender",
    latin: "Lavandula",
    color: "#b5a4dd",
    tile: 5,
    description: "Silver leaves and violet spires",
  },
  {
    id: "iris",
    name: "Bearded iris",
    latin: "Iris germanica",
    color: "#a59ad6",
    tile: 6,
    description: "Sculptural petals in royal violet",
  },
  {
    id: "foxglove",
    name: "Foxglove",
    latin: "Digitalis purpurea",
    color: "#cba4c7",
    tile: 7,
    description: "Tall towers of dusky bells",
  },
  {
    id: "tulip",
    name: "Apricot tulip",
    latin: "Tulipa",
    color: "#e6c5aa",
    tile: 8,
    description: "Elegant cups in peach and cream",
  },
] as const;
export type FlowerKind = (typeof flowers)[number]["id"];
export type GardenPlant = {
  id: string;
  kind: FlowerKind;
  note: number;
  x: number;
  y: number;
  size: number;
};
export type Garden = {
  version: 3;
  name: string;
  plants: GardenPlant[];
  tempo: number;
};
export const notes = [
  { name: "C", frequency: 261.63 },
  { name: "D", frequency: 293.66 },
  { name: "E", frequency: 329.63 },
  { name: "G", frequency: 392 },
  { name: "A", frequency: 440 },
  { name: "C↑", frequency: 523.25 },
  { name: "D↑", frequency: 587.33 },
  { name: "E↑", frequency: 659.25 },
];
export function readGarden(value: unknown): Garden | null {
  const g = value as Garden & {
    blooms?: ({ kind: FlowerKind; note: number } | null)[];
  };
  if (
    !g ||
    typeof g.name !== "string" ||
    g.name.length > 80 ||
    !Number.isFinite(g.tempo) ||
    g.tempo < 50 ||
    g.tempo > 140
  )
    return null;
  if (Array.isArray(g.plants)) {
    if (
      g.plants.length > 200 ||
      !g.plants.every(
        (p) =>
          p &&
          typeof p.id === "string" &&
          flowers.some((f) => f.id === p.kind) &&
          Number.isInteger(p.note) &&
          p.note >= 0 &&
          p.note < 8 &&
          Number.isFinite(p.x) &&
          p.x >= 2 &&
          p.x <= 98 &&
          Number.isFinite(p.y) &&
          p.y >= 8 &&
          p.y <= 94 &&
          Number.isFinite(p.size) &&
          p.size >= 0.4 &&
          p.size <= 2.2,
      ) ||
      new Set(g.plants.map((p) => p.id)).size !== g.plants.length
    )
      return null;
    return { version: 3, name: g.name, tempo: g.tempo, plants: g.plants };
  }
  if (
    !Array.isArray(g.blooms) ||
    ![8, 24].includes(g.blooms.length) ||
    !g.blooms.every(
      (b) =>
        b === null ||
        (b &&
          flowers.some((f) => f.id === b.kind) &&
          Number.isInteger(b.note) &&
          b.note >= 0 &&
          b.note < 8),
    )
  )
    return null;
  return {
    version: 3,
    name: g.name,
    tempo: g.tempo,
    plants: g.blooms.flatMap((b, i) =>
      b
        ? [
            {
              id: `earlier-${i}`,
              kind: b.kind,
              note: b.note,
              x: 12 + (i % 6) * 15,
              y: 72 + Math.floor(i / 6) * 5,
              size: 0.8 + Math.floor(i / 6) * 0.06,
            },
          ]
        : [],
    ),
  };
}
export const initialGarden: Garden = {
  version: 3,
  name: "The garden after dusk",
  tempo: 76,
  plants: [
    { id: "rose-1", kind: "rose", note: 0, x: 19, y: 76, size: 0.9 },
    { id: "lavender-1", kind: "lavender", note: 2, x: 31, y: 81, size: 0.8 },
    { id: "peony-1", kind: "peony", note: 4, x: 63, y: 77, size: 0.9 },
    { id: "iris-1", kind: "iris", note: 5, x: 78, y: 84, size: 0.85 },
  ],
};
