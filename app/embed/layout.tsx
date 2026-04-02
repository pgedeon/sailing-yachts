import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sailing Yachts Widget",
  robots: { index: false, follow: false },
};

export default function EmbedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="embed-wrapper">
      {children}
    </div>
  );
}
