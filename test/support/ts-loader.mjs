/**
 * Custom TypeScript loader that rewrites .js extensions to .ts
 * for integration tests.
 */

import { stat } from "node:fs/promises";
import { pathToFileURL } from "node:url";

/** @type {Map<string, string>} */
const cache = new Map();

/**
 * Resolve .js to .ts if the .ts file exists
 * @param {string} specifier 
 * @param {import('node:module').ParentURL | null { 
 * @param {import('node:module').LoadHookOptions} options 
 * @returns {Promise<import('node:module').LoadHookResult>}
 */
export async function load(specifier, context, nextLoad) {
  // Try to resolve .js → .ts
  if (specifier.endsWith(".js")) {
    const tsSpecifier = specifier.replace(/\.js$/, ".ts");
    
    try {
      const url = new URL(tsSpecifier);
      await stat(url);
      // .ts file exists, use it instead
      return nextLoad(tsSpecifier, context);
    } catch {
      // .ts doesn't exist, fall through to original
    }
  }

  return nextLoad(specifier, context);
}