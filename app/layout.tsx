import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Starwoven — a little universe of your own",
  description:
    "Nancy’s calm spot: one real star sky to write in, a draggable celestial companion, an enchanted drawing forest, floating lanterns, a free-planting garden, a letter and photo atelier, and a quiet café-library for studying.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
