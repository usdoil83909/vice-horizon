import { buildDossier, readGameTree } from './vendor/makefun-game.ts';
import { cp, mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(process.env.MAKEFUN_BOT_DIR ?? '.');
const outputValue = process.env.MAKEFUN_OUTPUT_DIR ?? './out';
if (outputValue.trim() === '') throw new Error('MAKEFUN_OUTPUT_DIR must not be empty');
const output = resolve(outputValue);
const game = join(root, 'game');
const screenshots = join(root, 'screenshots');

await mkdir(output, { recursive: true });
await cp(game, join(output, 'game'), { recursive: true, force: true });
if (existsSync(screenshots)) await cp(screenshots, join(output, 'screenshots'), { recursive: true, force: true });
if (existsSync(join(root, 'shots.json'))) await cp(join(root, 'shots.json'), join(output, 'shots.json'), { force: true });

const dossier = buildDossier(output, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
await writeFile(join(output, 'dossier.json'), dossier);

const tree = readGameTree(join(output, 'game'));
console.log(`dossier: ${join(output, 'dossier.json')}`);
console.log(`game: ${tree.files.length} files, ${tree.totalBytes} bytes`);
console.log(`screenshots: ${existsSync(join(output, 'screenshots')) ? 'copied' : 'none'}`);
console.log('FINAL-DONE');
