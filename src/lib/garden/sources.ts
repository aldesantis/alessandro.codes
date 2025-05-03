import gitSource from "src/lib/garden/sources/git";

export type Source = (destination: string) => Promise<void>;

export { gitSource };
