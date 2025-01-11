import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';
import matter from 'gray-matter';

const REPO_URL = 'git@github.com:aldesantis/digital-garden.git';
const CONTENT_DIR = path.join(process.cwd(), 'src', 'content');
const RETAIN_DIRS = ['essays', 'notes', 'nows', 'readwise', 'readwise/books'];

async function cleanDirectory(dir) {
  try {
    await fs.rm(dir, { recursive: true, force: true });
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
}

async function cloneRepository() {
  console.log('Cloning repository...');
  execSync(`git clone ${REPO_URL} ${CONTENT_DIR}`, { stdio: 'inherit' });
}

async function removeUnwantedDirs() {
  console.log('Removing unwanted directories...');
  const entries = await fs.readdir(CONTENT_DIR, { withFileTypes: true });
  
  for (const entry of entries) {
    if (entry.name === '.git' || entry.name.startsWith('.')) {
      await cleanDirectory(path.join(CONTENT_DIR, entry.name));
      continue;
    }
    
    if (entry.isDirectory() && !RETAIN_DIRS.includes(entry.name)) {
      await cleanDirectory(path.join(CONTENT_DIR, entry.name));
    }
  }
}

async function processMarkdownFiles() {
  console.log('Processing markdown files...');
  
  for (const dir of RETAIN_DIRS) {
    const dirPath = path.join(CONTENT_DIR, dir);
    
    try {
      const files = await fs.readdir(dirPath);
      
      for (const file of files) {
        if (!file.endsWith('.md')) continue;
        
        const filePath = path.join(dirPath, file);
        const content = await fs.readFile(filePath, 'utf8');
        
        // Parse frontmatter and content
        const { data, content: markdownContent } = matter(content);
        
        // Remove the first H1 heading
        const processedContent = markdownContent
          .replace(/^#\s+[^\n]+\n/, '')  // Remove first H1 heading
          .trim();
        
        // Reconstruct the file with frontmatter
        const newContent = matter.stringify(processedContent, data);
        
        // Write to new .mdx file
        const newFilePath = filePath.replace(/\.md$/, '.mdx');
        await fs.writeFile(newFilePath, newContent);
        
        // Remove original .md file
        await fs.unlink(filePath);
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error(`Error processing directory ${dir}:`, error);
      }
    }
  }
}

async function main() {
  try {
    await cleanDirectory(CONTENT_DIR);
    await cloneRepository();
    await removeUnwantedDirs();
    await processMarkdownFiles();
    console.log('Repository processing completed successfully!');
  } catch (error) {
    console.error('Error processing repository:', error);
    process.exit(1);
  }
}

main();
