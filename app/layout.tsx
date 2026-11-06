import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Starwoven — a little universe of your own",
  description:
    "Four mystical floating islands and a little moon bunny. Explore zodiac constellations, draw with hand gestures, float lantern thoughts, and grow a musical flower garden.",
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
