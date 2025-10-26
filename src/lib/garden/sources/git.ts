import { execSync } from "child_process";
import { existsSync } from "fs";
import { join } from "path";

import type { Source } from "src/lib/garden/sources";

type GitConfiguration = {
  repositoryUrl: string;
};

export default function gitSource(config: GitConfiguration): Source {
  return async (destination) => {
    const gitDir = join(destination, ".git");

    // Check if the directory already contains a git repository
    if (existsSync(gitDir)) {
      console.log("Repository already exists, pulling latest changes...");
      execSync(`cd ${destination} && git pull`, { stdio: "inherit" });
    } else {
      console.log("Cloning repository for the first time...");
      execSync(`git clone ${config.repositoryUrl} ${destination}`, { stdio: "inherit" });
    }
  };
}
