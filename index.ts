// SPDX-License-Identifier: Apache-2.0

/**
 * Ollama extension for pi-mono
 * 
 * Provides tools and commands for interacting with local Ollama models.
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { getMarkdownTheme } from "@mariozechner/pi-coding-agent";
import { Box, Markdown, Text } from "@mariozechner/pi-tui";

import { registerOllamaPromptTool } from "./tools/prompt.js";

import { registerOllamaModelsCommand } from "./commands/models.js";
import { registerOllamaRunningCommand } from "./commands/running.js";
import { registerOllamaPullCommand } from "./commands/pull.js";
import { registerOllamaPromptCommand, OLLAMA_PROMPT_CUSTOM_TYPE } from "./commands/prompt.js";
import { registerOllamaShowCommand } from "./commands/show.js";
import { registerOllamaCopyCommand } from "./commands/copy.js";
import { registerOllamaDeleteCommand } from "./commands/delete.js";
import { registerOllamaEmbedCommand } from "./commands/embed.js";
import { registerOllamaVersionCommand } from "./commands/version.js";
import { registerOllamaChatCommand } from "./commands/chat.js";

/**
 * Default export - extension factory function
 */
export default function ollamaExtension(pi: ExtensionAPI): void {
  // Register the ollama-prompt tool
  registerOllamaPromptTool(pi);

  // Register slash commands
  registerOllamaModelsCommand(pi);
  registerOllamaRunningCommand(pi);
  registerOllamaPullCommand(pi);
  registerOllamaPromptCommand(pi);
  registerOllamaShowCommand(pi);
  registerOllamaCopyCommand(pi);
  registerOllamaDeleteCommand(pi);
  registerOllamaEmbedCommand(pi);
  registerOllamaVersionCommand(pi);
  registerOllamaChatCommand(pi);

  // Register message renderer for ollama-prompt info boxes
  pi.registerMessageRenderer(OLLAMA_PROMPT_CUSTOM_TYPE, (message, _options, theme) => {
    const details = message.details as { model: string; prompt: string } | undefined;
    const model = details?.model ?? "unknown";
    const promptContent = details?.prompt ?? "";
    const markdownTheme = getMarkdownTheme();

    // Box with customMessageBg background and accent border
    const container = new Box(1, 1, (s) => theme.bg("customMessageBg", s));

    // Header: 🤖 Ollama — <model>
    container.addChild(new Text(theme.fg("accent", `🤖 Ollama — ${model}`), 1, 0));

    // "**You:" label
    container.addChild(new Text(theme.fg("muted", "**You:**"), 0, 0));

    // Markdown-rendered prompt
    container.addChild(new Markdown(promptContent, 0, 0, markdownTheme));

    return container;
  });

  // Filter ollama-prompt messages from LLM context (they are display-only)
  pi.on("context", async (event, _ctx) => {
    const filtered = event.messages.filter((m) => {
      // Type guard: only filter custom_message entries with our customType
      if ("type" in m && "customType" in m) {
        return !(
          (m as { type: string; customType: string }).type === "custom_message" &&
          (m as { type: string; customType: string }).customType === OLLAMA_PROMPT_CUSTOM_TYPE
        );
      }
      return true;
    });
    return { messages: filtered };
  });
}