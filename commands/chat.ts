// SPDX-License-Identifier: Apache-2.0
// Copyright 2025

/**
 * /ollama-chat command - Quick chat completion with a single message
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { loadConfig } from "../config.js";
import { chat } from "../client.js";

/**
 * Register the /ollama-chat command
 */
export function registerOllamaChatCommand(pi: ExtensionAPI): void {
  pi.registerCommand("ollama-chat", {
    description: "Quick chat completion with a single message (e.g., /ollama-chat llama3.2 Hello!)",
    getArgumentCompletions: (prefix: string) => {
      const commonModels = [
        "llama3.2",
        "llama3.1",
        "mistral",
        "codellama:code",
        "phi3",
        "qwen2.5",
        "deepseek-r1",
      ];

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
          "Usage: /ollama-chat <model> <message>\nExample: /ollama-chat llama3.2 Hello!",
          "warning"
        );
        return;
      }

      const model = parts[0];
      const message = parts.slice(1).join(" ");

      if (!message) {
        ctx.ui.notify("Message cannot be empty", "warning");
        return;
      }

      try {
        const config = await loadConfig();
        ctx.ui.notify(`Sending chat to ${model}...`, "info");

        const response = await chat(config, {
          model,
          messages: [
            {
              role: "user",
              content: message,
            },
          ],
          stream: false,
        });

        ctx.ui.notify(`Response from ${model}:\n${response.message.content}`, "info");
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        ctx.ui.notify(`Chat failed: ${message}`, "error");
      }
    },
  });
}