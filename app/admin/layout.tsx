import type { Metadata } from "next";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Admin Dashboard - Sailing Yachts",
  description: "Administrative interface for managing sailing yacht data",
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      {children}
      <Script id="auth-token-sync" strategy="afterInteractive">
        {`
          (function() {
            try {
              const match = document.cookie.match(/auth=([^;]+)/);
              if (match) {
                localStorage.setItem('authToken', decodeURIComponent(match[1]));
              }
            } catch (e) {
              console.warn('Failed to sync auth cookie to localStorage', e);
            }
          })();
        `}
      </Script>
    </>
  );
}
