import path from "path";
import matter from "gray-matter";

import type { Transformer } from "src/digital-garden/transformers";

const addBasenameToAliases = (): Transformer => {
  return async (originalPath: string, originalContent: string) => {
    const { data, content } = matter(originalContent);
    const parsedPath = path.parse(originalPath);

    if (!data.aliases?.includes(parsedPath.name)) {
      data.aliases = [...(data.aliases || []), parsedPath.name];
    }

    const newContent = matter.stringify(content, data);

    return {
      path: originalPath,
      content: newContent,
    };
  };
};

export default addBasenameToAliases;
