import { mkdir, readdir, copyFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
const require = createRequire(import.meta.url);
const source = dirname(require.resolve("@mediapipe/hands/package.json"));
const target = join(process.cwd(), "public", "hand-tracking");
await mkdir(target, { recursive: true });
for (const file of await readdir(source)) {
  if (/\.(js|wasm|data|tflite|binarypb)$/.test(file))
    await copyFile(join(source, file), join(target, file));
}
await copyFile(
  join(process.cwd(), "licenses", "mediapipe-APACHE-2.0.txt"),
  join(target, "LICENSE.txt"),
);
console.log(
  "Local hand tracking assets ready. No external model downloads needed.",
);
