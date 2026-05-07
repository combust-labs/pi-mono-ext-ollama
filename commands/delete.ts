// SPDX-License-Identifier: Apache-2.0
// Copyright 2025

/**
 * /ollama-delete command - Delete a model and its data
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { loadConfig } from "../config.js";
import { deleteModel } from "../client.js";

/**
 * Register the /ollama-delete command
 */
export function registerOllamaDeleteCommand(pi: ExtensionAPI): void {
  pi.registerCommand("ollama-delete", {
    description: "Delete a model and its data (e.g., /ollama-delete llama3.2:3b)",
    getArgumentCompletions: () => null,

    async handler(
      args: string,
      ctx: { ui: { confirm(message: string, description?: string): Promise<boolean>; notify(message: string, type?: string): void } }
    ): Promise<void> {
      const modelName = args.trim();

      if (!modelName) {
        ctx.ui.notify("Usage: /ollama-delete <model-name>\nExample: /ollama-delete llama3.2:3b", "warning");
        return;
      }

      const confirmed = await ctx.ui.confirm(
        `Delete model: ${modelName}?`,
        "This action cannot be undone and will remove all model data."
      );

      if (!confirmed) {
        ctx.ui.notify("Delete cancelled", "info");
        return;
      }

      try {
        const config = await loadConfig();
        ctx.ui.notify(`Deleting model ${modelName}...`, "info");

        await deleteModel(config, modelName);

        ctx.ui.notify(`Successfully deleted model: ${modelName}`, "info");
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        ctx.ui.notify(`Failed to delete model: ${message}`, "error");
      }
    },
  });
}