export type AlgorithmImplementation = {
  language: string;
  label?: string;
  filename?: string;
  code: string;
  highlightedLines?: number[];
};

export type AlgorithmSection = {
  id: string;
  title: string;
  paragraphs?: string[];
  bullets?: string[];
};

export type AlgorithmContent = {
  sections: AlgorithmSection[];
};

export type Algorithm = {
  id: string;
  slug: string;
  category: string;
  categoryLabel?: string;
  topicId?: string;
  title: string;
  description?: string;
  aliases?: string[];
  keywords?: string[];
  tags: string[];
  complexity?: { time?: string; space?: string };
  implementations: AlgorithmImplementation[];
  content?: AlgorithmContent;
};
