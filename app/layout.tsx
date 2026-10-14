import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "ClassRank · BA-28A0", description: "Academic analytics for Brother's Academy" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
