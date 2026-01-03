import { getCollection } from "astro:content";

export interface FilterConfig {
  category: string;
  label: string;
  items: Array<{ id: string; label: string }>;
}

export function createStatusFilterConfig(): FilterConfig {
  return {
    category: "status",
    label: "Status",
    items: [
      { id: "seedling", label: "🌱 Seedling" },
      { id: "budding", label: "🌿 Budding" },
      { id: "evergreen", label: "🌳 Evergreen" },
    ],
  };
}

export function createTypeFilterConfig(): FilterConfig {
  return {
    category: "types",
    label: "Type",
    items: [
      { id: "essays", label: "Essays" },
      { id: "books", label: "Books" },
      { id: "notes", label: "Notes" },
      { id: "talks", label: "Talks" },
      { id: "topics", label: "Topics" },
      { id: "recipes", label: "Recipes" },
      { id: "articles", label: "Articles" },
      { id: "nows", label: "Now" },
    ],
  };
}

export async function createTopicFilterConfig(): Promise<FilterConfig> {
  const topics = await getCollection("topics");

  return {
    category: "topics",
    label: "Topic",
    items: topics.map((topic) => ({
      id: topic.id,
      label: topic.data.title,
    })),
  };
}
