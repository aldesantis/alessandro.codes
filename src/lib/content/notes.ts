import { getCollection } from "astro:content";

export async function getSortedNotes() {
  const statusPriorities = {
    seedling: 0,
    budding: 1,
    evergreen: 2,
  };

  const notes = (await getCollection("notes")).sort((a, b) => {
    const statusPriorityA = statusPriorities[a.data.status];
    const statusPriorityB = statusPriorities[b.data.status];

    return statusPriorityA > statusPriorityB ? -1 : 1;
  });

  return notes;
}
