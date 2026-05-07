// SPDX-License-Identifier: Apache-2.0

/**
 * /ollama-prompt command - Send a prompt to a model directly from chat
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { loadConfig } from "../config.js";
import { generate } from "../client.js";

/**
 * Register the /ollama-prompt command
 */
export function registerOllamaPromptCommand(pi: ExtensionAPI): void {
  pi.registerCommand("ollama-prompt", {
    description: "Send a prompt to an Ollama model (e.g., /ollama-prompt llama3.2 What is 2+2?)",
    getArgumentCompletions: (prefix: string) => {
      // Common models for autocomplete
      const commonModels = [
        "llama3.2",
        "llama3.1",
        "mistral",
        "codellama:code",
        "phi3",
        "qwen2.5",
        "deepseek-r1",
      ];

      // If no space yet, suggest models
      if (!prefix.includes(" ")) {
        const filtered = commonModels.filter((m) => m.startsWith(prefix));
        return filtered.map((value) => ({ value: value + " ", label: value }));
      }

      return null;
    },

    async handler(args: string, ctx: { ui: { notify(message: string, type?: string): void } }): Promise<void> {
      const parts = args.trim().split(/\s+/);
      
      if (parts.length < 2) {
        ctx.ui.notify(
          "Usage: /ollama-prompt <model> <prompt>\nExample: /ollama-prompt llama3.2 What is 2+2?",
          "warning"
        );
        return;
      }

      const model = parts[0];
      const prompt = parts.slice(1).join(" ");

      if (!prompt) {
        ctx.ui.notify("Prompt cannot be empty", "warning");
        return;
      }

      try {
        const config = await loadConfig();
        ctx.ui.notify(`Sending prompt to ${model}...`, "info");

        const response = await generate(config, {
          model,
          prompt,
          stream: false,
        });

        ctx.ui.notify(`Response from ${model}:\n${response.response}`, "info");
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        ctx.ui.notify(`Prompt failed: ${message}`, "error");
      }
    },
  });
}