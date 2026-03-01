/**
 * Slugify a string: convert to lowercase, replace spaces with hyphens,
 * remove invalid characters, and ensure it's not empty.
 */
export function slugify(text: string): string {
  if (!text) return '';
  const slug = text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars except hyphens
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start
    .replace(/-+$/, '');            // Trim - from end
  return slug || 'untitled';
}

/**
 * Generate a unique slug by appending a number if needed.
 * Used as fallback when provided slug already exists.
 */
export async function generateUniqueSlug(
  baseSlug: string,
  checkExists: (slug: string) => Promise<boolean>
): Promise<string> {
  let slug = slugify(baseSlug);
  if (!(await checkExists(slug))) {
    return slug;
  }
  // Append incrementing number until unique
  let counter = 1;
  while (await checkExists(`${slug}-${counter}`)) {
    counter++;
  }
  return `${slug}-${counter}`;
}
