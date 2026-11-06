export const photoTemplates = [
  { id: "strip", name: "Moonlit strip", description: "A ribbon of moments" },
  {
    id: "polaroid",
    name: "Instant memories",
    description: "Soft square keepsakes",
  },
  {
    id: "botanical",
    name: "Herbarium",
    description: "Pressed petals & parchment",
  },
  {
    id: "postcard",
    name: "Celestial postcard",
    description: "A little hello from here",
  },
] as const;
export type PhotoTemplate = (typeof photoTemplates)[number]["id"];
export type PhotoTheme = "moon" | "rose" | "aurora";
export type PhotoSticker = {
  id: string;
  glyph: string;
  name: string;
  x: number;
  y: number;
  size: number;
  rotation: number;
};
export const stickerChoices = [
  { glyph: "✧", name: "Starlight" },
  { glyph: "☾", name: "Crescent moon" },
  { glyph: "♡", name: "Little heart" },
  { glyph: "❦", name: "Botanical flourish" },
  { glyph: "✿", name: "Pressed blossom" },
  { glyph: "✶", name: "Sun charm" },
];
export const photoFilters: Record<PhotoTheme, string> = {
  moon: "grayscale(.65) contrast(.92) brightness(1.08)",
  rose: "sepia(.22) saturate(.82) brightness(1.05)",
  aurora: "hue-rotate(18deg) saturate(.75) contrast(.94)",
};
export function photoLayout(template: PhotoTemplate, count: number) {
  const n = Math.max(1, Math.min(3, count));
  if (template === "polaroid")
    return {
      width: n * 430 + 40,
      height: 620,
      frames: Array.from({ length: n }, (_, i) => ({
        x: 40 + i * 430,
        y: 40,
        w: 390,
        h: 420,
      })),
    };
  if (template === "botanical")
    return {
      width: 1000,
      height: 1000,
      frames:
        n === 1
          ? [{ x: 100, y: 115, w: 800, h: 690 }]
          : n === 2
            ? [
                { x: 100, y: 80, w: 800, h: 370 },
                { x: 100, y: 490, w: 800, h: 370 },
              ]
            : [
                { x: 100, y: 80, w: 800, h: 390 },
                { x: 100, y: 500, w: 380, h: 350 },
                { x: 520, y: 500, w: 380, h: 350 },
              ],
    };
  if (template === "postcard")
    return {
      width: 1100,
      height: 760,
      frames:
        n === 1
          ? [{ x: 50, y: 50, w: 1000, h: 570 }]
          : n === 2
            ? [
                { x: 50, y: 50, w: 485, h: 570 },
                { x: 565, y: 50, w: 485, h: 570 },
              ]
            : [
                { x: 50, y: 50, w: 650, h: 570 },
                { x: 730, y: 50, w: 320, h: 270 },
                { x: 730, y: 350, w: 320, h: 270 },
              ],
    };
  return {
    width: 540,
    height: n * 375 + 120,
    frames: Array.from({ length: n }, (_, i) => ({
      x: 30,
      y: 30 + i * 375,
      w: 480,
      h: 345,
    })),
  };
}
export async function renderKeepsake({
  shots,
  theme,
  template,
  caption,
  stickers,
  withStickers = true,
}: {
  shots: string[];
  theme: PhotoTheme;
  template: PhotoTemplate;
  caption: string;
  stickers: PhotoSticker[];
  withStickers?: boolean;
}) {
  const layout = photoLayout(template, shots.length),
    c = document.createElement("canvas");
  c.width = layout.width;
  c.height = layout.height;
  const ctx = c.getContext("2d")!;
  const paper =
      theme === "moon" ? "#e1e2e8" : theme === "rose" ? "#ead8d6" : "#d5e4de",
    ink = theme === "rose" ? "#956b78" : "#667d78";
  ctx.fillStyle = template === "botanical" ? "#e5dfcb" : paper;
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.strokeStyle = ink + "66";
  ctx.lineWidth = 2;
  ctx.strokeRect(15, 15, c.width - 30, c.height - 30);
  for (let i = 0; i < layout.frames.length; i++) {
    const f = layout.frames[i];
    ctx.fillStyle = "#b8c4be";
    ctx.fillRect(f.x, f.y, f.w, f.h);
    if (shots[i]) {
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = shots[i];
      });
      const ratio = Math.max(f.w / img.width, f.h / img.height);
      ctx.save();
      ctx.beginPath();
      ctx.rect(f.x, f.y, f.w, f.h);
      ctx.clip();
      ctx.filter = photoFilters[theme];
      ctx.drawImage(
        img,
        f.x + (f.w - img.width * ratio) / 2,
        f.y + (f.h - img.height * ratio) / 2,
        img.width * ratio,
        img.height * ratio,
      );
      ctx.restore();
    }
  }
  ctx.fillStyle = ink;
  ctx.textAlign = "center";
  ctx.font = `italic ${template === "strip" ? 20 : 27}px Georgia`;
  ctx.fillText(
    caption || "a moment, kept in moonlight",
    c.width / 2,
    c.height - 48,
    c.width - 80,
  );
  if (template === "botanical") {
    ctx.strokeStyle = "#7b8a65";
    ctx.lineWidth = 3;
    for (const side of [1, -1]) {
      const x = side === 1 ? 40 : c.width - 40;
      ctx.beginPath();
      ctx.moveTo(x, c.height - 130);
      ctx.quadraticCurveTo(x + side * 45, c.height / 2, x, c.height / 4);
      ctx.stroke();
      for (let j = 0; j < 7; j++) {
        const y = c.height - 170 - j * 85;
        ctx.beginPath();
        ctx.ellipse(x + side * 12, y, 9, 24, side * 0.7, 0, Math.PI * 2);
        ctx.fillStyle = "#8b987c88";
        ctx.fill();
      }
    }
  }
  if (template === "postcard") {
    ctx.strokeStyle = ink;
    ctx.strokeRect(c.width - 94, c.height - 112, 40, 48);
    ctx.font = "25px Georgia";
    ctx.fillStyle = ink;
    ctx.fillText("☾", c.width - 74, c.height - 78);
  }
  if (withStickers)
    for (const s of stickers) {
      ctx.save();
      ctx.translate((s.x / 100) * c.width, (s.y / 100) * c.height);
      ctx.rotate((s.rotation * Math.PI) / 180);
      ctx.fillStyle =
        template === "botanical"
          ? "#7a8059"
          : theme === "rose"
            ? "#995f78"
            : "#88744e";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `${(c.width * s.size) / 100}px Georgia`;
      ctx.shadowColor = "#54452630";
      ctx.shadowBlur = 3;
      ctx.fillText(s.glyph, 0, 0);
      ctx.restore();
    }
  return c;
}
