import { cpSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { buildDossier } from './vendor/makefun-game.ts';

// The entry stays portable: the exported game uses only local browser modules.
const project = fileURLToPath(new URL('.', import.meta.url));
const destination = resolve(process.env.MAKEFUN_OUTPUT_DIR || '/output');
mkdirSync(destination, { recursive: true });
cpSync(resolve(project, 'game'), resolve(destination, 'game'), { recursive: true });
const captures = resolve(destination, 'screenshots');
mkdirSync(captures, { recursive: true });
if (existsSync(resolve(project, 'screenshots'))) {
  cpSync(resolve(project, 'screenshots'), captures, { recursive: true });
}
const limits = {
  text_max_bytes: 160 * 1024,
  screenshots: { max: 4, max_bytes: 256 * 1024 },
  game_max_files: 993,
  game_max_bytes: 48 * 1024 * 1024,
  game_path_max_bytes: 1000,
};
writeFileSync(resolve(destination, 'dossier.json'), buildDossier(destination, limits));
console.log('VICE HORIZON packaged at ' + destination);
