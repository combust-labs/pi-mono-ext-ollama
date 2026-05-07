// SPDX-License-Identifier: Apache-2.0

/**
 * /ollama-version command - Show Ollama server version
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { loadConfig } from "../config.js";
import { getVersion } from "../client.js";

/**
 * Register the /ollama-version command
 */
export function registerOllamaVersionCommand(pi: ExtensionAPI): void {
  pi.registerCommand("ollama-version", {
    description: "Show the Ollama server version",
    getArgumentCompletions: () => null,

    async handler(_args: string, ctx: { ui: { notify(message: string, type?: string): void } }): Promise<void> {
      try {
        const config = await loadConfig();
        const response = await getVersion(config);

        ctx.ui.notify(`Ollama Version: ${response.version}`, "info");
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        ctx.ui.notify(`Failed to get version: ${message}`, "error");
      }
    },
  });
}