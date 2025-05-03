import { execSync } from "child_process";

import type { Source } from "src/lib/garden/sources";

type GitConfiguration = {
  repositoryUrl: string;
};

export default function gitSource(config: GitConfiguration): Source {
  return async (destination) => {
    execSync(`git clone ${config.repositoryUrl} ${destination}`, { stdio: "inherit" });
  };
}
