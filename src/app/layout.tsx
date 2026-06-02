import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });

export const metadata: Metadata = {
  title: "Gestió de Residus",
  description: "Gestió operativa de recollides de residus",
  manifest: "/manifest.json",
  themeColor: "#1e40af",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Residus" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ca" className={`${geist.variable} h-full`}>
      <body className="h-full bg-gray-50 antialiased">{children}</body>
    </html>
  );
}
