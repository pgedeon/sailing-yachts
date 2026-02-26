import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sailing Yachts",
  description: "Browse sailing yachts by specification",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900">
        {children}
      </body>
    </html>
  );
}
