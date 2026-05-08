// SPDX-License-Identifier: Apache-2.0

/**
 * /ollama-models command - List all locally available models
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import type { OllamaModel } from "../types.js";
import { loadConfig } from "../config.js";
import { listModels } from "../client.js";
import { buildModelListComponent, modelListTheme } from "../renderers/index.js";

/**
 * Register the /ollama-models command
 */
export function registerOllamaModelsCommand(pi: ExtensionAPI): void {
  pi.registerCommand("ollama-models", {
    description: "List all locally available Ollama models",
    getArgumentCompletions: () => null,

    async handler(_args: string, ctx: { ui: { notify(message: string, type?: string): void; custom<T>(cb: (tui: unknown, theme: unknown, kb: unknown, done: (result: T) => void) => unknown): Promise<T> } }): Promise<void> {
      try {
        const config = await loadConfig();
        const response = await listModels(config);
        const models = response.models || [];

        await ctx.ui.custom((tui: unknown, theme: unknown, _kb: unknown, done: (r: void) => void) => {
          const myTheme = modelListTheme(theme as { fg: (c: string, s: string) => string });
          const component = buildModelListComponent(models, myTheme);

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
        ctx.ui.notify(`Failed to list models: ${message}`, "error");
      }
    },
  });
}