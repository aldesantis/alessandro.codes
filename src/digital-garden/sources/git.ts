import { execSync } from "child_process";
import type { DigitalGardenSource } from "../config";

type GitConfiguration = {
  repositoryUrl: string;
};

export default function gitSource(config: GitConfiguration): DigitalGardenSource {
  return async (destination) => {
    execSync(`git clone ${config.repositoryUrl} ${destination}`, { stdio: "inherit" });
  };
}
