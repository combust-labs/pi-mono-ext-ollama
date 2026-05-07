// SPDX-License-Identifier: Apache-2.0
// Copyright 2025

/**
 * /ollama-show command - Show detailed information about a model
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { loadConfig } from "../config.js";
import { showModel } from "../client.js";

/**
 * Register the /ollama-show command
 */
export function registerOllamaShowCommand(pi: ExtensionAPI): void {
  pi.registerCommand("ollama-show", {
    description: "Show detailed information about a model (e.g., /ollama-show llama3.2)",
    getArgumentCompletions: () => null,

    async handler(args: string, ctx: { ui: { notify(message: string, type?: string): void } }): Promise<void> {
      const modelName = args.trim();

      if (!modelName) {
        ctx.ui.notify("Usage: /ollama-show <model-name>\nExample: /ollama-show llama3.2", "warning");
        return;
      }

      try {
        const config = await loadConfig();
        ctx.ui.notify(`Fetching info for ${modelName}...`, "info");

        const response = await showModel(config, modelName, true);

        const parts: string[] = [];
        parts.push(`Model: ${modelName}`);

        if (response.details) {
          const d = response.details;
          parts.push(`Format: ${d.format}`);
          parts.push(`Family: ${d.family}`);
          parts.push(`Parameter Size: ${d.parameter_size}`);
          parts.push(`Quantization: ${d.quantization_level}`);
        }

        if (response.capabilities && response.capabilities.length > 0) {
          parts.push(`Capabilities: ${response.capabilities.join(", ")}`);
        }

        if (response.template) {
          parts.push("\n--- Template ---");
          parts.push(response.template);
        }

        if (response.parameters) {
          parts.push("\n--- Parameters ---");
          parts.push(response.parameters);
        }

        if (response.modelfile) {
          parts.push("\n--- Modelfile ---");
          parts.push(response.modelfile);
        }

        ctx.ui.notify(parts.join("\n"), "info");
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        ctx.ui.notify(`Failed to show model: ${message}`, "error");
      }
    },
  });
}