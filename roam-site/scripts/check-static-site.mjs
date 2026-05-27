import { readFile, stat } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();

const requiredFiles = ["index.html", "vercel.json", "app.js", "styles.css", "vendor/supabase.min.js"];

async function exists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const missing = [];

  for (const file of requiredFiles) {
    const fullPath = path.join(root, file);
    if (!(await exists(fullPath))) {
      missing.push(file);
    }
  }

  if (missing.length) {
    console.error("Missing required files:", missing.join(", "));
    if (missing.includes("vendor/supabase.min.js")) {
      console.error("  Run: node scripts/vendor-supabase.mjs");
    }
    process.exit(1);
  }

  const html = await readFile(path.join(root, "index.html"), "utf8");
  const normalizedHtml = html.toLowerCase();
  const requiredSnippets = [
    "<!doctype html>",
    "<title>roam",
    "app.js",
    "styles.css",
    "vendor/supabase.min.js"
  ];

  const missingSnippets = requiredSnippets.filter(
    (snippet) => !normalizedHtml.includes(snippet)
  );
  if (missingSnippets.length) {
    const label = "index.html is missing expected app markers:";
    console.error(label);
    for (const snippet of missingSnippets) {
      console.error("- " + snippet);
    }
    process.exit(1);
  }

  console.log("Static site check passed.");
}

main().catch((error) => {
  console.error("Check failed:", error);
  process.exit(1);
});
