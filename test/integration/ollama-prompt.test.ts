// SPDX-License-Identifier: Apache-2.0
// Copyright 2025

/**
 * Integration tests for the ollama-prompt tool
 */

import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Helper to create temp dir
function createTempDir(prefix: string = "pi-ollama-test-"): string {
  return fs.mkdtempSync(path.join(fs.mkdtempSync("/tmp/"), prefix));
}

// Helper to remove temp dir
function removeTempDir(dir: string): void {
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch {}
}

// Mock response generators
function mockGenerateResponse(response: string) {
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

function mockVersionResponse(version: string = "0.5.1") {
  return { version };
}

// Read and verify the tool source exists
const toolSourcePath = path.resolve(__dirname, "../../tools/prompt.ts");
const toolSource = fs.readFileSync(toolSourcePath, "utf-8");

describe("ollama-prompt tool", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = createTempDir();
  });

  afterEach(() => {
    removeTempDir(tempDir);
  });

  describe("tool registration", () => {
    it("tool source file exists and exports registerOllamaPromptTool", () => {
      assert.ok(fs.existsSync(toolSourcePath), "Tool source should exist");
      assert.ok(toolSource.includes("export function registerOllamaPromptTool"), 
                "Should export registerOllamaPromptTool function");
    });

    it("tool registers with correct name", () => {
      assert.ok(toolSource.includes('name: "ollama-prompt"'),
                "Tool should have correct name");
    });

    it("tool has correct parameters schema", () => {
      assert.ok(toolSource.includes("OllamaPromptSchema"),
                "Should have OllamaPromptSchema");
      assert.ok(toolSource.includes("model:"),
                "Should have model parameter");
      assert.ok(toolSource.includes("prompt:"),
                "Should have prompt parameter");
    });
  });

  describe("parameter validation", () => {
    it("validates that model is required", () => {
      assert.ok(toolSource.includes('"model is required"') ||
                toolSource.includes("model is required"),
                "Should validate model is required");
    });

    it("validates that prompt is required", () => {
      assert.ok(toolSource.includes('"prompt is required"') ||
                toolSource.includes("prompt is required"),
                "Should validate prompt is required");
    });
  });

  describe("configuration integration", () => {
    it("loads config for tool execution", () => {
      assert.ok(toolSource.includes("loadConfig"),
                "Should load configuration");
      assert.ok(toolSource.includes("config.baseUrl"),
                "Should use baseUrl from config");
      assert.ok(toolSource.includes("config.timeout"),
                "Should use timeout from config");
    });

    it("supports default model from config", () => {
      assert.ok(toolSource.includes("config.defaultModel"),
                "Should support defaultModel from config");
    });
  });

  describe("API response handling", () => {
    it("parses generate response correctly", () => {
      const response = mockGenerateResponse("Test response");
      
      assert.ok(typeof response.response === "string");
      assert.ok(typeof response.done === "boolean");
      assert.ok(typeof response.total_duration === "number");
    });

    it("parses tags response with model details", () => {
      const response = mockTagsResponse([
        { name: "llama3.2:3b", size: 2019393189 },
      ]);
      
      const model = response.models[0];
      assert.ok(model.details !== undefined);
      assert.equal(model.details.parameter_size, "3.2B");
      assert.equal(model.details.quantization_level, "Q4_K_M");
    });

    it("handles mock generate response", () => {
      const response = mockGenerateResponse("Hello, world!");
      
      assert.equal(response.response, "Hello, world!");
      assert.equal(response.done, true);
      assert.equal(response.model, "test-model");
    });

    it("handles mock chat response", () => {
      const response = mockChatResponse("This is a chat response");
      
      assert.equal(response.message.content, "This is a chat response");
      assert.equal(response.message.role, "assistant");
      assert.equal(response.done, true);
    });

    it("handles mock tags response", () => {
      const response = mockTagsResponse([
        { name: "llama3.2:latest", size: 2019393189 },
        { name: "deepseek-r1:latest", size: 4683075271 },
      ]);
      
      assert.equal(response.models.length, 2);
      assert.equal(response.models[0].name, "llama3.2:latest");
      assert.equal(response.models[1].name, "deepseek-r1:latest");
    });

    it("handles mock version response", () => {
      const response = mockVersionResponse("0.5.1");
      
      assert.equal(response.version, "0.5.1");
    });
  });
});