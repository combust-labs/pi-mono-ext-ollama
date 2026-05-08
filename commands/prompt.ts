// SPDX-License-Identifier: Apache-2.0

/**
 * /ollama-prompt command - Send a prompt to a model directly from chat
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { BorderedLoader } from "@mariozechner/pi-coding-agent";
import { loadConfig } from "../config.js";
import { generate } from "../client.js";

/**
 * Constant for the custom message type, used in both sendMessage and context filter
 */
export const OLLAMA_PROMPT_CUSTOM_TYPE = "ollama-prompt";

/**
 * Resolve model name: "default" -> config.defaultModel, identity otherwise
 */
function resolveModel(model: string, config: { defaultModel?: string }): string {
  if (model === "default") {
    if (!config.defaultModel) {
      throw new Error("No default model configured. Set 'defaultModel' in your config file.");
    }
    return config.defaultModel;
  }
  return model;
}

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
        "default",
      ];

      // If no space yet, suggest models
      if (!prefix.includes(" ")) {
        const filtered = commonModels.filter((m) => m.startsWith(prefix));
        return filtered.map((value) => ({ value: value + " ", label: value }));
      }

      return null;
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async handler(args: string, ctx: any): Promise<void> {
      const parts = args.trim().split(/\s+/);

      if (parts.length < 2) {
        ctx.ui.notify(
          "Usage: /ollama-prompt <model> <prompt>\nExample: /ollama-prompt llama3.2 What is 2+2?",
          "warning"
        );
        return;
      }

      const modelInput = parts[0];
      const prompt = parts.slice(1).join(" ");

      if (!prompt) {
        ctx.ui.notify("Prompt cannot be empty", "warning");
        return;
      }

      try {
        const config = await loadConfig();
        const resolvedModel = resolveModel(modelInput, config);

        // Insert info box into chat history immediately (not forwarded to LLM)
        pi.sendMessage({
          customType: OLLAMA_PROMPT_CUSTOM_TYPE,
          content: prompt,
          display: true,
          details: { model: resolvedModel, prompt },
        });

        // Show spinner while waiting for Ollama response
        const response = await (ctx.ui.custom as (cb: (...args: any[]) => unknown) => Promise<string | null>)(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (tui: any, theme: any, _kb: any, done: (r: string | null) => void) => {
            const loader = new BorderedLoader(tui, theme, `Asking ${resolvedModel}...`);
            let settled = false;
            loader.onAbort = () => {
              settled = true;
              done(null);
            };

            generate(config, { model: resolvedModel, prompt, stream: false })
              .then((resp) => {
                if (!settled) {
                  settled = true;
                  done(resp.response);
                }
              })
              .catch((err: Error) => {
                if (!settled) {
                  settled = true;
                  done(null);
                  ctx.ui.notify(`Prompt failed: ${err.message}`, "error");
                }
              });

            return loader;
          }
        );

        if (response === null) {
          // User cancelled (ESC) - display in red in status bar (non-blocking)
          ctx.ui.setStatus("ollama-abort", ctx.ui.theme.fg("error", "Operation aborted"));
          setTimeout(() => ctx.ui.setStatus("ollama-abort", undefined), 3000);
        } else {
          ctx.ui.notify(`Response from ${resolvedModel}:\n${response}`, "info");
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        ctx.ui.notify(`Prompt failed: ${message}`, "error");
      }
    },
  });
}