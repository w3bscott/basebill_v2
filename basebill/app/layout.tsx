import type { Metadata } from "next";
import "./globals.css";

import { Toaster } from "@/components/ui/sonner";
import { NavigationBar } from "@/components/NavigationBar";
import { ThemeProvider } from "@/components/ThemeProvider";
import Web3Provider from "@/providers/Web3Provider";

export const metadata: Metadata = {
  title: "BaseBill",
  description: "Pay any invoice on Base with crypto",
  other: {
    'base:app_id': '6a0f81024858264a6eb4c0aa',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Web3Provider>
            <NavigationBar />
            <div className="flex-1 pt-16">
              {children}
            </div>
            <Toaster />
          </Web3Provider>
        </ThemeProvider>
      </body>

    </html>
  );
}
