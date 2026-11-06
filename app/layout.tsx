import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Starwoven — a little universe of your own",
  description:
    "A private world of floating islands. Write among the stars, draw with hand gestures in an enchanted forest, and set your thoughts afloat on a moonlit lake.",
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
