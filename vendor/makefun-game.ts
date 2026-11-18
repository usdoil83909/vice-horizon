import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative } from "node:path";

type Options = { text_max_bytes?: number; screenshots?: { max?: number; max_bytes?: number } };
const textExt = new Set([".html", ".js", ".mjs", ".css", ".json", ".glsl", ".vert", ".frag", ".wgsl"]);
const imageExt = new Set([".png", ".jpg", ".jpeg"]);

async function files(root: string): Promise<string[]> {
  const answer: string[] = [];
  async function visit(dir: string): Promise<void> {
    for (const entry of (await readdir(dir, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) await visit(path);
      else if (entry.isFile()) answer.push(path);
    }
  }
  await visit(root);
  return answer;
}

export async function buildDossier(outputDir: string, opts: Options = {}): Promise<string> {
  const limit = opts.text_max_bytes ?? 163840;
  const imageLimit = opts.screenshots?.max_bytes ?? 262144;
  const imageCount = opts.screenshots?.max ?? 4;
  const gameDir = join(outputDir, "game");
  const shotDir = join(outputDir, "screenshots");
  const gamePaths = await files(gameDir);
  const shotPaths = await files(shotDir).catch(() => [] as string[]);
  const sources: Array<{ path: string; bytes: number; text: string }> = [];
  for (const path of gamePaths) {
    const data = await readFile(path);
    const ext = path.slice(path.lastIndexOf(".")).toLowerCase();
    if (textExt.has(ext) && data.length <= limit) sources.push({ path: relative(gameDir, path), bytes: data.length, text: data.toString("utf8") });
  }
  const screenshots: Array<{ name: string; bytes: number; base64: string }> = [];
  for (const path of shotPaths.filter((p) => imageExt.has(p.slice(p.lastIndexOf(".")).toLowerCase())).slice(0, imageCount)) {
    const data = await readFile(path);
    if (data.length <= imageLimit) screenshots.push({ name: relative(shotDir, path), bytes: data.length, base64: data.toString("base64") });
  }
  const gameFiles = [];
  for (const path of gamePaths) gameFiles.push({ path: relative(gameDir, path), bytes: (await stat(path)).size });
  const payload = {
    schema: "makefun/dossier/v1",
    game: { files: gameFiles, sources },
    screenshots: screenshots.map(({ name, bytes }) => ({ name, bytes })),
    cover: screenshots[0]?.base64 ?? null,
  };
  return JSON.stringify(payload, null, 2);
}
