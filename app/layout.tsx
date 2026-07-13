import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // TODO(아진): 배포 후 metadataBase / openGraph.url 을 실제 배포 주소로 교체
  title: "MyWorld | AhJin Portfolio",
  description: "Next.js + Three.js로 구현한 3D 인터랙티브 포트폴리오. 여름 정원 속 방을 직접 탐색하며 포트폴리오를 경험하세요.",
  keywords: ["portfolio", "3D", "Three.js", "Next.js", "interactive", "조아진"],
  authors: [{ name: "조아진", url: "https://github.com/lastsummer0830" }],
  openGraph: {
    title: "MyWorld | AhJin Portfolio",
    description: "Next.js + Three.js로 구현한 3D 인터랙티브 포트폴리오.",
    siteName: "MyWorld",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
