import { cpSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { buildDossier, readGameTree } from './vendor/makefun-game.ts';

const project = fileURLToPath(new URL('.', import.meta.url));
const destination = resolve(process.env.MAKEFUN_OUTPUT_DIR || '/output');
const caps = {
  text_max_bytes: 160 * 1024,
  screenshots: { max: 4, max_bytes: 256 * 1024 },
  game_max_files: 993,
  game_max_bytes: 48 * 1024 * 1024,
  game_path_max_bytes: 1000,
};

mkdirSync(destination, { recursive: true });
cpSync(resolve(project, 'game'), resolve(destination, 'game'), { recursive: true });
cpSync(resolve(project, 'screenshots'), resolve(destination, 'screenshots'), { recursive: true });
const dossier = buildDossier(destination, caps);
writeFileSync(resolve(destination, 'dossier.json'), dossier);

const tree = readGameTree(resolve(destination, 'game'), caps);
const captures = readdirSync(resolve(destination, 'screenshots')).sort();
console.log(`VICE HORIZON export: ${destination}`);
console.log(`Game: ${tree.files.length} files, ${tree.directories.length} directories, ${tree.totalBytes} bytes`);
for (const name of captures) console.log(`Screenshot: ${name} ${statSync(resolve(destination, 'screenshots', name)).size} bytes`);
console.log(`Dossier: ${readFileSync(resolve(destination, 'dossier.json')).byteLength} bytes`);
