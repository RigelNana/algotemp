import type { Algorithm } from "./types";
import { catalog, type CatalogCategory } from "./catalog";

// Add real templates here; the topic catalog is maintained separately.
// category is a catalog slug; optional topicId associates a template with a catalog node.
export const algorithms: Algorithm[] = [];

const categoryMap = new Map<
  string,
  CatalogCategory & { algorithms: Algorithm[] }
>(catalog.map((category) => [category.slug, { ...category, algorithms: [] }]));
for (const algorithm of algorithms) {
  const category = categoryMap.get(algorithm.category);
  if (category) {
    category.algorithms.push(algorithm);
  } else {
    categoryMap.set(algorithm.category, {
      slug: algorithm.category,
      title: algorithm.categoryLabel ?? algorithm.category,
      algorithms: [algorithm],
      topics: [],
    });
  }
}
export const categories = Array.from(categoryMap.values());

export function getAlgorithm(category: string, slug: string) {
  return algorithms.find(
    (algorithm) => algorithm.category === category && algorithm.slug === slug,
  );
}
