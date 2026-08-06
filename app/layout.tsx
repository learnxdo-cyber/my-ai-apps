import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "My AI App",
  description: "A streaming AI chat app built with Next.js and Claude.",
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
