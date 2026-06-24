import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "Galaxy — AI Workflow Builder",
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
        variables: {
          colorPrimary: "hsl(263, 70%, 50%)",
          colorBackground: "#ffffff",
          colorForeground: "#0f172a",
          borderRadius: "10px",
          fontFamily: "Inter, system-ui, sans-serif",
        },
        elements: {
          card: "shadow-lg border border-gray-200",
          formButtonPrimary:
            "bg-purple-600 hover:bg-purple-500 transition-colors duration-200",
          footerActionLink: "text-purple-600 hover:text-purple-500",
        },
      }}
    >
      <html lang="en" className="h-full">
        <body className="min-h-full flex flex-col bg-[#f8f9fb] text-slate-900 antialiased font-sans">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
