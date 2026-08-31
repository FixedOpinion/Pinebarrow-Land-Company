import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://pinebarrow-land-company.fixedopinion.chatgpt.site"),
  title: "Pinebarrow Land Company",
  description:
    "Clear forest, prospect mineral land, build roads, and grow a mining company in a living arcade town.",
  openGraph: {
    title: "Pinebarrow Land Company",
    description: "Clear the forest. Build the road. Grow the town.",
    type: "website",
    url: "https://pinebarrow-land-company.fixedopinion.chatgpt.site",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Pinebarrow Land Company mining truck clearing a road toward town",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pinebarrow Land Company",
    description: "Clear the forest. Build the road. Grow the town.",
    images: ["/og.png"],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  other: {
    "codex-preview": "development",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
