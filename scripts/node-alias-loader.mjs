import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    const target = path.join(projectRoot, "src", specifier.slice(2));
    const candidate = target.includes(".") ? target : `${target}.js`;

    if (fs.existsSync(candidate)) {
      return { url: pathToFileURL(candidate).href, shortCircuit: true };
    }

    const dirCandidate = path.join(target, "index.js");
    if (fs.existsSync(dirCandidate)) {
      return { url: pathToFileURL(dirCandidate).href, shortCircuit: true };
    }
  }

  return nextResolve(specifier, context);
}
