/**
 * Register the .js → .ts loader hook for integration tests.
 * 
 * Usage: node --experimental-transform-types --import ./test/support/register-loader.mjs --test test/integration/*.test.ts
 */

import { register } from "node:module";
import { pathToFileURL } from "node:url";

const __dirname = pathToFileURL("./").pathname;

register(new URL("./ts-loader.mjs", import.meta.url));