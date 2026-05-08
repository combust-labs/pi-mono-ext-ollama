// SPDX-License-Identifier: Apache-2.0

/**
 * /ollama-show command - Show detailed information about a model
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { loadConfig } from "../config.js";
import { showModel } from "../client.js";
import { buildModelShowComponent, modelShowTheme } from "../renderers/index.js";

/**
 * Register the /ollama-show command
 */
export function registerOllamaShowCommand(pi: ExtensionAPI): void {
  pi.registerCommand("ollama-show", {
    description: "Show detailed information about a model (e.g., /ollama-show llama3.2)",
    getArgumentCompletions: () => null,

    async handler(args: string, ctx: { ui: { notify(message: string, type?: string): void; custom<T>(cb: (tui: unknown, theme: unknown, kb: unknown, done: (result: T) => void) => unknown): Promise<T> } }): Promise<void> {
      const modelName = args.trim();

      if (!modelName) {
        ctx.ui.notify("Usage: /ollama-show <model-name>\nExample: /ollama-show llama3.2", "warning");
        return;
      }

      try {
        const config = await loadConfig();
        ctx.ui.notify(`Fetching info for ${modelName}...`, "info");

        const response = await showModel(config, modelName, true);

        await ctx.ui.custom((tui: unknown, theme: unknown, _kb: unknown, done: (r: void) => void) => {
          const myTheme = modelShowTheme(theme as { fg: (c: string, s: string) => string });
          const component = buildModelShowComponent(modelName, response, myTheme);

          return {
            render: (w: number) => component.render(w),
            invalidate: () => component.invalidate(),
            handleInput: (_data: string) => {
              done();
              (tui as { requestRender: () => void }).requestRender();
            },
          };
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        ctx.ui.notify(`Failed to show model: ${message}`, "error");
      }
    },
  });
}