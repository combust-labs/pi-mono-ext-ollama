// SPDX-License-Identifier: Apache-2.0

/**
 * TypeScript interfaces for Ollama API integration
 */

// User-facing configuration (from config.json)
export interface OllamaConfig {
  baseUrl?: string;
  authToken?: string;
  defaultModel?: string;
  timeout?: number;
}

// Ollama API Types

export interface OllamaGenerateOptions {
  temperature?: number;
  top_p?: number;
  top_k?: number;
  num_predict?: number;
  seed?: number;
  stop?: string[];
  num_ctx?: number;
  num_gpu?: number;
  num_thread?: number;
  keep_alive?: number | string;
}

export interface OllamaGenerateParams {
  model: string;
  prompt: string;
  system?: string;
  context?: number[];
  options?: OllamaGenerateOptions;
  format?: "json" | object;
  stream?: boolean;
  raw?: boolean;
  images?: string[];
  keep_alive?: number | string;
}

export interface OllamaGenerateResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  done_reason?: string;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

export interface OllamaMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  images?: string[];
  tool_calls?: OllamaToolCall[];
  tool_name?: string;
}

export interface OllamaToolCall {
  function: {
    name: string;
    arguments: Record<string, unknown>;
  };
}

export interface OllamaChatParams {
  model: string;
  messages: OllamaMessage[];
  tools?: OllamaTool[];
  stream?: boolean;
  format?: "json" | object;
  options?: OllamaGenerateOptions;
  keep_alive?: number | string;
  think?: boolean;
}

export interface OllamaTool {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters: object;
  };
}

export interface OllamaChatResponse {
  model: string;
  created_at: string;
  message: OllamaMessage;
  done: boolean;
  done_reason?: string;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  eval_count?: number;
  eval_duration?: number;
}

export interface OllamaModelDetails {
  parent_model: string;
  format: string;
  family: string;
  families: string[];
  parameter_size: string;
  quantization_level: string;
}

export interface OllamaModel {
  name: string;
  model: string;
  modified_at: string;
  size: number;
  digest: string;
  details?: OllamaModelDetails;
}

export interface OllamaTagsResponse {
  models: OllamaModel[];
}

export interface OllamaRunningModel extends OllamaModel {
  expires_at: string;
  size_vram?: number;
}

export interface OllamaPsResponse {
  models: OllamaRunningModel[];
}

export interface OllamaShowResponse {
  modelfile?: string;
  parameters?: string;
  template?: string;
  details?: OllamaModelDetails;
  model_info?: Record<string, unknown>;
  capabilities?: string[];
}

export interface OllamaEmbeddingsParams {
  model: string;
  input: string | string[];
  truncate?: boolean;
  options?: OllamaGenerateOptions;
  keep_alive?: number | string;
  dimensions?: number;
}

export interface OllamaEmbeddingsResponse {
  model: string;
  embeddings: number[][];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
}

export interface OllamaVersionResponse {
  version: string;
}

export interface OllamaPullProgress {
  status: string;
  digest?: string;
  total?: number;
  completed?: number;
}

export interface OllamaCopyParams {
  source: string;
  destination: string;
}

// Tool result types
export interface OllamaPromptResult {
  content: Array<{ type: "text"; text: string }>;
  details: {
    model: string;
    createdAt: string;
    done: boolean;
    doneReason?: string;
    totalDuration?: number;
    loadDuration?: number;
    promptEvalCount?: number;
    evalCount?: number;
  };
}