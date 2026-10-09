import type { Metadata } from "next";
import { Special_Gothic_Expanded_One, Special_Gothic } from "next/font/google";
import "./globals.css";

const display = Special_Gothic_Expanded_One({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400"],
});

const body = Special_Gothic({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "WellOra — Lab testing without the waiting room",
  description:
    "WellOra home test kits with partner clinics, accredited labs, and results you can actually understand.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
