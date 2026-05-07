// SPDX-License-Identifier: Apache-2.0
// Copyright 2025

/**
 * HTTP client for Ollama API.
 * Handles authentication, timeouts, and streaming responses.
 */

import type {
  OllamaConfig,
  OllamaGenerateParams,
  OllamaGenerateResponse,
  OllamaChatParams,
  OllamaChatResponse,
  OllamaTagsResponse,
  OllamaPsResponse,
  OllamaShowResponse,
  OllamaEmbeddingsParams,
  OllamaEmbeddingsResponse,
  OllamaVersionResponse,
  OllamaPullProgress,
  OllamaCopyParams,
} from "./types.js";

/**
 * Create headers for Ollama API requests
 */
function createHeaders(config: OllamaConfig): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (config.authToken) {
    headers["Authorization"] = `Bearer ${config.authToken}`;
  }

  return headers;
}

/**
 * Create an AbortSignal with timeout
 */
function createTimeoutSignal(timeout: number): AbortSignal {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeout);
  return controller.signal;
}

/**
 * Parse Ollama error from response
 */
function parseOllamaError(status: number, body: unknown): string {
  if (typeof body === "object" && body !== null && "error" in body) {
    return String((body as { error: unknown }).error);
  }

  switch (status) {
    case 404:
      return "Model not found";
    case 401:
    case 403:
      return "Authentication failed";
    case 500:
      return "Ollama server error";
    default:
      return `Request failed with status ${status}`;
  }
}

/**
 * Generate a completion using the Ollama /api/generate endpoint
 */
export async function generate(
  config: OllamaConfig,
  params: OllamaGenerateParams
): Promise<OllamaGenerateResponse> {
  const url = `${config.baseUrl}/api/generate`;
  const signal = createTimeoutSignal(config.timeout || 120000);

  const response = await fetch(url, {
    method: "POST",
    headers: createHeaders(config),
    body: JSON.stringify(params),
    signal,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(parseOllamaError(response.status, body));
  }

  const data = (await response.json()) as OllamaGenerateResponse;
  return data;
}

/**
 * Chat completion using the Ollama /api/chat endpoint
 */
export async function chat(
  config: OllamaConfig,
  params: OllamaChatParams
): Promise<OllamaChatResponse> {
  const url = `${config.baseUrl}/api/chat`;
  const signal = createTimeoutSignal(config.timeout || 120000);

  const response = await fetch(url, {
    method: "POST",
    headers: createHeaders(config),
    body: JSON.stringify(params),
    signal,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(parseOllamaError(response.status, body));
  }

  const data = (await response.json()) as OllamaChatResponse;
  return data;
}

/**
 * List locally available models using GET /api/tags
 */
export async function listModels(config: OllamaConfig): Promise<OllamaTagsResponse> {
  const url = `${config.baseUrl}/api/tags`;
  const signal = createTimeoutSignal(config.timeout || 120000);

  const response = await fetch(url, {
    method: "GET",
    headers: createHeaders(config),
    signal,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(parseOllamaError(response.status, body));
  }

  const data = (await response.json()) as OllamaTagsResponse;
  return data;
}

/**
 * List currently running models using GET /api/ps
 */
export async function listRunningModels(config: OllamaConfig): Promise<OllamaPsResponse> {
  const url = `${config.baseUrl}/api/ps`;
  const signal = createTimeoutSignal(config.timeout || 120000);

  const response = await fetch(url, {
    method: "GET",
    headers: createHeaders(config),
    signal,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(parseOllamaError(response.status, body));
  }

  const data = (await response.json()) as OllamaPsResponse;
  return data;
}

/**
 * Pull a model from the Ollama library using POST /api/pull
 * Returns an async generator for streaming progress updates
 */
export async function* pullModel(
  config: OllamaConfig,
  model: string,
  stream: boolean = true
): AsyncGenerator<OllamaPullProgress, void, unknown> {
  const url = `${config.baseUrl}/api/pull`;
  const signal = createTimeoutSignal(config.timeout || 300000); // Longer timeout for pulls

  const response = await fetch(url, {
    method: "POST",
    headers: createHeaders(config),
    body: JSON.stringify({ model, stream }),
    signal,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(parseOllamaError(response.status, body));
  }

  if (stream && response.body) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter((line) => line.trim());

        for (const line of lines) {
          try {
            const progress = JSON.parse(line) as OllamaPullProgress;
            yield progress;
          } catch {
            // Skip malformed JSON
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  } else {
    // Non-streaming response
    const data = (await response.json()) as { status: string };
    yield { status: data.status };
  }
}

/**
 * Show model information using POST /api/show
 */
export async function showModel(
  config: OllamaConfig,
  model: string,
  verbose: boolean = false
): Promise<OllamaShowResponse> {
  const url = `${config.baseUrl}/api/show`;
  const signal = createTimeoutSignal(config.timeout || 120000);

  const response = await fetch(url, {
    method: "POST",
    headers: createHeaders(config),
    body: JSON.stringify({ model, verbose }),
    signal,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(parseOllamaError(response.status, body));
  }

  const data = (await response.json()) as OllamaShowResponse;
  return data;
}

/**
 * Copy a model using POST /api/copy
 */
export async function copyModel(config: OllamaConfig, params: OllamaCopyParams): Promise<void> {
  const url = `${config.baseUrl}/api/copy`;
  const signal = createTimeoutSignal(config.timeout || 120000);

  const response = await fetch(url, {
    method: "POST",
    headers: createHeaders(config),
    body: JSON.stringify(params),
    signal,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(parseOllamaError(response.status, body));
  }
}

/**
 * Delete a model using DELETE /api/delete
 */
export async function deleteModel(config: OllamaConfig, model: string): Promise<void> {
  const url = `${config.baseUrl}/api/delete`;
  const signal = createTimeoutSignal(config.timeout || 120000);

  const response = await fetch(url, {
    method: "DELETE",
    headers: createHeaders(config),
    body: JSON.stringify({ model }),
    signal,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(parseOllamaError(response.status, body));
  }
}

/**
 * Generate embeddings using POST /api/embed
 */
export async function embeddings(
  config: OllamaConfig,
  params: OllamaEmbeddingsParams
): Promise<OllamaEmbeddingsResponse> {
  const url = `${config.baseUrl}/api/embed`;
  const signal = createTimeoutSignal(config.timeout || 120000);

  const response = await fetch(url, {
    method: "POST",
    headers: createHeaders(config),
    body: JSON.stringify(params),
    signal,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(parseOllamaError(response.status, body));
  }

  const data = (await response.json()) as OllamaEmbeddingsResponse;
  return data;
}

/**
 * Get Ollama version using GET /api/version
 */
export async function getVersion(config: OllamaConfig): Promise<OllamaVersionResponse> {
  const url = `${config.baseUrl}/api/version`;
  const signal = createTimeoutSignal(config.timeout || 120000);

  const response = await fetch(url, {
    method: "GET",
    headers: createHeaders(config),
    signal,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(parseOllamaError(response.status, body));
  }

  const data = (await response.json()) as OllamaVersionResponse;
  return data;
}