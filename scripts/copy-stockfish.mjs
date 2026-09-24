import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(root, "node_modules", "stockfish.js");
const publicDir = path.join(root, "public");
fs.mkdirSync(publicDir, { recursive: true });
for (const file of ["stockfish.wasm.js", "stockfish.wasm", "Copying.txt"]) {
  fs.copyFileSync(path.join(source, file), path.join(publicDir, file));
}
console.log("Stockfish.js engine copied to public/");
