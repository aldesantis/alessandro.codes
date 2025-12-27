import gitSource from "src/lib/garden/sources/git";
import notionSource from "src/lib/garden/sources/notion";

export type Source = (destination: string) => Promise<void>;

export { gitSource, notionSource };
