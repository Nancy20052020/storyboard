import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Starwoven — a little universe of your own",
  description:
    "Turn thoughts into stars. Connect your memories, wishes, and little wonders in a personal constellation journal.",
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
