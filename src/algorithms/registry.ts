import type { Algorithm } from "./types";

// Add real templates here. Navigation, search and category routes derive from this registry.
// id is stable; category and slug are URL segments. Each implementation language is unique.
export const algorithms: Algorithm[] = [];

const categoryMap = new Map<
  string,
  { slug: string; title: string; algorithms: Algorithm[] }
>();
for (const algorithm of algorithms) {
  const category = categoryMap.get(algorithm.category);
  if (category) {
    category.algorithms.push(algorithm);
  } else {
    categoryMap.set(algorithm.category, {
      slug: algorithm.category,
      title: algorithm.categoryLabel ?? algorithm.category,
      algorithms: [algorithm],
    });
  }
}
export const categories = Array.from(categoryMap.values());

export function getAlgorithm(category: string, slug: string) {
  return algorithms.find(
    (algorithm) => algorithm.category === category && algorithm.slug === slug,
  );
}
