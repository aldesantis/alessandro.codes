import { getEntries } from "src/lib/garden/garden";
import type { APIRoute } from "astro";
import type { GardenEntry } from "src/lib/garden/garden";

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
  const entries = await getEntries(["essays", "notes", "nows", "books"]);
  const essays = entries.filter((e) => e.collection === "essays");
  const notes = entries.filter((e) => e.collection === "notes");
  const nows = entries.filter((e) => e.collection === "nows");
  const books = entries.filter((e) => e.collection === "books");

  const essayItems: ContentItem[] = essays.map((essay: GardenEntry) => {
    return {
      id: essay.id,
      name: essay.data.title,
      url: `/essays/${essay.id}`,
      type: "Essay",
      date: essay.data.createdAt,
    };
  });

  const noteItems: ContentItem[] = notes.map((note: GardenEntry) => {
    return {
      id: note.id,
      name: note.data.title,
      url: `/notes/${note.id}`,
      type: "Note",
      status: note.data.status,
    };
  });

  const nowItems: ContentItem[] = nows.map((now: GardenEntry) => {
    return {
      id: now.id,
      name: now.data.title,
      url: `/now/${now.id}`,
      type: "Now",
    };
  });

  const bookItems: ContentItem[] = books.map((book: GardenEntry) => {
    return {
      id: book.id,
      name: book.data.title,
      url: `/books/${book.id}`,
      type: "Book",
      date: book.data.updatedAt,
    };
  });

  return [...essayItems, ...noteItems, ...nowItems, ...bookItems];
}
