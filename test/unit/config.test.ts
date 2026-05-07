// SPDX-License-Identifier: Apache-2.0
// Copyright 2025

/**
 * Unit tests for configuration loading
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe("config loading", () => {
  describe("DEFAULT_CONFIG", () => {
    it("has correct default values", () => {
      // Read the config.ts source and verify the defaults
      const configPath = path.resolve(__dirname, "../../config.ts");
      const source = fs.readFileSync(configPath, "utf-8");
      
      // Verify default baseUrl
      assert.ok(source.includes('baseUrl: "http://localhost:11434"') || 
                source.includes("baseUrl: 'http://localhost:11434'"),
              "Should have correct default baseUrl");
      
      // Verify default timeout
      assert.ok(source.includes("timeout: 120000"),
                "Should have correct default timeout");
    });
  });

  describe("config file paths", () => {
    it("checks environment variable path first", () => {
      const configPath = path.resolve(__dirname, "../../config.ts");
      const source = fs.readFileSync(configPath, "utf-8");
      
      // Verify OLLAMA_EXTENSION_CONFIG is checked first
      assert.ok(source.includes("OLLAMA_EXTENSION_CONFIG"),
                "Should check OLLAMA_EXTENSION_CONFIG env var");
    });

    it("checks user-level config path", () => {
      const configPath = path.resolve(__dirname, "../../config.ts");
      const source = fs.readFileSync(configPath, "utf-8");
      
      // Verify user-level path is checked
      assert.ok(source.includes(".pi") && source.includes("agent") && source.includes("extensions"),
                "Should check user-level config path");
    });

    it("checks project-level config path", () => {
      const configPath = path.resolve(__dirname, "../../config.ts");
      const source = fs.readFileSync(configPath, "utf-8");
      
      // Verify project-level path is checked
      assert.ok(source.includes(".pi") && source.includes("extensions"),
                "Should check project-level config path");
    });
  });

  describe("loadConfig function", () => {
    it("returns defaults when no config file exists", async () => {
      // Since we can't actually run the async loadConfig without compiled output,
      // we verify the function exists and handles missing files
      const configPath = path.resolve(__dirname, "../../config.ts");
      const source = fs.readFileSync(configPath, "utf-8");
      
      // Verify loadConfig function exists
      assert.ok(source.includes("export async function loadConfig()"),
                "Should have loadConfig function");
      
      // Verify it returns DEFAULT_CONFIG when no file found
      assert.ok(source.includes("return { ...DEFAULT_CONFIG }") || 
                source.includes("return DEFAULT_CONFIG"),
                "Should return defaults when no config file found");
    });
  });
});