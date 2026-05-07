// SPDX-License-Identifier: Apache-2.0
// Copyright 2025

/**
 * Test support utilities for Ollama extension integration tests.
 */

import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export type { } from "./mock-http.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Create a temporary directory for tests
 */
export function createTempDir(prefix: string = "pi-ollama-test-"): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

/**
 * Remove a temporary directory
 */
export function removeTempDir(dir: string): void {
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch {}
}

/**
 * Create a simple event bus for tests
 */
export function createEventBus() {
  const listeners = new Map<string, Set<(payload: unknown) => void>>();

  return {
    on(event: string, handler: (payload: unknown) => void) {
      const channelListeners = listeners.get(event) ?? new Set();
      channelListeners.add(handler);
      listeners.set(event, channelListeners);
      return () => {
        channelListeners.delete(handler);
        if (channelListeners.size === 0) listeners.delete(event);
      };
    },

    emit(event: string, payload: unknown) {
      for (const handler of listeners.get(event) ?? []) {
        handler(payload);
      }
    },
  };
}

/**
 * Try to dynamically import a module.
 * Returns null if the module is not found (for optional dependencies).
 */
export async function tryImport<T>(specifier: string): Promise<T | null> {
  const isBare = !(specifier.startsWith(".") || specifier.startsWith("/"));
  
  try {
    if (!isBare) {
      const projectRoot = path.resolve(__dirname, "..", "..");
      const abs = path.resolve(projectRoot, specifier);
      const url = pathToFileURL(abs).href;
      return await import(url) as T;
    }
    return await import(specifier) as T;
  } catch (error: unknown) {
    const code = typeof error === "object" && error !== null && "code" in error
      ? (error as { code?: unknown }).code
      : undefined;
    
    const isModuleNotFound = code === "MODULE_NOT_FOUND" || code === "ERR_MODULE_NOT_FOUND";
    
    if (isBare && isModuleNotFound) {
      return null;
    }
    
    throw error;
  }
}

/**
 * Write a test config file to a directory
 */
export function writeTestConfig(dir: string, config: object): void {
  const configDir = path.join(dir, ".pi", "extensions", "ollama");
  fs.mkdirSync(configDir, { recursive: true });
  fs.writeFileSync(
    path.join(configDir, "config.json"),
    JSON.stringify(config, null, 2),
    "utf-8"
  );
}

/**
 * Load configuration with test overrides
 */
export async function loadConfigWithOverrides(
  baseConfig: object,
  overrides?: object
): Promise<object> {
  return { ...baseConfig, ...overrides };
}