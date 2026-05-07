// SPDX-License-Identifier: Apache-2.0
// Copyright 2025

/**
 * /ollama-pull command - Pull a model from the Ollama library
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { loadConfig } from "../config.js";
import { pullModel } from "../client.js";

/**
 * Format bytes to human-readable size
 */
function formatSize(bytes: number): string {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let unitIndex = 0;
  let size = bytes;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)}${units[unitIndex]}`;
}

/**
 * Register the /ollama-pull command
 */
export function registerOllamaPullCommand(pi: ExtensionAPI): void {
  pi.registerCommand("ollama-pull", {
    description: "Pull a model from the Ollama library (e.g., /ollama-pull llama3.2:3b)",
    getArgumentCompletions: (prefix: string) => {
      // Suggest common models
      const commonModels = [
        "llama3.2",
        "llama3.2:3b",
        "llama3.2:1b",
        "llama3.1",
        "llama3.1:8b",
        "mistral",
        "codellama:code",
        "codellama",
        "phi3",
        "qwen2.5",
        "deepseek-r1",
        "deepseek-r1:7b",
        "nomic-embed-text",
      ];

      const filtered = commonModels.filter((m) => m.startsWith(prefix));
      return filtered.map((value) => ({ value, label: value }));
    },

    async handler(args: string, ctx: { ui: { notify(message: string, type?: string): void } }): Promise<void> {
      const modelName = args.trim();

      if (!modelName) {
        ctx.ui.notify("Usage: /ollama-pull <model-name>\nExample: /ollama-pull llama3.2:3b", "warning");
        return;
      }

      ctx.ui.notify(`Pulling model: ${modelName}...`, "info");

      try {
        const config = await loadConfig();
        let lastStatus = "";
        let totalBytes = 0;
        let completedBytes = 0;

        for await (const progress of pullModel(config, modelName, true)) {
          if (progress.status !== lastStatus) {
            lastStatus = progress.status;
            ctx.ui.notify(`Pulling ${modelName}: ${progress.status}`, "info");
          }

          if (progress.total) {
            totalBytes = progress.total;
            completedBytes = progress.completed || 0;

            if (totalBytes > 0) {
              const percent = Math.round((completedBytes / totalBytes) * 100);
              // Only show progress for significant chunks
              if (percent % 10 === 0) {
                const sizeStr = formatSize(completedBytes) + " / " + formatSize(totalBytes);
                ctx.ui.notify(`Progress: ${percent}% (${sizeStr})`, "info");
              }
            }
          }
        }

        ctx.ui.notify(`Successfully pulled model: ${modelName}`, "info");
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        ctx.ui.notify(`Failed to pull model: ${message}`, "error");
      }
    },
  });
}