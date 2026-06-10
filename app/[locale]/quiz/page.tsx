import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getSiteUrl } from "@/lib/seo";
import QuizClient from "./QuizClient";

export const metadata: Metadata = {
  title: "Which Sailing Yacht is Right for You? — Interactive Quiz",
  description:
    "Take our 2-minute quiz to find the perfect sailing yacht based on your experience, sailing style, budget, and preferences. Get personalized recommendations.",
  alternates: {
    canonical: getSiteUrl("/quiz"),
  },
  openGraph: {
    title: "Which Sailing Yacht is Right for You?",
    description:
      "Take our interactive quiz and discover your ideal sailing yacht in 2 minutes.",
    type: "website",
    url: getSiteUrl("/quiz"),
  },
};

export default async function QuizPage({
  params,
}: {
  params: { locale: string };
}) {
  const { locale } = params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Quiz" });

  return <QuizClient />;
}
