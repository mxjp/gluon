import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const root = join(fileURLToPath(import.meta.url), "../..");
const packageJsonFilename = join(root, "package.json");
const packageJson = JSON.parse(readFileSync(packageJsonFilename));
delete packageJson.scripts;
delete packageJson.devDependencies;
writeFileSync(packageJsonFilename, JSON.stringify(packageJson, null, "\t") + "\n");
