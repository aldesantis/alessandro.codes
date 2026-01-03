import { defineAction } from "astro:actions";
import { z } from "astro/zod";
import { getEntries } from "src/lib/garden/entries";

interface ContentItem {
  id: string;
  name: string;
  url: string;
  type: string;
  date?: string;
  status?: "seedling" | "budding" | "evergreen";
}

async function getCommandPaletteItems(): Promise<ContentItem[]> {
  const entries = await getEntries(["essays", "notes", "nows", "books", "recipes", "talks"]);

  const essays = entries.filter((e) => e.collection === "essays");
  const notes = entries.filter((e) => e.collection === "notes");
  const nows = entries.filter((e) => e.collection === "nows");
  const books = entries.filter((e) => e.collection === "books");
  const recipes = entries.filter((e) => e.collection === "recipes");
  const talks = entries.filter((e) => e.collection === "talks");

  const essayItems: ContentItem[] = essays.map((essay) => {
    return {
      id: essay.id,
      name: essay.data.title,
      url: `/essays/${essay.id}`,
      type: "Essay",
      date: essay.data.createdAt ? new Date(essay.data.createdAt).toISOString() : undefined,
    };
  });

  const noteItems: ContentItem[] = notes.map((note) => {
    return {
      id: note.id,
      name: note.data.title,
      url: `/notes/${note.id}`,
      type: "Note",
      status: note.data.status,
    };
  });

  const nowItems: ContentItem[] = nows.map((now) => {
    return {
      id: now.id,
      name: now.data.title,
      url: `/now/${now.id}`,
      type: "Now",
      date: now.data.updatedAt ? new Date(now.data.updatedAt).toISOString() : undefined,
    };
  });

  const bookItems: ContentItem[] = books.map((book) => {
    return {
      id: book.id,
      name: book.data.title,
      url: `/books/${book.id}`,
      type: "Book",
      date: book.data.updatedAt ? new Date(book.data.updatedAt).toISOString() : undefined,
    };
  });

  const recipeItems: ContentItem[] = recipes.map((recipe) => {
    return {
      id: recipe.id,
      name: recipe.data.title,
      url: `/recipes/${recipe.id}`,
      type: "Recipe",
    };
  });

  const talkItems: ContentItem[] = talks.map((talk) => {
    return {
      id: talk.id,
      name: talk.data.title,
      url: `/talks`,
      type: "Talk",
      date: talk.data.createdAt ? new Date(talk.data.createdAt).toISOString() : undefined,
    };
  });

  return [...essayItems, ...noteItems, ...nowItems, ...bookItems, ...recipeItems, ...talkItems];
}

export const search = defineAction({
  input: z.object({
    query: z.string().default(""),
  }),
  handler: async ({ query }) => {
    if (!query || query.length < 3) {
      return { items: [] };
    }

    const contentItems = await getCommandPaletteItems();
    const filteredItems = contentItems.filter((item) => item.name.toLowerCase().includes(query.toLowerCase()));

    return { items: filteredItems };
  },
});
