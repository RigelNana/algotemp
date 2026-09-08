import data from "./catalog.json";

export type CatalogTopic = {
  id: string;
  title: string;
  children: CatalogTopic[];
};
export type CatalogCategory = {
  slug: string;
  title: string;
  source?: { title: string; author: string; url: string };
  topics: CatalogTopic[];
};
export type CatalogEntry = {
  category: CatalogCategory;
  topic: CatalogTopic;
  trail: CatalogTopic[];
};

export const catalog: CatalogCategory[] = data;
export const catalogEntries: CatalogEntry[] = [];
const topicIndex = new Map<string, CatalogEntry>();
function indexTopics(
  category: CatalogCategory,
  topics: CatalogTopic[],
  parents: CatalogTopic[],
) {
  for (const topic of topics) {
    const entry = { category, topic, trail: [...parents, topic] };
    catalogEntries.push(entry);
    topicIndex.set(topic.id, entry);
    indexTopics(category, topic.children, entry.trail);
  }
}
for (const category of catalog) indexTopics(category, category.topics, []);

export function getTopic(category: string, id: string) {
  const entry = topicIndex.get(id);
  return entry?.category.slug === category ? entry.topic : undefined;
}
export function getTopicTrail(category: string, id: string): CatalogTopic[] {
  const entry = topicIndex.get(id);
  return entry?.category.slug === category ? entry.trail : [];
}
export function isTopicWithin(topicId: string | undefined, parentId: string) {
  return topicId === parentId || !!topicId?.startsWith(`${parentId}/`);
}
