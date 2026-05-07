// SPDX-License-Identifier: Apache-2.0

/**
 * /ollama-copy command - Copy a model to a new name
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { loadConfig } from "../config.js";
import { copyModel } from "../client.js";

/**
 * Register the /ollama-copy command
 */
export function registerOllamaCopyCommand(pi: ExtensionAPI): void {
  pi.registerCommand("ollama-copy", {
    description: "Copy a model to a new name (e.g., /ollama-copy llama3.2 llama3.2-backup)",
    getArgumentCompletions: () => null,

    async handler(args: string, ctx: { ui: { notify(message: string, type?: string): void } }): Promise<void> {
      const parts = args.trim().split(/\s+/);

      if (parts.length < 2) {
        ctx.ui.notify(
          "Usage: /ollama-copy <source> <destination>\nExample: /ollama-copy llama3.2 llama3.2-backup",
          "warning"
        );
        return;
      }

      const source = parts[0];
      const destination = parts[1];

      try {
        const config = await loadConfig();
        ctx.ui.notify(`Copying ${source} to ${destination}...`, "info");

        await copyModel(config, { source, destination });

        ctx.ui.notify(`Successfully copied ${source} to ${destination}`, "info");
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        ctx.ui.notify(`Failed to copy model: ${message}`, "error");
      }
    },
  });
}