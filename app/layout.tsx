import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Starwoven — a little universe of your own",
  description:
    "An immersive world of four quiet islands. Explore a full-sky constellation atlas, draw into an enchanted forest, float lantern thoughts, and plant a realistic botanical music garden.",
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
