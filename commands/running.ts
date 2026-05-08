// SPDX-License-Identifier: Apache-2.0

/**
 * /ollama-running command - List currently loaded models in memory
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { loadConfig } from "../config.js";
import { listRunningModels } from "../client.js";
import { buildRunningListComponent, runningListTheme } from "../renderers/index.js";

/**
 * Register the /ollama-running command
 */
export function registerOllamaRunningCommand(pi: ExtensionAPI): void {
  pi.registerCommand("ollama-running", {
    description: "List currently loaded Ollama models in memory",
    getArgumentCompletions: () => null,

    async handler(_args: string, ctx: { ui: { notify(message: string, type?: string): void; custom<T>(cb: (tui: unknown, theme: unknown, kb: unknown, done: (result: T) => void) => unknown): Promise<T> } }): Promise<void> {
      try {
        const config = await loadConfig();
        const response = await listRunningModels(config);
        const models = response.models || [];

        await ctx.ui.custom((tui: unknown, theme: unknown, _kb: unknown, done: (r: void) => void) => {
          const myTheme = runningListTheme(theme as { fg: (c: string, s: string) => string });
          const component = buildRunningListComponent(models, myTheme);

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
        ctx.ui.notify(`Failed to list running models: ${message}`, "error");
      }
    },
  });
}