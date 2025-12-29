import { getEntries } from "src/lib/garden/entries";
import type { APIRoute } from "astro";

interface ContentItem {
  id: string;
  name: string;
  url: string;
  type: string;
  date?: Date;
  status?: "seedling" | "budding" | "evergreen";
}

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const query = url.searchParams.get("q") || "";

  // If no query, return empty results
  if (!query) {
    return new Response(JSON.stringify({ items: [] }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  // Get all content items
  const contentItems = await getCommandPaletteItems();

  // Filter items based on query
  const filteredItems = contentItems.filter(
    (item) =>
      item.name.toLowerCase().includes(query.toLowerCase()) || item.type.toLowerCase().includes(query.toLowerCase())
  );

  return new Response(JSON.stringify({ items: filteredItems }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
};

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
      date: essay.data.createdAt,
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
      date: now.data.updatedAt,
    };
  });

  const bookItems: ContentItem[] = books.map((book) => {
    return {
      id: book.id,
      name: book.data.title,
      url: `/books/${book.id}`,
      type: "Book",
      date: book.data.updatedAt,
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
      url: `/talks/${talk.id}`,
      type: "Talk",
      date: talk.data.createdAt,
    };
  });

  return [...essayItems, ...noteItems, ...nowItems, ...bookItems, ...recipeItems, ...talkItems];
}
