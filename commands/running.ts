// SPDX-License-Identifier: Apache-2.0
// Copyright 2025

/**
 * /ollama-running command - List currently loaded models in memory
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { loadConfig } from "../config.js";
import { listRunningModels } from "../client.js";

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
 * Format expiry date
 */
function formatExpiry(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = date.getTime() - now.getTime();

    if (diff < 0) {
      return "expired";
    }

    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) {
      return `${minutes}m`;
    }

    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return `${hours}h`;
    }

    return `${Math.floor(hours / 24)}d`;
  } catch {
    return dateStr;
  }
}

/**
 * Register the /ollama-running command
 */
export function registerOllamaRunningCommand(pi: ExtensionAPI): void {
  pi.registerCommand("ollama-running", {
    description: "List currently loaded Ollama models in memory",
    getArgumentCompletions: () => null,

    async handler(_args: string, ctx: { ui: { notify(message: string, type?: string): void } }): Promise<void> {
      try {
        const config = await loadConfig();
        const response = await listRunningModels(config);
        const models = response.models || [];

        if (models.length === 0) {
          ctx.ui.notify("No models currently loaded in memory", "info");
          return;
        }

        const lines = models.map((model) => {
          const size = formatSize(model.size);
          const vram = model.size_vram ? ` (VRAM: ${formatSize(model.size_vram)})` : "";
          const expiry = formatExpiry(model.expires_at);
          return `  • ${model.name} - ${size}${vram}, expires in ${expiry}`;
        });

        const message = `Running Models:\n${lines.join("\n")}`;
        ctx.ui.notify(message, "info");
        ctx.ui.notify(`Currently running ${models.length} model(s)`, "info");
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        ctx.ui.notify(`Failed to list running models: ${message}`, "error");
      }
    },
  });
}