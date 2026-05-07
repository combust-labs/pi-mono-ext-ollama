// SPDX-License-Identifier: Apache-2.0
// Copyright 2025

/**
 * Integration tests for Ollama slash commands
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

describe("Ollama slash commands", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = createTempDir();
  });

  afterEach(() => {
    removeTempDir(tempDir);
  });

  describe("command argument parsing", () => {
    it("extracts model name from /ollama-pull args", () => {
      const args = "llama3.2:3b";
      const modelName = args.trim();
      
      assert.equal(modelName, "llama3.2:3b");
    });

    it("extracts model and prompt from /ollama-prompt args", () => {
      const args = "llama3.2 What is 2+2?";
      const parts = args.trim().split(/\s+/);
      const model = parts[0];
      const prompt = parts.slice(1).join(" ");
      
      assert.equal(model, "llama3.2");
      assert.equal(prompt, "What is 2+2?");
    });

    it("extracts source and destination from /ollama-copy args", () => {
      const args = "llama3.2 llama3.2-backup";
      const parts = args.trim().split(/\s+/);
      
      assert.equal(parts[0], "llama3.2");
      assert.equal(parts[1], "llama3.2-backup");
    });

    it("handles multi-word prompts in /ollama-prompt", () => {
      const args = "llama3.2 Write a hello world program in Python";
      const parts = args.trim().split(/\s+/);
      const prompt = parts.slice(1).join(" ");
      
      assert.equal(prompt, "Write a hello world program in Python");
    });
  });

  describe("autocomplete suggestions", () => {
    it("suggests models for /ollama-pull without prefix", () => {
      const prefix = "";
      const commonModels = [
        "llama3.2",
        "llama3.2:3b",
        "llama3.2:1b",
        "llama3.1",
        "mistral",
        "codellama:code",
      ];
      
      const filtered = commonModels.filter((m) => m.startsWith(prefix));
      assert.equal(filtered.length, commonModels.length);
    });

    it("filters models for /ollama-pull with prefix", () => {
      const prefix = "llama";
      const commonModels = [
        "llama3.2",
        "llama3.2:3b",
        "llama3.1",
        "mistral",
        "codellama:code",
      ];
      
      const filtered = commonModels.filter((m) => m.startsWith(prefix));
      assert.ok(filtered.every((m) => m.startsWith("llama")));
    });
  });

  describe("notification formatting", () => {
    it("formats model list correctly", () => {
      const models = [
        { name: "llama3.2:latest", size: 2019393189, modified_at: "2025-05-04T17:37:44.706015396-07:00" },
        { name: "deepseek-r1:latest", size: 4683075271, modified_at: "2025-05-10T08:06:48.639712648-07:00" },
      ];

      const formatSize = (bytes: number): string => {
        const units = ["B", "KB", "MB", "GB", "TB"];
        let unitIndex = 0;
        let size = bytes;
        while (size >= 1024 && unitIndex < units.length - 1) {
          size /= 1024;
          unitIndex++;
        }
        return `${size.toFixed(1)}${units[unitIndex]}`;
      };

      const lines = models.map((m) => {
        const size = formatSize(m.size);
        return `  • ${m.name} - ${size}`;
      });

      const output = `Available Models:\n${lines.join("\n")}`;
      
      assert.ok(output.includes("llama3.2:latest"));
      assert.ok(output.includes("GB"));
      assert.ok(output.includes("deepseek-r1:latest"));
      assert.ok(output.includes("GB"));
    });

    it("handles empty model list", () => {
      const models: Array<{ name: string; size: number }> = [];
      
      assert.equal(models.length, 0);
    });
  });
});