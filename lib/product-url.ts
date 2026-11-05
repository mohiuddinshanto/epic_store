export function productUrl(slug: string): string {
  return `/products/${encodeURIComponent(slug)}`;
}
