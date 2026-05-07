// SPDX-License-Identifier: Apache-2.0

/**
 * Ollama extension for pi-mono
 * 
 * Provides tools and commands for interacting with local Ollama models.
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

import { registerOllamaPromptTool } from "./tools/prompt.js";

import { registerOllamaModelsCommand } from "./commands/models.js";
import { registerOllamaRunningCommand } from "./commands/running.js";
import { registerOllamaPullCommand } from "./commands/pull.js";
import { registerOllamaPromptCommand } from "./commands/prompt.js";
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
}