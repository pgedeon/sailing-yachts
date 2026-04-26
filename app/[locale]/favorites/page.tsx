import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Favorites",
  description: "Your saved favorite sailing yachts for quick access and comparison.",
  alternates: {
    canonical: "/favorites",
  },
  robots: { index: false, follow: false },
};

export default function FavoritesPage() {
  return <FavoritesClient />;
}

// Inline to avoid extra file; uses 'use client' below
import FavoritesClient from "./FavoritesClient";
