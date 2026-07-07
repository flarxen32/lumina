import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lumina — Revenue Intelligence",
  description: "Turn raw financial data into living, breathing revenue intelligence.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
