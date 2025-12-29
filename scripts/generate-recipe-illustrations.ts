import { Client as NotionClient } from "@notionhq/client";
import { NotionToMarkdown } from "notion-to-md";
import fetch from "node-fetch";
import FormData from "form-data";

/* -------------------------------------------------------------------------- */
/* Config */
/* -------------------------------------------------------------------------- */

const NOTION_TOKEN = process.env.NOTION_API_TOKEN;
const NOTION_DATA_SOURCE_ID = "fbf8923a-215b-4db0-8bab-051358d67347";
const FLUX_API_KEY = process.env.FLUX_API_KEY;

if (!NOTION_TOKEN) {
  throw new Error("NOTION_API_TOKEN environment variable is required");
}
if (!FLUX_API_KEY) {
  throw new Error("FLUX_API_KEY environment variable is required");
}

const ILLUSTRATION_PROMPT_TEMPLATE = `
Make an editorial illustration of the final plated dish from the following recipe, rendered in a soft modern humanist style. Show the completed dish as it would be served, beautifully plated and ready to eat. Minimal composition on a warm off‑white background. Organic, rounded shapes with subtle hand‑drawn imperfections. Flat illustration with extremely soft gradients and light watercolor or gouache texture, visible paper grain. Use a muted, desaturated color palette that complements the natural colors of the dish—keep tones soft and warm, avoiding bright or saturated colors. Very low contrast, no harsh shadows or lighting. Calm, thoughtful, essay‑like mood. Contemporary long‑form editorial illustration aesthetic. Focus on the final dish only—no cooking tools, ingredients, or preparation steps.

Recipe: [TITLE]

---

[RECIPE]
`.trim();

/* -------------------------------------------------------------------------- */
/* Clients */
/* -------------------------------------------------------------------------- */

const notion = new NotionClient({
  auth: NOTION_TOKEN,
});

const n2m = new NotionToMarkdown({ notionClient: notion });

/* -------------------------------------------------------------------------- */
/* 1. Fetch recipes without an illustration */
/* -------------------------------------------------------------------------- */

async function fetchRecipesWithoutIllustration() {
  const results = [];
  let cursor = undefined;

  do {
    const response = await notion.dataSources.query({
      data_source_id: NOTION_DATA_SOURCE_ID,
      start_cursor: cursor,
      filter: {
        and: [
          {
            property: "Illustration",
            files: {
              is_empty: true,
            },
          },
          {
            property: "Status",
            status: {
              equals: "Perfected",
            },
          },
        ],
      },
    });

    results.push(...response.results);
    cursor = response.has_more ? response.next_cursor : undefined;
  } while (cursor);

  return results;
}

/* -------------------------------------------------------------------------- */
/* 2. Generate illustration via FLUX API */
/* -------------------------------------------------------------------------- */

async function pollForResult(pollingUrl: string): Promise<string> {
  while (true) {
    const response = await fetch(pollingUrl, {
      method: "GET",
      headers: {
        accept: "application/json",
        "x-key": FLUX_API_KEY!,
      },
    });

    if (!response.ok) {
      throw new Error(`FLUX API polling error: ${await response.text()}`);
    }

    const data = (await response.json()) as {
      status: string;
      result?: { sample?: string };
    };

    if (data.status === "Ready") {
      if (!data.result?.sample) {
        throw new Error("FLUX API returned Ready status but no sample URL");
      }
      return data.result.sample;
    } else if (data.status === "Error" || data.status === "Failed") {
      throw new Error(`FLUX API generation failed: ${JSON.stringify(data)}`);
    }

    // Poll every 500ms
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}

async function generateIllustration(recipeTitle: string, recipeText: string) {
  const prompt = ILLUSTRATION_PROMPT_TEMPLATE.replace("[TITLE]", recipeTitle).replace("[RECIPE]", recipeText);

  // Submit generation request using FLUX.2 [max] for highest quality
  const response = await fetch("https://api.bfl.ai/v1/flux-2-max", {
    method: "POST",
    headers: {
      accept: "application/json",
      "x-key": FLUX_API_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      steps: 50,
      guidance: 30,
      output_format: "jpeg",
      safety_tolerance: 2,
    }),
  });

  if (!response.ok) {
    throw new Error(`FLUX API error: ${await response.text()}`);
  }

  const requestData = (await response.json()) as { polling_url: string };

  if (!requestData.polling_url) {
    throw new Error("FLUX API did not return a polling_url");
  }

  // Poll for the result
  return await pollForResult(requestData.polling_url);
}

/* -------------------------------------------------------------------------- */
/* 3. Upload image to Notion and update page */
/* -------------------------------------------------------------------------- */

async function uploadImageToNotion(imageUrl: string, filename: string = "illustration.jpg"): Promise<string> {
  // Step 1: Download the image
  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) {
    throw new Error(`Failed to download image: ${imageResponse.statusText}`);
  }

  const imageBuffer = await imageResponse.arrayBuffer();
  const imageBlob = Buffer.from(imageBuffer);

  // Step 2: Create a file upload object
  const createUploadResponse = await fetch("https://api.notion.com/v1/file_uploads", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${NOTION_TOKEN!}`,
      "Content-Type": "application/json",
      "Notion-Version": "2022-06-28",
    },
    body: JSON.stringify({
      name: filename,
      content_type: "image/jpeg",
    }),
  });

  if (!createUploadResponse.ok) {
    const errorText = await createUploadResponse.text();
    throw new Error(`Failed to create file upload: ${createUploadResponse.statusText} - ${errorText}`);
  }

  const uploadObject = (await createUploadResponse.json()) as { id: string; status: string };
  const fileUploadId = uploadObject.id;

  // Step 3: Upload the file content using multipart/form-data
  const formData = new FormData();
  formData.append("file", imageBlob, {
    filename,
    contentType: "image/jpeg",
  });

  const uploadContentResponse = await fetch(`https://api.notion.com/v1/file_uploads/${fileUploadId}/send`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${NOTION_TOKEN!}`,
      "Notion-Version": "2022-06-28",
      ...formData.getHeaders(),
    },
    body: formData,
  });

  if (!uploadContentResponse.ok) {
    const errorText = await uploadContentResponse.text();
    throw new Error(`Failed to upload file content: ${uploadContentResponse.statusText} - ${errorText}`);
  }

  // Return the file upload ID to use in the property
  return fileUploadId;
}

async function attachIllustrationToNotion(pageId: string, imageUrl: string) {
  // Upload the image to Notion first
  const fileUploadId = await uploadImageToNotion(imageUrl);

  // Then attach it to the page using the file_upload type (stored in Notion)
  await notion.pages.update({
    page_id: pageId,
    properties: {
      Illustration: {
        files: [
          {
            type: "file_upload",
            file_upload: {
              id: fileUploadId,
            },
          },
        ],
      },
    },
  });
}

/* -------------------------------------------------------------------------- */
/* Main */
/* -------------------------------------------------------------------------- */

async function run() {
  console.log("Fetching recipes without illustrations...");
  const recipes = await fetchRecipesWithoutIllustration();

  console.log(`Found ${recipes.length} recipes`);

  for (const page of recipes) {
    try {
      // Get page title from properties
      let title = "Untitled";
      if ("properties" in page && page.properties) {
        for (const [, property] of Object.entries(page.properties)) {
          if (property.type === "title") {
            const titleProperty = property as unknown as { title: Array<{ plain_text: string }> };
            if (titleProperty.title) {
              title = titleProperty.title.map((text) => text.plain_text).join("");
              if (title) break;
            }
          }
        }
      }

      // Convert page to markdown
      const mdBlocks = await n2m.pageToMarkdown(page.id);
      const markdownContentResult = n2m.toMarkdownString(mdBlocks);
      const recipeText = (markdownContentResult["parent"] as string) ?? "";

      if (recipeText.length < 30) {
        console.log(`⏭️  Skipping ${title} (content too short: ${recipeText.length} characters)`);
        continue;
      }

      console.log(`Generating illustration for: ${title}`);
      console.log(recipeText);

      const imageUrl = await generateIllustration(title, recipeText);

      console.log(`Uploading illustration to Notion…`);
      await attachIllustrationToNotion(page.id, imageUrl);

      console.log(`✅ Done: ${title}`);
    } catch (error) {
      console.error(`❌ Failed for page ${page.id}`, error);
    }
  }
}

run().catch(console.error);
