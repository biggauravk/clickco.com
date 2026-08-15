import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ClickCo | Logo Design & Web Development",
  description: "ClickCo designs bold logos and high-performing websites that help brands stand out and convert.",
  keywords: ["logo design", "web design", "web development", "brand identity", "ClickCo"],
  openGraph: {
    title: "ClickCo | Logo Design & Web Development",
    description: "ClickCo designs bold logos and high-performing websites that help brands stand out and convert.",
    url: "https://clickco.vercel.app",
    siteName: "ClickCo",
    images: [
      {
        url: "/images/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "ClickCo - Logo Design & Web Development",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ClickCo | Logo Design & Web Development",
    description: "ClickCo designs bold logos and high-performing websites that help brands stand out and convert.",
    images: ["/images/og-image.jpg"],
  },
  icons: {
    icon: "/images/favicon.png",
    apple: "/images/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
