import { getCollection } from "astro:content";

export async function getSortedNotes() {
  const statusPriorities = {
    seedling: 0,
    budding: 1,
    evergreen: 2,
  };

  const notes = (await getCollection("notes")).sort((a, b) => {
    // First, compare by updatedAt in descending order
    if (a.data.updatedAt! > b.data.updatedAt!) return -1;
    if (a.data.updatedAt! < b.data.updatedAt!) return 1;

    // If updatedAt is the same, use status as a tiebreaker
    const statusPriorityA = statusPriorities[a.data.status];
    const statusPriorityB = statusPriorities[b.data.status];

    return statusPriorityA > statusPriorityB ? -1 : 1;
  });

  return notes;
}
