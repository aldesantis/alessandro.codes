import { Client } from "@notionhq/client";
import { NotionToMarkdown } from "notion-to-md";
import { writeFile, mkdir, rm } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import slugify from "slugify";
import emojiRegex from "emoji-regex";
import matter from "gray-matter";
import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";

import type { Source } from "src/lib/garden/sources";

type NotionFilter = Parameters<typeof Client.prototype.dataSources.query>[0]["filter"];

type NotionConfiguration = {
  dataSourceId: string;
  apiToken: string;
  filter?: NotionFilter;
};

function normalizeEmojis(text: string): string {
  const regex = emojiRegex();
  return text.replace(regex, (emoji) => {
    const unicodeName = [...emoji].map((char) => char.codePointAt(0)?.toString(16)).join("-");
    return `emoji-${unicodeName}`;
  });
}

function slugifyTitle(title: string): string {
  const transformedEmojis = normalizeEmojis(title);
  return slugify(transformedEmojis, {
    lower: true,
    strict: true,
    remove: /[*+~.()'"!:@]/g,
  });
}

function extractPageId(pageId: string): string {
  // Notion page IDs are UUIDs with dashes, remove dashes for filename
  return pageId.replace(/-/g, "");
}

function convertPropertyToFrontmatterValue(property: PageObjectResponse["properties"][string]): unknown {
  switch (property.type) {
    case "title":
      return property.title.map((text) => text.plain_text).join("");
    case "rich_text":
      return property.rich_text.map((text) => text.plain_text).join("");
    case "number":
      return property.number;
    case "select":
      return property.select?.name ?? null;
    case "status":
      return property.status?.name ?? null;
    case "multi_select":
      return property.multi_select.map((select) => select.name);
    case "date":
      return property.date?.start ?? null;
    case "checkbox":
      return property.checkbox;
    case "url":
      return property.url;
    case "email":
      return property.email;
    case "phone_number":
      return property.phone_number;
    case "people":
      return property.people.map((person) => {
        if ("name" in person && person.name) {
          return person.name;
        }
        return person.id;
      });
    case "files":
      return property.files.map((file) => {
        if (file.type === "external") {
          return file.external.url;
        }
        return file.file.url;
      });
    case "relation":
      return property.relation.map((relation) => relation.id);
    case "formula":
      if (property.formula.type === "string") {
        return property.formula.string;
      }
      if (property.formula.type === "number") {
        return property.formula.number;
      }
      if (property.formula.type === "boolean") {
        return property.formula.boolean;
      }
      if (property.formula.type === "date") {
        return property.formula.date?.start ?? null;
      }
      return null;
    case "rollup":
      if (property.rollup.type === "number") {
        return property.rollup.number;
      }
      if (property.rollup.type === "date") {
        return property.rollup.date?.start ?? null;
      }
      if (property.rollup.type === "array") {
        return property.rollup.array.map((item) => {
          if (item.type === "title") {
            return item.title.map((text) => text.plain_text).join("");
          }
          return null;
        });
      }
      return null;
    case "created_time":
      return property.created_time;
    case "created_by":
      if ("name" in property.created_by && property.created_by.name) {
        return property.created_by.name;
      }
      return property.created_by.id;
    case "last_edited_time":
      return property.last_edited_time;
    case "last_edited_by":
      if ("name" in property.last_edited_by && property.last_edited_by.name) {
        return property.last_edited_by.name;
      }
      return property.last_edited_by.id;
    default:
      return null;
  }
}

function extractFrontmatter(properties: PageObjectResponse["properties"]): Record<string, unknown> {
  const frontmatter: Record<string, unknown> = {};

  for (const [key, property] of Object.entries(properties)) {
    const value = convertPropertyToFrontmatterValue(property);
    frontmatter[key] = value;
  }

  return frontmatter;
}

async function getAllPages(
  notion: Client,
  databaseId: string,
  { filter }: { filter?: NotionFilter }
): Promise<PageObjectResponse[]> {
  const pages: PageObjectResponse[] = [];
  let nextCursor: string | undefined = undefined;

  do {
    const queryParams: Parameters<typeof notion.dataSources.query>[0] = {
      data_source_id: databaseId,
    };

    if (nextCursor) {
      queryParams.start_cursor = nextCursor;
    }

    if (filter) {
      queryParams.filter = filter as Parameters<typeof notion.dataSources.query>[0]["filter"];
    }

    const response = await notion.dataSources.query(queryParams);

    for (const page of response.results) {
      if ("properties" in page) {
        pages.push(page as PageObjectResponse);
      }
    }

    nextCursor = response.next_cursor ?? undefined;
  } while (nextCursor);

  return pages;
}

async function getPageTitle(page: PageObjectResponse): Promise<string> {
  // Try to find a title property
  for (const [, property] of Object.entries(page.properties)) {
    if (property.type === "title") {
      const title = property.title.map((text) => text.plain_text).join("");
      if (title) {
        return title;
      }
    }
  }

  return extractPageId(page.id);
}

export default function notionSource(config: NotionConfiguration): Source {
  return async (destination) => {
    const notion = new Client({
      auth: config.apiToken,
    });

    const n2m = new NotionToMarkdown({ notionClient: notion });

    if (existsSync(destination)) {
      await rm(destination, { recursive: true, force: true });
    }

    // Ensure destination directory exists
    await mkdir(destination, { recursive: true });

    console.log(`Fetching pages from Notion database: ${config.dataSourceId}...`);

    try {
      // Get all pages from the database
      const pages = await getAllPages(notion, config.dataSourceId, { filter: config.filter });

      console.log(`Found ${pages.length} pages. Processing...`);

      // Process each page
      for (const page of pages) {
        try {
          // Get page title
          const title = await getPageTitle(page);
          const slugifiedTitle = slugifyTitle(title || "untitled");
          const pageId = extractPageId(page.id);
          // Ensure we have a valid filename even if slugified title is empty
          const filename = slugifiedTitle ? `${slugifiedTitle}.md` : `${pageId}.md`;

          // Extract properties for frontmatter
          const frontmatter = extractFrontmatter(page.properties);

          // Convert page blocks to markdown
          const mdBlocks = await n2m.pageToMarkdown(page.id);
          const markdownContentResult = n2m.toMarkdownString(mdBlocks);
          const markdownContent = (markdownContentResult["parent"] as string) ?? "";

          // Combine frontmatter and content
          const fileContent = matter.stringify(markdownContent, frontmatter);

          // Write file to destination
          const filePath = path.join(destination, filename);
          await writeFile(filePath, fileContent, "utf-8");

          console.log(`  ✓ Processed: ${filename}`);
        } catch (error) {
          console.warn(`  ✗ Failed to process page ${page.id}:`, error, page);
          // Continue processing other pages
        }
      }

      console.log(`Successfully processed ${pages.length} pages.`);
    } catch (error) {
      console.error(`Error fetching from Notion database:`, error);
      throw error;
    }
  };
}
