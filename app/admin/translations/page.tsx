import type { Metadata } from "next";
import TranslationsClient from "./TranslationsClient";

export const metadata: Metadata = {
  title: "Translation Management — Admin",
  description: "Manage multilingual content translations",
};

export default function TranslationsAdminPage() {
  return <TranslationsClient />;
}
