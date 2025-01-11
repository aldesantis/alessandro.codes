import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import fetch from 'node-fetch';
import chalk from 'chalk';
import { setTimeout } from 'timers/promises';

const CONTENT_DIR = path.join(process.cwd(), 'src/content/books');
const COVERS_DIR = path.join(process.cwd(), 'src/assets/covers');
const RATE_LIMIT_DELAY = 1000; // 1 second between requests
const MAX_RETRIES = 3;
const CONCURRENT_BOOKS = 20;
const MIN_IMAGE_WIDTH = 300; // Minimum required image width

// Rate limiter for API requests
class RateLimiter {
  constructor(delayMs) {
    this.delayMs = delayMs;
    this.lastRequest = 0;
  }

  async waitForNext() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequest;
    
    if (timeSinceLastRequest < this.delayMs) {
      await setTimeout(this.delayMs - timeSinceLastRequest);
    }
    
    this.lastRequest = Date.now();
  }
}

const rateLimiter = new RateLimiter(RATE_LIMIT_DELAY);

async function ensureDirectoryExists(dir) {
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
    console.log(chalk.gray(`Created directory: ${dir}`));
  }
}

async function getMarkdownFiles() {
  try {
    const files = await fs.readdir(CONTENT_DIR);
    return files.filter(file => file.endsWith('.md'));
  } catch (error) {
    throw new Error(`Failed to read directory ${CONTENT_DIR}: ${error.message}`);
  }
}

async function getImageDimensions(buffer) {
  try {
    // Check for PNG signature
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
      // PNG: Width is in bytes 16-19
      const width = buffer.readUInt32BE(16);
      const height = buffer.readUInt32BE(20);
      return { width, height, format: 'png' };
    }
    
    // Check for JPEG signature
    if (buffer[0] === 0xFF && buffer[1] === 0xD8) {
      // JPEG: Need to scan through markers
      let offset = 2;
      while (offset < buffer.length) {
        // Check for Start Of Frame markers
        if (buffer[offset] === 0xFF && (
          buffer[offset + 1] === 0xC0 || // SOF0
          buffer[offset + 1] === 0xC2    // SOF2
        )) {
          const height = buffer.readUInt16BE(offset + 5);
          const width = buffer.readUInt16BE(offset + 7);
          return { width, height, format: 'jpg' };
        }
        offset++;
      }
    }
    
    throw new Error('Unsupported image format or corrupted image');
  } catch (error) {
    console.warn(chalk.yellow(`Failed to get image dimensions:`, error.message));
    return null;
  }
}

async function downloadAndVerifyImage(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const dimensions = await getImageDimensions(buffer);
    if (!dimensions) {
      return null;
    }
    
    console.log(chalk.gray(`Image dimensions for ${url}: ${dimensions.width}x${dimensions.height}`));
    
    if (dimensions.width < MIN_IMAGE_WIDTH) {
      console.log(chalk.yellow(`Image width ${dimensions.width}px is below minimum ${MIN_IMAGE_WIDTH}px`));
      return null;
    }
    
    return { buffer, format: dimensions.format };
  } catch (error) {
    console.warn(chalk.yellow(`Failed to download and verify image ${url}:`, error.message));
    return null;
  }
}

async function fetchWithRetry(url, retries = MAX_RETRIES) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await rateLimiter.waitForNext();
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }
      console.warn(chalk.yellow(`Attempt ${attempt} failed, retrying...`));
      await setTimeout(1000 * attempt); // Exponential backoff
    }
  }
}

async function fetchBookCover(title, author) {
  try {
    const normalizeForUrl = (str) => {
      str = str.replace(/[''‛`]/g, "'")
        .replace(/[""„‟]/g, '"');
      return encodeURIComponent(str.trim());
    };

    const queryTitle = normalizeForUrl(title);
    const queryAuthor = normalizeForUrl(author);
    const url = `https://openlibrary.org/search.json?title=${queryTitle}&author=${queryAuthor}`;
    
    console.log(chalk.blue('\nDebug info for:', chalk.bold(title), 'by', chalk.bold(author)));
    console.log(chalk.gray('Search URL:', url));
    
    const data = await fetchWithRetry(url);
    console.log(chalk.gray(`Total results found: ${data.numFound || 0}`));

    if (!data.docs || data.docs.length === 0) {
      console.log(chalk.yellow('No results found in OpenLibrary search'));
      return '';
    }

    console.log(chalk.gray('\nFirst 3 results:'));
    data.docs.slice(0, 3).forEach((doc, index) => {
      console.log(chalk.gray(`\nResult ${index + 1}:`));
      console.log(chalk.gray(`  Title: ${doc.title}`));
      console.log(chalk.gray(`  Author(s): ${doc.author_name?.join(', ') || 'N/A'}`));
      console.log(chalk.gray(`  Cover ID: ${doc.cover_i || 'N/A'}`));
      console.log(chalk.gray(`  Edition Key: ${doc.cover_edition_key || 'N/A'}`));
      console.log(chalk.gray(`  ISBN(s): ${doc.isbn?.join(', ') || 'N/A'}`));
    });

    const normalizeTitle = (str) => {
      const normalized = str.toLowerCase()
        .replace(/\(.*?\)/g, '')
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()'"""'']/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      const wordCount = normalized.split(' ').length;
      if (wordCount <= 3) {
        return normalized;
      }
      
      return normalized.replace(/^(the|a|an|il|la|le|lo|gli|i|un|uno|una)\s+/, '');
    };

    const isAuthorMatch = (docAuthors, searchAuthor) => {
      if (!docAuthors) return false;
      
      const normalizeAuthor = (name) => {
        return name.toLowerCase()
          .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()'"""'']/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
      };

      const searchAuthorNorm = normalizeAuthor(searchAuthor);
      const searchAuthorMain = searchAuthorNorm.split(/\s+(?:and|und|\&|e)\s+/)[0];
      const searchParts = searchAuthorMain.split(' ').filter(p => p.length > 1);
      
      const requiredMatches = searchParts.length >= 3 ? 2 : 1;
      
      return docAuthors.some(author => {
        const authorNorm = normalizeAuthor(author);
        const matchingParts = searchParts.filter(part => 
          authorNorm.includes(part) &&
          (authorNorm.includes(` ${part} `) || 
           authorNorm.startsWith(`${part} `) || 
           authorNorm.endsWith(` ${part}`))
        );
        return matchingParts.length >= requiredMatches;
      });
    };

    const bestMatch = data.docs?.find(doc => {
      const normalizedDocTitle = normalizeTitle(doc.title);
      const normalizedSearchTitle = normalizeTitle(title);
      
      const exactTitleMatch = normalizedDocTitle === normalizedSearchTitle;
      
      const titleMatch = exactTitleMatch || (
        normalizedDocTitle.includes(normalizedSearchTitle) &&
        normalizedDocTitle.split(' ').length - normalizedSearchTitle.split(' ').length <= 2
      );
      
      const authorMatch = isAuthorMatch(doc.author_name, author);

      console.log(chalk.gray(`\nChecking match for "${doc.title}":`));
      console.log(chalk.gray(`  Normalized doc title: "${normalizedDocTitle}"`));
      console.log(chalk.gray(`  Normalized search title: "${normalizedSearchTitle}"`));
      console.log(chalk.gray(`  Title match: ${titleMatch}, Author match: ${authorMatch}`));
      
      if (normalizedSearchTitle.split(' ').length <= 2) {
        return exactTitleMatch && authorMatch;
      }
      
      return titleMatch && authorMatch;
    });

    if (!bestMatch) {
      console.log(chalk.yellow('No matches found after applying strict matching criteria'));
      return '';
    }

    console.log(chalk.green('\nFound matching book:'));
    console.log(chalk.gray(`  Title: ${bestMatch.title}`));
    console.log(chalk.gray(`  Author(s): ${bestMatch.author_name?.join(', ')}`));

    const coverSources = [];
    
    if (bestMatch.cover_i) {
      coverSources.push({
        type: 'cover_i',
        url: `https://covers.openlibrary.org/b/id/${bestMatch.cover_i}-L.jpg`
      });
    }

    if (bestMatch.cover_edition_key) {
      coverSources.push({
        type: 'cover_edition_key',
        url: `https://covers.openlibrary.org/b/olid/${bestMatch.cover_edition_key}-L.jpg`
      });
    }

    if (bestMatch.edition_key?.[0]) {
      coverSources.push({
        type: 'edition_key',
        url: `https://covers.openlibrary.org/b/olid/${bestMatch.edition_key[0]}-L.jpg`
      });
    }

    if (bestMatch.isbn?.length > 0) {
      coverSources.push({
        type: 'isbn_first',
        url: `https://covers.openlibrary.org/b/isbn/${bestMatch.isbn[0]}-L.jpg`
      });
      
      if (bestMatch.isbn.length > 1) {
        coverSources.push({
          type: 'isbn_last',
          url: `https://covers.openlibrary.org/b/isbn/${bestMatch.isbn[bestMatch.isbn.length - 1]}-L.jpg`
        });
      }
    }

    console.log(chalk.gray('\nTrying cover sources in order:'));
    for (const source of coverSources) {
      console.log(chalk.gray(`  ${source.type}: ${source.url}`));
    }

    if (coverSources.length > 1) {
      return coverSources.map(source => source.url);
    } else if (coverSources.length === 1) {
      return coverSources[0].url;
    }

    console.log(chalk.yellow('No cover sources found for the matching book'));
    return '';
    
  } catch (error) {
    console.error(chalk.red(`Error fetching cover for "${title}" by ${author}:`), error.message);
    return '';
  }
}

async function processFile(filename) {
  const filePath = path.join(CONTENT_DIR, filename);
  let fileContent;
  
  try {
    fileContent = await fs.readFile(filePath, 'utf-8');
  } catch (error) {
    console.error(chalk.red(`Failed to read ${filename}:`), error.message);
    return { success: false, hasValidCover: false };
  }
  
  let data, content;
  try {
    ({ data, content } = matter(fileContent));
  } catch (error) {
    console.error(chalk.red(`Failed to parse frontmatter in ${filename}:`), error.message);
    return { success: false, hasValidCover: false };
  }
  
  const { title, author } = data;
  
  if (!title || !author) {
    console.warn(chalk.yellow(`Skipping ${filename}: Missing title or author in frontmatter`));
    return { success: false, hasValidCover: false };
  }
  
  const baseFilename = path.basename(filename, '.md');
  
  const existingJpg = path.join(COVERS_DIR, `${baseFilename}.jpg`);
  const existingPng = path.join(COVERS_DIR, `${baseFilename}.png`);
  
  try {
    const [jpgExists, pngExists] = await Promise.all([
      fs.access(existingJpg).then(() => true).catch(() => false),
      fs.access(existingPng).then(() => true).catch(() => false)
    ]);
    
    if ((jpgExists || pngExists) && !process.env.FORCE_UPDATE) {
      console.log(chalk.gray(`Skipping ${filename}: Cover image already exists`));
      return { success: false, hasValidCover: true };
    }
  } catch (error) {
    console.error(chalk.red(`Error checking existing cover:`, error.message));
  }
  
  const primaryAuthor = author
    .split(/,|\sand\s|\sund\s/)
    .map(author => author.trim())
    .filter(author => author.length > 0)[0];
  
  console.log(chalk.blue(`Processing: "${title}" by ${primaryAuthor}" (from full author: ${author})`));
  const coverUrls = await fetchBookCover(title, primaryAuthor);
  
  let coverImagePath = '';
  
  if (Array.isArray(coverUrls)) {
    for (const url of coverUrls) {
      const imageData = await downloadAndVerifyImage(url);
      if (imageData) {
        const coverPath = path.join(COVERS_DIR, `${baseFilename}.${imageData.format}`);
        await fs.writeFile(coverPath, imageData.buffer);
        coverImagePath = coverPath;
        break;
      }
    }
  } else if (coverUrls) {
    const imageData = await downloadAndVerifyImage(coverUrls);
    if (imageData) {
      const coverPath = path.join(COVERS_DIR, `${baseFilename}.${imageData.format}`);
      await fs.writeFile(coverPath, imageData.buffer);
      coverImagePath = coverPath;
    }
  }
  
  if (!coverImagePath) {
    console.log(chalk.yellow(`No valid cover found for ${filename}`));
    return { success: false, hasValidCover: false };
  }
  
  try {
    const { coverUrl, ...restData } = data;
    const updatedFrontmatter = {
      ...restData,
      lastUpdated: new Date().toISOString()
    };
    
    const updatedContent = matter.stringify(content, updatedFrontmatter);
    await fs.writeFile(filePath, updatedContent);
    
    const relativePath = path.relative(process.cwd(), coverImagePath);
    console.log(chalk.green(`Updated ${filename} and saved cover to ${relativePath}`));
    return { success: true, hasValidCover: true };
  } catch (error) {
    console.error(chalk.red(`Failed to update ${filename}:`), error.message);
    return { success: false, hasValidCover: false };
  }
}

async function processFileChunk(files, startIdx) {
  const chunk = files.slice(startIdx, startIdx + CONCURRENT_BOOKS);
  const results = await Promise.all(chunk.map(file => processFile(file)));
  
  return results.reduce((acc, result) => ({
    updated: acc.updated + (result.success ? 1 : 0),
    validCovers: acc.validCovers + (result.hasValidCover ? 1 : 0)
  }), { updated: 0, validCovers: 0 });
}

async function main() {
  try {
    console.log(chalk.blue('Starting book cover download process...'));
    
    await ensureDirectoryExists(COVERS_DIR);
    
    const files = await getMarkdownFiles();
    console.log(chalk.blue(`Found ${files.length} markdown files to process`));
    
    let totalUpdated = 0;
    let totalValidCovers = 0;
    
    for (let i = 0; i < files.length; i += CONCURRENT_BOOKS) {
      console.log(chalk.gray(`\nProcessing files ${i + 1}-${Math.min(i + CONCURRENT_BOOKS, files.length)} of ${files.length}`));
      
      const { updated, validCovers } = await processFileChunk(files, i);
      totalUpdated += updated;
      totalValidCovers += validCovers;
    }
    
    console.log(chalk.green('\nProcess completed!'));
    console.log(chalk.blue(`Summary:
      Files processed: ${files.length}
      Files updated: ${totalUpdated}
      Books with valid covers: ${totalValidCovers}
    `));
  } catch (error) {
    console.error(chalk.red('\nError processing files:'), error);
    process.exit(1);
  }
}

process.on('SIGINT', () => {
  console.log(chalk.yellow('\nProcess interrupted. Cleaning up...'));
  process.exit(0);
});

main();
