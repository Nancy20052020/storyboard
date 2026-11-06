const paths: Record<string, string> = {
  aries:
    "M16 27V11C16 1 3 2 4 12c0 3 2 5 5 5M16 11C16 1 29 2 28 12c0 3-2 5-5 5",
  taurus: "M5 4c0 9 22 9 22 0M24 21a8 8 0 1 1-16 0 8 8 0 0 1 16 0",
  gemini: "M8 5c4 2 12 2 16 0M8 27c4-2 12-2 16 0M11 7v18M21 7v18",
  cancer:
    "M7 12c3-8 16-9 21-4M25 20C22 28 9 29 4 24M12 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0M28 20a4 4 0 1 1-8 0 4 4 0 0 1 8 0",
  leo: "M11 22a4 4 0 1 1-8 0 4 4 0 0 1 8 0M10 19C-2-2 29 0 20 15c-4 8-3 13 3 13 3 0 5-3 5-5",
  virgo:
    "M3 7v18M3 12c2-8 7-8 7 0v13M10 12c2-8 7-8 7 0v13M17 12c2-8 7-8 7 0v7c0 6-5 10-9 8M20 10c11-3 10 13 0 13",
  libra: "M4 26h24M4 19h7c-7-10 17-10 10 0h7",
  scorpius:
    "M3 7v18M3 12c2-8 7-8 7 0v13M10 12c2-8 7-8 7 0v10c0 5 7 6 11 1M23 22h6v6",
  sagittarius: "M5 27 27 5M15 5h12v12M7 14l11 11",
  capricornus: "M3 7l6 18V12c0-8 7-8 7 0v11c0 8 13 8 13 0 0-7-10-9-13 0",
  aquarius: "M3 11l5-4 5 4 5-4 5 4 6-4M3 23l5-4 5 4 5-4 5 4 6-4",
  pisces: "M7 3c9 6 9 20 0 26M25 3c-9 6-9 20 0 26M4 16h24",
  orion: "M7 4l8 11 12-9M15 15l-4 12 16-3-8-9M11 15h8",
  cassiopeia: "M2 7l7 19 7-13 7 13 7-22",
  "ursa-major": "M2 6l7 3 7 8 6-2 8-1-1 13-11-2-2-8",
  cygnus: "M16 2v28M3 20l26-9",
};
export default function ZodiacGlyph({ id }: { id: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="zodiac-glyph"
    >
      <path d={paths[id] || paths.orion} />
    </svg>
  );
}
