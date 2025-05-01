import type { Transformer } from "src/garden/transformers";
import path from "path";

const moveToDirectory = (targetDir: string): Transformer => {
  return async (filePath: string, content: string) => {
    const fileName = path.basename(filePath);
    const newPath = path.join(targetDir, fileName);

    return {
      path: newPath,
      content,
    };
  };
};

export default moveToDirectory;
