import { readdir, readFile, stat } from 'node:fs/promises';
import { join, relative, extname } from 'node:path';

type Options = { text_max_bytes?: number; screenshots?: { max?: number; max_bytes?: number } };
const sourceTypes = new Set(['.html', '.js', '.mjs', '.css', '.json', '.glsl', '.vert', '.frag', '.wgsl']);
const pictureTypes = new Set(['.png', '.jpg', '.jpeg']);

async function walk(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  entries.sort((left, right) => left.name.localeCompare(right.name));
  const paths: string[] = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) paths.push(...await walk(path));
    if (entry.isFile()) paths.push(path);
  }
  return paths;
}

export async function buildDossier(outputDir: string, opts: Options = {}): Promise<string> {
  const gameRoot = join(outputDir, 'game');
  const shotRoot = join(outputDir, 'screenshots');
  const textCap = Math.max(0, opts.text_max_bytes ?? 163840);
  const imageCap = Math.max(0, opts.screenshots?.max_bytes ?? 262144);
  const imageCount = Math.max(0, opts.screenshots?.max ?? 4);
  const files: Array<{ path: string; bytes: number }> = [];
  const sources: Array<{ path: string; bytes: number; text: string }> = [];
  for (const path of await walk(gameRoot)) {
    const bytes = (await stat(path)).size;
    const entry = { path: relative(gameRoot, path), bytes };
    files.push(entry);
    if (sourceTypes.has(extname(path).toLowerCase()) && bytes <= textCap) {
      sources.push({ ...entry, text: await readFile(path, 'utf8') });
    }
  }
  const screenshots: Array<{ name: string; bytes: number }> = [];
  let cover: string | null = null;
  const pictures = await walk(shotRoot).catch((error: NodeJS.ErrnoException) => {
    if (error.code === 'ENOENT') return [];
    throw error;
  });
  for (const path of pictures.filter(path => pictureTypes.has(extname(path).toLowerCase())).slice(0, imageCount)) {
    const bytes = (await stat(path)).size;
    if (bytes > imageCap) continue;
    screenshots.push({ name: relative(shotRoot, path), bytes });
    if (cover === null) cover = (await readFile(path)).toString('base64');
  }
  return JSON.stringify({ schema: 'makefun/dossier/v1', game: { files, sources }, screenshots, cover }, null, 2);
}
