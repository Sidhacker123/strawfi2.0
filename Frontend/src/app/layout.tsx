import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import PageTransition from "./components/PageTransition";
import Header from "./components/Header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Strawfi",
  description: "Your gateway to personalized financial insights and AI-powered analysis",
  icons: {
    icon: [
      {
        url: "/assests/logo.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        url: "/assests/logo.png",
        sizes: "16x16", 
        type: "image/png",
      }
    ],
    shortcut: "/assests/logo.png",
    apple: {
      url: "/assests/logo.png",
      sizes: "180x180",
      type: "image/png",
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* <Header /> */}
        {/* Spacer to push content below the fixed header */}
        {/* <div style={{ height: "64px" }} /> */}
        <PageTransition>
          {children}
        </PageTransition>
      </body>
    </html>
  );
}