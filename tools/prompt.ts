// SPDX-License-Identifier: Apache-2.0

/**
 * Ollama prompt tool - send prompts to Ollama models and receive responses.
 */

import { Type } from "typebox";
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import type { Static } from "typebox";

import { loadConfig } from "../config.js";
import { generate } from "../client.js";
import type { OllamaPromptResult } from "../types.js";
import { OLLAMA_PROMPT_CUSTOM_TYPE } from "../commands/prompt.js";

export const OllamaPromptSchema = Type.Object({
  model: Type.String({ description: "Ollama model name (e.g., 'llama3.2', 'codellama:code', or 'default')" }),
  prompt: Type.String({ description: "The prompt to send to the model" }),
  system: Type.Optional(Type.String({ description: "Optional system prompt override" })),
  options: Type.Optional(Type.Object({
    temperature: Type.Optional(Type.Number()),
    top_p: Type.Optional(Type.Number()),
    top_k: Type.Optional(Type.Number()),
    num_predict: Type.Optional(Type.Number()),
    seed: Type.Optional(Type.Integer()),
    stop: Type.Optional(Type.Array(Type.String())),
    num_ctx: Type.Optional(Type.Integer()),
    keep_alive: Type.Optional(Type.Union([Type.Number(), Type.String()])),
  }, { description: "Optional generation options" })),
  format: Type.Optional(Type.Union([
    Type.Literal("json"),
    Type.Object({ type: Type.Literal("object") }),
  ], { description: "Output format (json for JSON mode, or JSON schema for structured output)" })),
  stream: Type.Optional(Type.Boolean({ description: "Enable streaming response (default: false)" })),
});

export type OllamaPromptParams = Static<typeof OllamaPromptSchema>;

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
 * Register the ollama-prompt tool with the extension API
 */
export function registerOllamaPromptTool(pi: ExtensionAPI): void {
  pi.registerTool({
    name: "ollama-prompt",
    label: "Ollama Prompt",
    description: `Send a prompt to an Ollama model and receive a complete response.

Use this tool to interact with local Ollama models for tasks like:
- Text generation and completion
- Code generation and debugging
- Question answering
- Summarization
- Any task supported by your local models

The tool uses the Ollama /api/generate endpoint with streaming disabled by default
to return the complete response at once.

Parameters:
- model: The name of the Ollama model to use (e.g., 'llama3.2', 'codellama:code', or 'default')
- prompt: The input prompt for the model
- system (optional): Override the default system prompt
- options (optional): Generation parameters like temperature, top_p, seed, etc.
- format (optional): Set to "json" for JSON output or provide a JSON schema
- stream (optional): Enable streaming (accumulates chunks into complete response)`,

    parameters: OllamaPromptSchema,

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async execute(_toolCallId: any, params: OllamaPromptParams, signal: any, _onUpdate: any, ctx: any): Promise<OllamaPromptResult> {
      // Validate required parameters
      const model = (params.model ?? "").trim();
      const prompt = (params.prompt ?? "").trim();

      if (!model) {
        throw new Error("Invalid parameters: model is required");
      }

      if (!prompt) {
        throw new Error("Invalid parameters: prompt is required");
      }

      // Load configuration
      const config = await loadConfig();

      // Resolve "default" to configured defaultModel
      const modelToUse = resolveModel(model, config);

      // Build request parameters
      const requestParams: {
        model: string;
        prompt: string;
        system?: string;
        options?: typeof params.options;
        format?: typeof params.format;
        stream: false;
      } = {
        model: modelToUse,
        prompt,
        stream: false,
      };

      if (params.system) {
        requestParams.system = params.system;
      }

      if (params.options) {
        requestParams.options = params.options;
      }

      if (params.format) {
        requestParams.format = params.format;
      }

      try {
        // Make the API request
        const response = await generate(config, requestParams);

        // Insert info box into chat history immediately (not forwarded to LLM)
        if (ctx?.pi) {
          ctx.pi.sendMessage({
            customType: OLLAMA_PROMPT_CUSTOM_TYPE,
            content: prompt,
            display: true,
            details: { model: modelToUse, prompt },
          });
        }
        return {
          content: [{ type: "text", text: response.response }],
          details: {
            model: response.model,
            createdAt: response.created_at,
            done: response.done,
            doneReason: response.done_reason,
            totalDuration: response.total_duration,
            loadDuration: response.load_duration,
            promptEvalCount: response.prompt_eval_count,
            evalCount: response.eval_count,
          },
        };
      } catch (error) {
        // Re-throw with user-friendly message
        const message = error instanceof Error ? error.message : String(error);

        // Handle specific error types
        if (message.includes("abort")) {
          throw new Error(`Request timed out after ${config.timeout}ms`);
        }

        if (message.includes("fetch") || message.includes("network") || message.includes("ECONNREFUSED")) {
          throw new Error(`Connection failed: Is Ollama running at ${config.baseUrl}?`);
        }

        throw error;
      }
    },
  });
}