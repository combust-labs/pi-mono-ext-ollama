// SPDX-License-Identifier: Apache-2.0
// Copyright 2025

/**
 * Mock HTTP responses for Ollama API testing.
 * 
 * Intercepts fetch calls and returns predefined responses
 * without requiring a running Ollama instance.
 */

import type {
  OllamaGenerateResponse,
  OllamaChatResponse,
  OllamaTagsResponse,
  OllamaPsResponse,
  OllamaShowResponse,
  OllamaEmbeddingsResponse,
  OllamaVersionResponse,
} from "../../types.js";

export interface MockResponse {
  status?: number;
  body?: unknown;
  delay?: number;
}

export interface MockOllamaState {
  models: string[];
  runningModels: string[];
  responses: Map<string, MockResponse>;
}

const globalState: MockOllamaState = {
  models: [],
  runningModels: [],
  responses: new Map(),
};

/**
 * Set up a mock response for a specific endpoint
 */
export function mockEndpoint(path: string, response: MockResponse): void {
  globalState.responses.set(path, response);
}

/**
 * Reset all mock state
 */
export function resetMocks(): void {
  globalState.models = [];
  globalState.runningModels = [];
  globalState.responses.clear();
}

/**
 * Set available models
 */
export function setAvailableModels(models: string[]): void {
  globalState.models = models;
}

/**
 * Set running models
 */
export function setRunningModels(models: string[]): void {
  globalState.runningModels = models;
}

/**
 * Create mock generate response
 */
export function mockGenerateResponse(response: string): OllamaGenerateResponse {
  return {
    model: "test-model",
    created_at: new Date().toISOString(),
    response,
    done: true,
    done_reason: "stop",
    total_duration: 1000000000,
    load_duration: 500000000,
    prompt_eval_count: 10,
    eval_count: 50,
  };
}

/**
 * Create mock chat response
 */
export function mockChatResponse(content: string): OllamaChatResponse {
  return {
    model: "test-model",
    created_at: new Date().toISOString(),
    message: {
      role: "assistant",
      content,
    },
    done: true,
    done_reason: "stop",
    total_duration: 1000000000,
    prompt_eval_count: 10,
    eval_count: 50,
  };
}

/**
 * Create mock tags response
 */
export function mockTagsResponse(models: Array<{ name: string; size: number }>): OllamaTagsResponse {
  return {
    models: models.map((m, i) => ({
      name: m.name,
      model: m.name,
      modified_at: new Date(Date.now() - i * 86400000).toISOString(),
      size: m.size,
      digest: `sha256:${m.name.replace(/[^a-z0-9]/gi, "")}`,
      details: {
        parent_model: "",
        format: "gguf",
        family: "llama",
        families: ["llama"],
        parameter_size: "3.2B",
        quantization_level: "Q4_K_M",
      },
    })),
  };
}

/**
 * Create mock running models response
 */
export function mockPsResponse(models: Array<{ name: string; size: number }>): OllamaPsResponse {
  return {
    models: models.map((m) => ({
      name: m.name,
      model: m.name,
      modified_at: new Date().toISOString(),
      size: m.size,
      digest: `sha256:${m.name.replace(/[^a-z0-9]/gi, "")}`,
      expires_at: new Date(Date.now() + 300000).toISOString(),
      size_vram: m.size,
      details: {
        parent_model: "",
        format: "gguf",
        family: "llama",
        families: ["llama"],
        parameter_size: "3.2B",
        quantization_level: "Q4_K_M",
      },
    })),
  };
}

/**
 * Create mock show response
 */
export function mockShowResponse(): OllamaShowResponse {
  return {
    modelfile: "FROM llama3.2\nTEMPLATE \"{{ .System }}\nUSER: {{ .Prompt }}\nASSISTANT: \"\nPARAMETER num_ctx 4096",
    parameters: "num_ctx 4096\ntemperature 0.8",
    template: "{{ if .System }}<|start_header_id|>system<|end_header_id|>\n\n{{ .System }}<|eot_id|>{{ end }}{{ if .Prompt }}<|start_header_id|>user<|end_header_id|>\n\n{{ .Prompt }}<|eot_id|>{{ end }}<|start_header_id|>assistant<|end_header_id|>\n\n{{ .Response }}<|eot_id|>",
    details: {
      parent_model: "",
      format: "gguf",
      family: "llama",
      families: ["llama"],
      parameter_size: "3.2B",
      quantization_level: "Q4_K_M",
    },
    capabilities: ["completion", "chat"],
  };
}

/**
 * Create mock embeddings response
 */
export function mockEmbeddingsResponse(dimensions: number = 768): OllamaEmbeddingsResponse {
  const embedding = Array.from({ length: dimensions }, (_, i) => Math.random() * 2 - 1);
  return {
    model: "nomic-embed-text",
    embeddings: [embedding],
    total_duration: 50000000,
    load_duration: 10000000,
    prompt_eval_count: 5,
  };
}

/**
 * Create mock version response
 */
export function mockVersionResponse(version: string = "0.5.1"): OllamaVersionResponse {
  return { version };
}

/**
 * Get all registered mocks
 */
export function getMockState(): MockOllamaState {
  return globalState;
}