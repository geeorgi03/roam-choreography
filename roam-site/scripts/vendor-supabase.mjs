/**
 * vendor-supabase.mjs
 *
 * Downloads a pinned version of @supabase/supabase-js into ./vendor/
 * so the app never depends on a live CDN at runtime.
 *
 * Run once (or whenever bumping the version):
 *   node scripts/vendor-supabase.mjs
 */

import { createWriteStream, mkdirSync } from "node:fs";
import { get } from "node:https";
import { join } from "node:path";

const SUPABASE_VERSION = "2.49.1";
const URL = `https://cdn.jsdelivr.net/npm/@supabase/supabase-js@${SUPABASE_VERSION}/dist/umd/supabase.min.js`;
const OUT_DIR = join(process.cwd(), "vendor");
const OUT_FILE = join(OUT_DIR, "supabase.min.js");

mkdirSync(OUT_DIR, { recursive: true });

console.log(`Downloading @supabase/supabase-js@${SUPABASE_VERSION}...`);

get(URL, (res) => {
  if (res.statusCode !== 200) {
    console.error(`Download failed: HTTP ${res.statusCode}`);
    process.exit(1);
  }
  const file = createWriteStream(OUT_FILE);
  res.pipe(file);
  file.on("finish", () => {
    file.close();
    console.log(`Saved to: ${OUT_FILE}`);
    console.log("Done. The vendor file is now referenced by index.html.");
    console.log("Commit vendor/supabase.min.js to your repository for reproducible builds.");
  });
}).on("error", (err) => {
  console.error("Download error:", err.message);
  process.exit(1);
});
