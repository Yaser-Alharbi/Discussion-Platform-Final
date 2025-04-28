// frontend/src/app/layout.tsx
import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Navbar from "@/components/ui/Navbar";
import AuthStateDebugger from "@/components/authentication/authdebugger";
import PageLoadDelay from "@/components/ui/pageLoadDelay";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Scientific Literature Discussion Platform",
  description: "A platform for discussing scientific literature",
};



export default function RootLayout({children,}: Readonly<{children: React.ReactNode;}>) {

  return (
    <html>
      <body className="min-h-screen">
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-grow">
            <PageLoadDelay>{children}</PageLoadDelay>
          </main>
          <AuthStateDebugger />
        </div>
      </body>
    </html>
  );
}

