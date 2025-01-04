import { visit } from "unist-util-visit";
import type { Plugin, Transformer } from "unified";
import type { Node } from "unist";

// Define interfaces for the AST nodes
interface TextNode extends Node {
  type: "text";
  value: string;
}

interface Parent extends Node {
  children: Node[];
}

// Type guard to check if a node is a TextNode
function isTextNode(node: Node): node is TextNode {
  return node.type === "text";
}

// Type guard to check if a node is a Parent
function isParent(node: Node): node is Parent {
  return Array.isArray((node as Parent).children);
}

export function remarkWikiLink(): Plugin {
  const transformer: Transformer = (tree: Node, file) => {
    visit(
      tree,
      "text",
      (node: Node, index: number | null, parent: Parent | null) => {
        if (!isTextNode(node) || !isParent(parent) || index === null) {
          return;
        }

        const matches = Array.from(node.value.matchAll(/\[\[(.*?)\]\]/g));
        if (!matches.length) return;

        const children: TextNode[] = [];
        let lastIndex = 0;

        matches.forEach((match) => {
          const [fullMatch, linkText] = match;
          const startIndex = match.index!; // We know index exists from matchAll
          const endIndex = startIndex + fullMatch.length;

          // Add text before the match
          if (startIndex > lastIndex) {
            children.push({
              type: "text",
              value: node.value.slice(lastIndex, startIndex),
            });
          }

          // Add the matched link text
          children.push({
            type: "text",
            value: linkText,
          });

          lastIndex = endIndex;
        });

        // Add any remaining text
        if (lastIndex < node.value.length) {
          children.push({
            type: "text",
            value: node.value.slice(lastIndex),
          });
        }

        // Replace the original node with our new children
        parent.children.splice(index, 1, ...children);
      }
    );
  };

  return transformer;
}
