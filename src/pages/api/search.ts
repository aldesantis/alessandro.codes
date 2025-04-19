import { getSortedEssays } from "src/lib/garden";
import { getSortedNotes } from "src/lib/garden";
import { getSortedNows } from "src/lib/garden";
import { getSortedBooks } from "src/lib/garden";
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
      item.name.toLowerCase().includes(query.toLowerCase()) ||
      item.type.toLowerCase().includes(query.toLowerCase())
  );

  return new Response(JSON.stringify({ items: filteredItems }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
};

async function getCommandPaletteItems(): Promise<ContentItem[]> {
  const essays = await getSortedEssays();
  const notes = await getSortedNotes();
  const nows = await getSortedNows();
  const books = await getSortedBooks();

  const essayItems: ContentItem[] = essays.map((essay) => {
    return {
      id: essay.id,
      name: essay.data.title,
      url: `/essays/${essay.id}`,
      type: "Essay",
      date: essay.data.publishedOn,
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
    };
  });

  const bookItems: ContentItem[] = books.map((book) => {
    return {
      id: book.id,
      name: book.data.title,
      url: `/books/${book.id}`,
      type: "Book",
      date: book.data.lastHighlightedOn,
    };
  });

  return [...essayItems, ...noteItems, ...nowItems, ...bookItems];
}
