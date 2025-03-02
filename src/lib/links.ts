import linksData from "../data/links.json";

export interface Link {
  title: string;
  slug: string;
  contentType: string;
}

export interface ContentLinks {
  outboundLinks: Link[];
  inboundLinks: Link[];
}

export function getLinks(contentId: string): ContentLinks {
  linksData;

  const contentData = linksData.find(
    (entry) => entry.slug === contentId || entry.ids.includes(contentId)
  );

  if (!contentData) {
    return { outboundLinks: [], inboundLinks: [] };
  }

  return {
    outboundLinks: contentData.outboundLinks,
    inboundLinks: contentData.inboundLinks,
  };
}
