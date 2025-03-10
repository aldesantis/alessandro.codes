export interface ContentItem {
  id: string;
  name: string;
  url: string;
  type: string;
  date?: Date;
  status?: "seedling" | "budding" | "evergreen";
}
