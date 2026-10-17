// Catalog parity check: every en.json key must exist in ar.json (and vice
// versa), ignoring plural suffixes; no value may be an empty string.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const dir = join(here, "..", "src", "i18n", "locales");

const PLURAL = /_(zero|one|two|few|many|other)$/;

function flatten(obj, prefix = "", out = new Map()) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object") flatten(v, key, out);
    else out.set(key.replace(PLURAL, ""), v);
  }
  return out;
}

const en = flatten(JSON.parse(readFileSync(join(dir, "en.json"), "utf8")));
const ar = flatten(JSON.parse(readFileSync(join(dir, "ar.json"), "utf8")));

let failed = false;

for (const key of en.keys()) {
  if (!ar.has(key)) {
    console.error(`missing in ar.json: ${key}`);
    failed = true;
  }
}
for (const key of ar.keys()) {
  if (!en.has(key)) {
    console.error(`extra in ar.json: ${key}`);
    failed = true;
  }
}
for (const [file, map] of [["en.json", en], ["ar.json", ar]]) {
  for (const [key, value] of map) {
    if (typeof value === "string" && value.trim() === "") {
      console.error(`empty value in ${file}: ${key}`);
      failed = true;
    }
  }
}

if (failed) process.exit(1);
console.log(`i18n catalogs OK (${en.size} keys)`);
