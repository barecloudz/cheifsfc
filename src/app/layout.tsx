import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const viewport: Viewport = {
  themeColor: "#F5F3F0",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Chiefs FC",
  description: "Chiefs FC — Division 3 Football Club, Asheville NC",
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  openGraph: {
    title: "Chiefs FC",
    description: "Division 3 Football Club — Asheville, NC",
    images: [{ url: "/logo.png", width: 512, height: 512, alt: "Chiefs FC Logo" }],
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Chiefs FC",
    description: "Division 3 Football Club — Asheville, NC",
    images: ["/logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${poppins.variable} font-sans antialiased`} suppressHydrationWarning>
        <Navbar />
        <main className="min-h-screen pb-20 md:pb-0">{children}</main>
        <BottomNav />
      </body>
    </html>
  );
}
