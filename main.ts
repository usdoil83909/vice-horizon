import { cp, mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { buildDossier } from "./vendor/makefun-game.ts";

const root = resolve(process.env.MAKEFUN_BOT_DIR ?? ".");
const outputValue = process.env.MAKEFUN_OUTPUT_DIR ?? "./out";
if (outputValue.trim() === "") throw new Error("MAKEFUN_OUTPUT_DIR cannot be empty");
const output = resolve(outputValue);
const copy = async (source: string, target: string) => {
  if (existsSync(source)) await cp(source, target, { recursive: true, force: true });
};

try {
  await mkdir(output, { recursive: true });
  await copy(join(root, "game"), join(output, "game"));
  await copy(join(root, "screenshots"), join(output, "screenshots"));
  await copy(join(root, "shots.json"), join(output, "shots.json"));
  const dossier = await buildDossier(output, { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 } });
  await writeFile(join(output, "dossier.json"), dossier);
  console.log(`Built ${output}`);
  console.log(`Dossier: ${join(output, "dossier.json")}`);
  console.log("FINAL-DONE");
} catch (error) {
  console.error(`Build failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
