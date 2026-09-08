import { mkdir, copyFile, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const dist = join(root, "dist");
const files = [
  "index.html",
  "styles.css",
  "normalizer.js",
  "menu-reader.js",
  "menu-parser.js",
  "menu-validator.js",
  "menu-persistence.js",
  "menu-importer.js",
  "app.js"
];

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

for (const file of files) {
  await copyFile(join(root, file), join(dist, file));
}
