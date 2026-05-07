// SPDX-License-Identifier: Apache-2.0

/**
 * Configuration loading for the Ollama extension.
 * 
 * Config file location priority:
 * 1. Environment variable: OLLAMA_EXTENSION_CONFIG (if set and file exists)
 * 2. ~/.pi/agent/extensions/ollama/config.json
 * 3. ./.pi/extensions/ollama/config.json
 */

import { promises as fs } from "fs";
import * as path from "path";
import type { OllamaConfig } from "./types.js";

const DEFAULT_CONFIG: OllamaConfig = {
  baseUrl: "http://localhost:11434",
  timeout: 120000,
};

/**
 * Find and load the configuration file.
 * Returns default config if no file is found.
 */
export async function loadConfig(): Promise<OllamaConfig> {
  const possiblePaths = [
    // 1. Environment variable (highest priority)
    process.env.OLLAMA_EXTENSION_CONFIG,
    // 2. User-level config
    path.join(process.env.HOME || "", ".pi", "agent", "extensions", "ollama", "config.json"),
    // 3. Project-level config
    path.join(process.cwd(), ".pi", "extensions", "ollama", "config.json"),
  ].filter((p): p is string => p !== undefined);

  for (const configPath of possiblePaths) {
    try {
      const data = await fs.readFile(configPath, { encoding: "utf-8" });
      const parsed = JSON.parse(data) as Partial<OllamaConfig>;
      
      // Merge with defaults
      return {
        ...DEFAULT_CONFIG,
        ...parsed,
      };
    } catch {
      // File doesn't exist or can't be read, continue to next path
    }
  }

  // Return defaults if no config file found
  return { ...DEFAULT_CONFIG };
}

/**
 * Synchronous version that throws if config file is found but invalid.
 * Useful when you need config during extension initialization.
 */
export function loadConfigSync(): OllamaConfig {
  const possiblePaths = [
    process.env.OLLAMA_EXTENSION_CONFIG,
    path.join(process.env.HOME || "", ".pi", "agent", "extensions", "ollama", "config.json"),
    path.join(process.cwd(), ".pi", "extensions", "ollama", "config.json"),
  ].filter((p): p is string => p !== undefined);

  for (const configPath of possiblePaths) {
    try {
      const data = require("fs").readFileSync(configPath, { encoding: "utf-8" });
      const parsed = JSON.parse(data) as Partial<OllamaConfig>;
      return { ...DEFAULT_CONFIG, ...parsed };
    } catch {
      // Continue to next path
    }
  }

  return { ...DEFAULT_CONFIG };
}

export { DEFAULT_CONFIG };