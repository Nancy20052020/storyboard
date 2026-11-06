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
export type Bloom = { kind: FlowerKind; note: number };
export type Garden = { name: string; blooms: (Bloom | null)[]; tempo: number };
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
  const g = value as Garden;
  if (
    !g ||
    typeof g.name !== "string" ||
    g.name.length > 80 ||
    !Number.isFinite(g.tempo) ||
    g.tempo < 50 ||
    g.tempo > 140 ||
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
    ...g,
    blooms: [...g.blooms, ...Array(24 - g.blooms.length).fill(null)],
  };
}
export const initialGarden: Garden = {
  name: "The garden after dusk",
  tempo: 76,
  blooms: Array.from(
    { length: 24 },
    (_, i) =>
      (
        ({
          1: { kind: "lavender", note: 0 },
          4: { kind: "foxglove", note: 2 },
          6: { kind: "iris", note: 4 },
          9: { kind: "rose", note: 5 },
          12: { kind: "peony", note: 2 },
          15: { kind: "moonbell", note: 0 },
          17: { kind: "tulip", note: 7 },
          20: { kind: "starlily", note: 4 },
          22: { kind: "sunsprig", note: 5 },
        }) as Record<number, Bloom>
      )[i] || null,
  ),
};
