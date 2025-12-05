import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ServiceWorkerCleanup } from "@/components/ServiceWorkerCleanup";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "QA Studio - Self-Healing Automation Workbench for D365",
  description: "Stop wrestling with fragile selectors. Record, Generate, and Debug automation scripts with the power of AI Agents.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark">
      <body className={`${inter.variable} font-sans antialiased`}>
        <ServiceWorkerCleanup />
        {children}
      </body>
    </html>
  );
}
