"use client";

import GuideFormClient from "../../GuideFormClient";

interface Article {
  id: number;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  content_markdown: string | null;
  category: string | null;
  author: string | null;
  author_title: string | null;
  featured_image: string | null;
  buying_guide_template_id: string | null;
  is_published: boolean;
}

export default function EditGuideClient({ article }: { article: Article }) {
  return (
    <GuideFormClient
      article={{
        id: article.id,
        slug: article.slug,
        title: article.title,
        excerpt: article.excerpt,
        content: article.content,
        contentMarkdown: article.content_markdown,
        category: article.category,
        author: article.author,
        authorTitle: article.author_title,
        featuredImage: article.featured_image,
        buyingGuideTemplateId: article.buying_guide_template_id,
        isPublished: article.is_published,
      }}
    />
  );
}
