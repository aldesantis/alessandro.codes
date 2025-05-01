export interface GardenIndexEntryLink {
  slug: string;
  type: string;
}

export interface GardenIndexEntry {
  ids: string[];
  slug: string;
  type: string;
  outboundLinks: GardenIndexEntryLink[];
  inboundLinks: GardenIndexEntryLink[];
}
