import { visit } from "unist-util-visit";
import linkMaps from "../../data/index.json";

export function buildContentEntryUrl({ type, slug }) {
  switch (type) {
    case "essays":
      return `/essays/${slug}`;
    case "notes":
      return `/notes/${slug}`;
    case "nows":
      return `/now/${slug}`;
    case "books":
      return `/books/${slug}`;
    case "articles":
      return `/articles/${slug}`
    case "topics":
      return `/topics/${slug}`
    default:
      return null;
  }
}

export function remarkWikiLink() {
  return async (tree) => {
    const promises = [];
    
    visit(tree, "text", (node, index, parent) => {
      const matches = Array.from(
        node.value.matchAll(/\[\[(.*?)(?:\|(.*?))?\]\]/g)
      );

      if (!matches.length) return;

      const processNode = async () => {
        const children = [];
        let lastIndex = 0;

        for (const match of matches) {
          const [fullMatch, linkDestination, displayText] = match;
          const startIndex = match.index;
          const endIndex = startIndex + fullMatch.length;

          const label = (displayText || linkDestination).trim();

          if (startIndex > lastIndex) {
            children.push({
              type: "text",
              value: node.value.slice(lastIndex, startIndex),
            });
          }

          const matchedPost = linkMaps.find((post) => 
            post.ids.some(
              (id) => id.toLowerCase() === linkDestination.toLowerCase()
            )
          );

          let newChild;

          if (matchedPost) {
            const url = await buildContentEntryUrl(matchedPost);

            if (url) {
              newChild = {
                type: "mdxJsxFlowElement",
                name: "Link",
                attributes: [
                  {
                    type: "mdxJsxAttribute",
                    name: "href",
                    value: url,
                  },
                ],
                children: [
                  {
                    type: "text",
                    value: label,
                  },
                ],
              };
            }
          }

          if (!newChild) {
            newChild = {
              type: "text",
              value: label,
            };
          }

          children.push(newChild);

          lastIndex = endIndex;
        }

        if (lastIndex < node.value.length) {
          children.push({
            type: "text",
            value: node.value.slice(lastIndex),
          });
        }

        parent.children.splice(index, 1, ...children);
      };

      promises.push(processNode());
    });

    await Promise.all(promises);
    
    return tree;
  };
}
