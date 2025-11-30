import matter from "gray-matter";

import type { Transformer } from "src/lib/garden/transformers";

const removeDrafts = (): Transformer => {
  return async (originalPath: string, originalContent: string) => {
    const { data } = matter(originalContent);

    if (data.draft === true || data.draft === "true") {
      return null;
    }

    return { path: originalPath, content: originalContent };
  };
};

export default removeDrafts;
