import { cp, mkdir, writeFile } from 'node:fs/promises';
import { resolve, join, relative, isAbsolute } from 'node:path';
import { buildDossier } from './vendor/makefun-game.ts';

async function build() {
  const source = resolve(process.env.MAKEFUN_BOT_DIR ?? '.');
  const setting = process.env.MAKEFUN_OUTPUT_DIR ?? './out';
  if (!setting.trim()) throw new Error('MAKEFUN_OUTPUT_DIR must name a directory');
  const destination = resolve(setting);
  const contains = (parent: string, child: string) => {
    const path = relative(parent, child);
    return path === '' || (!isAbsolute(path) && path !== '..' && !path.startsWith('../'));
  };
  if (contains(destination, source) || ['game', 'screenshots'].some(name => contains(join(source, name), destination))) {
    throw new Error('Choose an output directory outside the source game and screenshots');
  }
  await mkdir(destination, { recursive: true });
  for (const name of ['game', 'screenshots', 'shots.json']) {
    await cp(join(source, name), join(destination, name), { recursive: true, force: true });
  }
  const dossier = await buildDossier(destination, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 1048576 },
  });
  await writeFile(join(destination, 'dossier.json'), dossier, 'utf8');
  console.log(`Pearl City packaged in ${destination}: game, screenshots, and dossier.json`);
  console.log('FINAL-DONE');
}

build().catch(error => {
  console.error(`Packaging failed: ${error instanceof Error ? error.message : error}`);
  process.exitCode = 1;
});
