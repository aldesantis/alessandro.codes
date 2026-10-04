import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { getContainerRenderer as mdxContainerRenderer } from "@astrojs/mdx/container-renderer";
import { render } from "astro:content";
import { loadRenderers } from "astro:container";
import * as cheerio from "cheerio";
import Link from "@components/ui/Link.astro";
import Tldr from "@components/content/Tldr.astro";
import FactoryPower from "@components/viz/FactoryPower.astro";
import ExecutionLadder from "@components/viz/ExecutionLadder.astro";
import ProfessionMap from "@components/viz/ProfessionMap.astro";
import StrategyMap from "@components/viz/StrategyMap.astro";
import TimeHorizon from "@components/viz/TimeHorizon.astro";
import IdeationGap from "@components/viz/IdeationGap.astro";
import type { ZendoCollectionEntry } from "src/garden";

export async function renderToString(entry: ZendoCollectionEntry): Promise<string> {
  const renderers = await loadRenderers([mdxContainerRenderer()]);
  const container = await AstroContainer.create({
    renderers,
  });

  const { Content } = await render(entry);
  const entryHtml = await container.renderToString(Content, {
    props: { components: getMdxComponents() },
  });

  return entryHtml;
}

export function getFirstParagraph(html: string): string {
  const $ = cheerio.load(html);
  const firstParagraph = $("p").first();
  return firstParagraph.text() || "";
}

export function getMdxComponents() {
  return {
    a: Link,
    Link: Link,
    Tldr: Tldr,
    FactoryPower,
    ExecutionLadder,
    ProfessionMap,
    StrategyMap,
    TimeHorizon,
    IdeationGap,
  };
}
