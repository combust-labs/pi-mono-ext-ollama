// SPDX-License-Identifier: Apache-2.0

/**
 * /ollama-embed command - Generate embeddings for text
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { loadConfig } from "../config.js";
import { embeddings } from "../client.js";

/**
 * Truncate embedding for display (first few dimensions)
 */
function truncateEmbedding(embedding: number[], maxDims: number = 5): string {
  const displayed = embedding.slice(0, maxDims);
  const remaining = embedding.length - maxDims;
  
  let result = displayed.map((v) => v.toFixed(4)).join(", ");
  
  if (remaining > 0) {
    result += `, ... (+${remaining} more dimensions)`;
  }
  
  return result;
}

/**
 * Register the /ollama-embed command
 */
export function registerOllamaEmbedCommand(pi: ExtensionAPI): void {
  pi.registerCommand("ollama-embed", {
    description: "Generate embeddings for text (e.g., /ollama-embed nomic-embed-text Your text here)",
    getArgumentCompletions: (prefix: string) => {
      const embedModels = ["nomic-embed-text", "mxbai-embed-large", "all-minilm"];
      const filtered = embedModels.filter((m) => m.startsWith(prefix));
      return filtered.map((value) => ({ value: value + " ", label: value }));
    },

    async handler(args: string, ctx: { ui: { notify(message: string, type?: string): void } }): Promise<void> {
      const parts = args.trim().split(/\s+/);

      if (parts.length < 2) {
        ctx.ui.notify(
          "Usage: /ollama-embed <model> <text>\nExample: /ollama-embed nomic-embed-text Your text here",
          "warning"
        );
        return;
      }

      const model = parts[0];
      const text = parts.slice(1).join(" ");

      if (!text) {
        ctx.ui.notify("Text cannot be empty", "warning");
        return;
      }

      try {
        const config = await loadConfig();
        ctx.ui.notify(`Generating embeddings with ${model}...`, "info");

        const response = await embeddings(config, {
          model,
          input: text,
        });

        if (response.embeddings && response.embeddings.length > 0) {
          const dims = response.embeddings[0].length;
          const preview = truncateEmbedding(response.embeddings[0]);
          
          ctx.ui.notify(
            `Embedding generated (${dims} dimensions):\n${preview}`,
            "info"
          );
        } else {
          ctx.ui.notify("No embeddings returned", "warning");
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        ctx.ui.notify(`Failed to generate embeddings: ${message}`, "error");
      }
    },
  });
}