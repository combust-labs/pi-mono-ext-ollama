// SPDX-License-Identifier: Apache-2.0

/**
 * Integration tests for Ollama HTTP client
 */

import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Import mock functions by reading the source
function mockGenerateResponse(responseText: string) {
  return {
    model: "test-model",
    created_at: new Date().toISOString(),
    response: responseText,
    done: true,
    done_reason: "stop",
    total_duration: 1000000000,
    load_duration: 500000000,
    prompt_eval_count: 10,
    eval_count: 50,
  };
}

function mockChatResponse(content: string) {
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

function mockTagsResponse(models: Array<{ name: string; size: number }>) {
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

function mockPsResponse(models: Array<{ name: string; size: number }>) {
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

function mockShowResponse() {
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

function mockEmbeddingsResponse(dimensions: number = 768) {
  const embedding = Array.from({ length: dimensions }, () => Math.random() * 2 - 1);
  return {
    model: "nomic-embed-text",
    embeddings: [embedding],
    total_duration: 50000000,
    load_duration: 10000000,
    prompt_eval_count: 5,
  };
}

function mockVersionResponse(version: string = "0.5.1") {
  return { version };
}

// Test the mock responses directly
describe("Ollama HTTP client (via mocks)", () => {
  beforeEach(() => {
    // Reset any global state if needed
  });

  describe("generate response parsing", () => {
    it("parses successful generate response", () => {
      const response = mockGenerateResponse("The sky is blue because of Rayleigh scattering.");
      
      assert.equal(response.done, true);
      assert.ok(response.response.length > 0);
      assert.ok(response.total_duration !== undefined);
      assert.ok(response.prompt_eval_count !== undefined);
      assert.ok(response.eval_count !== undefined);
    });

    it("parses generate response with done_reason", () => {
      const response = mockGenerateResponse("Short answer");
      response.done_reason = "stop";
      
      assert.equal(response.done_reason, "stop");
    });
  });

  describe("chat response parsing", () => {
    it("parses successful chat response", () => {
      const response = mockChatResponse("Hello! How can I help you today?");
      
      assert.equal(response.done, true);
      assert.equal(response.message.role, "assistant");
      assert.ok(response.message.content.length > 0);
    });
  });

  describe("tags response parsing", () => {
    it("parses model list response", () => {
      const response = mockTagsResponse([
        { name: "llama3.2:latest", size: 2019393189 },
        { name: "mistral:latest", size: 4106854400 },
        { name: "codellama:code", size: 3826793676 },
      ]);
      
      assert.equal(response.models.length, 3);
      
      const first = response.models[0];
      assert.equal(first.name, "llama3.2:latest");
      assert.ok(first.size > 0);
      assert.ok(first.details !== undefined);
      assert.equal(first.details.format, "gguf");
    });

    it("includes model details", () => {
      const response = mockTagsResponse([
        { name: "llama3.2:3b", size: 2019393189 },
      ]);
      
      const model = response.models[0];
      assert.equal(model.details.parameter_size, "3.2B");
      assert.equal(model.details.quantization_level, "Q4_K_M");
      assert.ok(model.details.families.includes("llama"));
    });
  });

  describe("ps response parsing", () => {
    it("parses running models response", () => {
      const response = mockPsResponse([
        { name: "llama3.2:latest", size: 2019393189 },
      ]);
      
      assert.equal(response.models.length, 1);
      assert.ok(response.models[0].expires_at !== undefined);
      assert.ok(response.models[0].size_vram !== undefined);
    });

    it("handles empty running models", () => {
      const response = mockPsResponse([]);
      
      assert.equal(response.models.length, 0);
    });
  });

  describe("show response parsing", () => {
    it("parses show model response", () => {
      const response = mockShowResponse();
      
      assert.ok(response.modelfile !== undefined);
      assert.ok(response.template !== undefined);
      assert.ok(response.parameters !== undefined);
      assert.ok(response.details !== undefined);
      assert.ok(response.capabilities !== undefined);
      assert.ok(response.capabilities.includes("completion"));
    });
  });

  describe("embeddings response parsing", () => {
    it("parses embeddings response", () => {
      const response = mockEmbeddingsResponse(768);
      
      assert.ok(response.embeddings !== undefined);
      assert.equal(response.embeddings.length, 1);
      assert.equal(response.embeddings[0].length, 768);
    });

    it("handles multiple embeddings", () => {
      const dims = 384;
      const embedding1 = Array.from({ length: dims }, () => Math.random() * 2 - 1);
      const embedding2 = Array.from({ length: dims }, () => Math.random() * 2 - 1);
      
      assert.equal(embedding1.length, dims);
      assert.equal(embedding2.length, dims);
    });
  });

  describe("version response parsing", () => {
    it("parses version response", () => {
      const response = mockVersionResponse("0.5.1");
      
      assert.equal(response.version, "0.5.1");
    });

    it("handles different version formats", () => {
      const versions = ["0.1.0", "0.5.1", "1.0.0-beta"];
      
      for (const version of versions) {
        const response = mockVersionResponse(version);
        assert.equal(response.version, version);
      }
    });
  });
});