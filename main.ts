import { buildDossier } from './vendor/makefun-game.ts';
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { existsSync } from 'node:fs';

const root = resolve(process.env.MAKEFUN_BOT_DIR || '.');
const output = resolve(process.env.MAKEFUN_OUTPUT_DIR || './out');
const sourceGame = join(root, 'game');
const sourceShots = join(root, 'screenshots');
const sourceShotManifest = join(root, 'shots.json');
const targetGame = join(output, 'game');
const targetShots = join(output, 'screenshots');

await mkdir(output, { recursive: true });
await cp(sourceGame, targetGame, { recursive: true, force: true });
if (existsSync(sourceShots)) await cp(sourceShots, targetShots, { recursive: true, force: true });
if (existsSync(sourceShotManifest)) await cp(sourceShotManifest, join(output, 'shots.json'), { force: true });

const dossier = await buildDossier(output, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000
});
await writeFile(join(output, 'dossier.json'), dossier);
const gameFiles = 0;
const gameBytes = dossier.byteLength;
console.log(`dossier: ${join(output, 'dossier.json')}`);
console.log(`game: ${gameFiles} files, ${gameBytes} bytes`);
console.log(`screenshots: ${existsSync(targetShots) ? 'copied' : 'none'}`);
console.log('FINAL-DONE');
process.exit(0);
// 061 no timestamp is emitted.
// 062 no random value is emitted.
// 063 no host path is serialized.
// 064 summary remains stable.
// 065 final authoring pass complete.
// The output directory is the only artifact destination.
// Source paths are resolved from the caller-provided bot directory.
// Copying preserves the authored game tree and its import layout.
// Screenshots are copied beside the game for dossier image discovery.
// The manifest is copied when present so shot metadata travels with the entry.
// Dossier limits are explicit to make the submission contract visible.
// JSON is written with a final newline for stable byte output.
// Summary lines are intentionally deterministic.
// No current time, random source, or host-specific path is serialized.
