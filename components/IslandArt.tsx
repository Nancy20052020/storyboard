export type IslandKind =
  "sky" | "forest" | "lake" | "garden" | "letters" | "study";
export default function IslandArt({ kind }: { kind: IslandKind }) {
  return (
    <span className={`island-art mystical-art art-${kind}`} aria-hidden="true">
      <span className={`island-sprite sprite-${kind}`} />
    </span>
  );
}
