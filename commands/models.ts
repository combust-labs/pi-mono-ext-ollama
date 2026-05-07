// SPDX-License-Identifier: Apache-2.0

/**
 * /ollama-models command - List all locally available models
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import type { OllamaModel } from "../types.js";
import { loadConfig } from "../config.js";
import { listModels } from "../client.js";

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
 * Format date to readable string
 */
function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toISOString().split("T")[0];
  } catch {
    return dateStr;
  }
}

/**
 * Format model list for display
 */
function formatModelList(models: OllamaModel[]): string {
  if (models.length === 0) {
    return "No models found. Pull a model first using /ollama-pull";
  }

  const lines = models.map((model) => {
    const size = formatSize(model.size);
    const modified = formatDate(model.modified_at);
    const details = model.details
      ? ` (${model.details.parameter_size}, ${model.details.quantization_level})`
      : "";
    return `  • ${model.name}${details} - ${size}, modified ${modified}`;
  });

  return `Available Models:\n${lines.join("\n")}`;
}

/**
 * Register the /ollama-models command
 */
export function registerOllamaModelsCommand(pi: ExtensionAPI): void {
  pi.registerCommand("ollama-models", {
    description: "List all locally available Ollama models",
    getArgumentCompletions: () => null,

    async handler(_args: string, ctx: { ui: { notify(message: string, type?: string): void } }): Promise<void> {
      try {
        const config = await loadConfig();
        const response = await listModels(config);
        const models = response.models || [];

        const message = formatModelList(models);
        ctx.ui.notify(message, "info");

        if (models.length > 0) {
          ctx.ui.notify(`Found ${models.length} model(s)`, "info");
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        ctx.ui.notify(`Failed to list models: ${message}`, "error");
      }
    },
  });
}