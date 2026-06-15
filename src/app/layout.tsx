import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "NextFlow — AI Workflow Builder",
  description:
    "Build, connect, and execute AI workflows visually. Powered by Google Gemini, Trigger.dev, and React Flow.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        ...dark,
        variables: {
          ...dark.variables,
          colorPrimary: "hsl(271, 91%, 65%)",
          colorBackground: "#1a1a2e",
          colorForeground: "#fafafa",
          borderRadius: "12px",
          fontFamily: "Inter, system-ui, sans-serif",
        },
        elements: {
          card: "shadow-lg border border-zinc-800",
          formButtonPrimary:
            "bg-purple-600 hover:bg-purple-500 transition-colors duration-200",
          footerActionLink: "text-purple-400 hover:text-purple-300",
        },
      }}
    >
      <html lang="en" className={`${inter.variable} h-full dark`}>
        <body className="min-h-full flex flex-col bg-[#09090b] text-zinc-50 antialiased font-sans">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
