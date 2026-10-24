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
  metadataBase: new URL("https://kya-dekhein.vercel.app"),

  title: "Kya Dekhein? — Find Your Next Movie",
  description:
    "Not sure what to watch? Find a movie matching your mood, available time, and language.",

  alternates: {
    canonical: "/",
  },

  robots: {
    index: true,
    follow: true,
  },

  openGraph: {
    title: "Kya Dekhein? — Find Your Next Movie",
    description:
      "Not sure what to watch? Find a movie matching your mood, available time, and language.",
    url: "https://kya-dekhein.vercel.app/",
    siteName: "Kya Dekhein?",
    type: "website",
    locale: "en_IN",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
