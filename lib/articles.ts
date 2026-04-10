/**
 * Articles/Guides Data Service
 *
 * Manages editorial content for guides platform.
 * Supports markdown content, categories, buying guide templates, and SEO.
 */

import { pool } from "@/lib/db";
import { buildSafeQuery } from "@/lib/build-safe";

export interface Article {
  id: number;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  contentMarkdown: string | null;
  category: string | null;
  author: string | null;
  authorTitle: string | null;
  featuredImage: string | null;
  readingTimeMinutes: number | null;
  buyingGuideTemplateId: string | null;
  isPublished: boolean;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ArticleWithStats extends Article {
  relatedGuides?: Article[];
}

const FALLBACK_ARTICLE: Article = {
  id: 0,
  slug: "",
  title: "Not Found",
  excerpt: null,
  content: "",
  contentMarkdown: null,
  category: null,
  author: null,
  authorTitle: null,
  featuredImage: null,
  readingTimeMinutes: null,
  buyingGuideTemplateId: null,
  isPublished: false,
  publishedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const FALLBACK_ARTICLES: Article[] = [];

/**
 * Get an article by slug (published only)
 */
export async function getArticleBySlug(
  slug: string
): Promise<Article | null> {
  return buildSafeQuery(async () => {
    const result = await pool.query(
      `SELECT * FROM articles WHERE slug = $1 AND is_published = true`,
      [slug]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      excerpt: row.excerpt,
      content: row.content,
      contentMarkdown: row.content_markdown,
      category: row.category,
      author: row.author,
      authorTitle: row.author_title,
      featuredImage: row.featured_image,
      readingTimeMinutes: row.reading_time_minutes,
      buyingGuideTemplateId: row.buying_guide_template_id || null,
      isPublished: row.is_published,
      publishedAt: row.published_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }, null);
}

/**
 * Get all published articles (for hub page)
 */
export async function getAllPublishedArticles(): Promise<Article[]> {
  return buildSafeQuery(async () => {
    const result = await pool.query(
      `SELECT * FROM articles
       WHERE is_published = true
       ORDER BY published_at DESC`
    );

    return result.rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      excerpt: row.excerpt,
      content: row.content,
      contentMarkdown: row.content_markdown,
      category: row.category,
      author: row.author,
      authorTitle: row.author_title,
      featuredImage: row.featured_image,
      readingTimeMinutes: row.reading_time_minutes,
      buyingGuideTemplateId: row.buying_guide_template_id || null,
      isPublished: row.is_published,
      publishedAt: row.published_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }, FALLBACK_ARTICLES);
}

/**
 * Get articles by category
 */
export async function getArticlesByCategory(
  category: string
): Promise<Article[]> {
  return buildSafeQuery(async () => {
    const result = await pool.query(
      `SELECT * FROM articles
       WHERE is_published = true AND category = $1
       ORDER BY published_at DESC`,
      [category]
    );

    return result.rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      excerpt: row.excerpt,
      content: row.content,
      contentMarkdown: row.content_markdown,
      category: row.category,
      author: row.author,
      authorTitle: row.author_title,
      featuredImage: row.featured_image,
      readingTimeMinutes: row.reading_time_minutes,
      buyingGuideTemplateId: row.buying_guide_template_id || null,
      isPublished: row.is_published,
      publishedAt: row.published_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }, FALLBACK_ARTICLES);
}

/**
 * Get all categories (for sidebar/navigation)
 */
export async function getAllCategories(): Promise<
  Array<{ name: string; count: number }>
> {
  return buildSafeQuery(async () => {
    const result = await pool.query(
      `SELECT category, COUNT(*) as count
       FROM articles
       WHERE is_published = true AND category IS NOT NULL
       GROUP BY category
       ORDER BY category`
    );

    return result.rows.map((row) => ({
      name: row.category,
      count: parseInt(row.count, 10),
    }));
  }, []);
}

/**
 * Get related articles (same category, excluding current)
 */
export async function getRelatedArticles(
  articleId: number,
  category: string | null,
  limit = 3
): Promise<Article[]> {
  return buildSafeQuery(async () => {
    let query = `SELECT * FROM articles WHERE is_published = true AND id != $1`;
    const params: any[] = [articleId];

    if (category) {
      query += ` AND category = $2`;
      params.push(category);
    }

    query += ` ORDER BY published_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await pool.query(query, params);

    return result.rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      excerpt: row.excerpt,
      content: row.content,
      contentMarkdown: row.content_markdown,
      category: row.category,
      author: row.author,
      authorTitle: row.author_title,
      featuredImage: row.featured_image,
      readingTimeMinutes: row.reading_time_minutes,
      buyingGuideTemplateId: row.buying_guide_template_id || null,
      isPublished: row.is_published,
      publishedAt: row.published_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }, []);
}

/**
 * Get articles with buying guide templates
 */
export async function getBuyingGuideArticles(): Promise<Article[]> {
  return buildSafeQuery(async () => {
    const result = await pool.query(
      `SELECT * FROM articles
       WHERE is_published = true AND buying_guide_template_id IS NOT NULL
       ORDER BY published_at DESC`
    );

    return result.rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      excerpt: row.excerpt,
      content: row.content,
      contentMarkdown: row.content_markdown,
      category: row.category,
      author: row.author,
      authorTitle: row.author_title,
      featuredImage: row.featured_image,
      readingTimeMinutes: row.reading_time_minutes,
      buyingGuideTemplateId: row.buying_guide_template_id || null,
      isPublished: row.is_published,
      publishedAt: row.published_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }, FALLBACK_ARTICLES);
}

/**
 * Create a new article
 */
export async function createArticle(data: {
  slug: string;
  title: string;
  excerpt?: string | null;
  content: string;
  contentMarkdown?: string | null;
  category?: string | null;
  author?: string | null;
  authorTitle?: string | null;
  featuredImage?: string | null;
  readingTimeMinutes?: number | null;
  buyingGuideTemplateId?: string | null;
  isPublished?: boolean;
  publishedAt?: string | null;
}): Promise<Article | null> {
  return buildSafeQuery(async () => {
    const result = await pool.query(
      `INSERT INTO articles (slug, title, excerpt, content, content_markdown, category, author, author_title, featured_image, reading_time_minutes, buying_guide_template_id, is_published, published_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [
        data.slug,
        data.title,
        data.excerpt || null,
        data.content,
        data.contentMarkdown || null,
        data.category || null,
        data.author || null,
        data.authorTitle || null,
        data.featuredImage || null,
        data.readingTimeMinutes || null,
        data.buyingGuideTemplateId || null,
        data.isPublished ?? false,
        data.publishedAt || null,
      ]
    );
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      excerpt: row.excerpt,
      content: row.content,
      contentMarkdown: row.content_markdown,
      category: row.category,
      author: row.author,
      authorTitle: row.author_title,
      featuredImage: row.featured_image,
      readingTimeMinutes: row.reading_time_minutes,
      buyingGuideTemplateId: row.buying_guide_template_id || null,
      isPublished: row.is_published,
      publishedAt: row.published_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }, null);
}

/**
 * Delete an article by slug
 */
export async function deleteArticle(slug: string): Promise<boolean> {
  return buildSafeQuery(async () => {
    const result = await pool.query(
      `DELETE FROM articles WHERE slug = $1 RETURNING id`,
      [slug]
    );
    return result.rows.length > 0;
  }, false);
}
