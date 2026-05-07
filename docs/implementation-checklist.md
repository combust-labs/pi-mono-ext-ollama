# Ollama Extension Implementation Checklist

<!-- SPDX-License-Identifier: Apache-2.0 -->

## Phase 1: Project Setup - ✅ COMPLETE

- [x] Initialize project structure
  - [x] Create directory layout per `docs/agent-proposal.md#File-Structure`
  - [x] Create `package.json` with dependencies
    - [x] Add `typebox` for JSON schema types
    - [x] Add peer dependencies for pi packages
    - [x] Add `test:integration` script with loader flags
  - [x] Create `tsconfig.json` for TypeScript compilation
  - [x] Set up `.gitignore` for node_modules and test artifacts

- [x] Set up test infrastructure
  - [x] Create `test/support/` directory
    - [x] Create `register-loader.mjs` for .js → .ts resolution
    - [x] Create `helpers.ts` with:
      - [x] `createMockPi()` helper (or HTTP mock variant)
      - [x] `createTempDir()` / `removeTempDir()`
      - [x] `createEventBus()`
      - [x] `tryImport()` for lazy module loading
    - [x] Create mock HTTP response helpers for Ollama API

## Phase 2: Core Infrastructure - ✅ COMPLETE

- [x] Implement configuration loading (`config.ts`)
  - [x] Define `ExtensionConfig` interface
  - [x] Implement config file search priority:
    - [x] Check `OLLAMA_EXTENSION_CONFIG` env var
    - [x] Check `~/.pi/agent/extensions/ollama/config.json`
    - [x] Check `./.pi/extensions/ollama/config.json`
  - [x] Return typed config with defaults
  - [x] Handle missing config files gracefully

- [x] Define TypeScript interfaces (`types.ts`)
  - [x] `OllamaGenerateParams` interface
  - [x] `OllamaGenerateResponse` interface
  - [x] `OllamaChatParams` / `OllamaChatResponse` interfaces
  - [x] `OllamaModel` interface (from `/api/tags`)
  - [x] `OllamaRunningModel` interface (from `/api/ps`)
  - [x] `OllamaConfig` interface (user configuration)

## Phase 3: HTTP Client - ✅ COMPLETE

- [x] Implement HTTP client utilities (`client.ts`)
  - [x] Create base fetch wrapper with timeout support
  - [x] Add `Authorization: Bearer <token>` header when authToken configured
  - [x] Implement request cancellation via `AbortSignal`
  - [x] Handle streaming responses (`ReadableStream`)
  - [x] Parse JSON responses with error handling

- [x] Implement API endpoint functions
  - [x] `generate(model, prompt, options)` → POST `/api/generate`
  - [x] `chat(model, messages, options)` → POST `/api/chat`
  - [x] `listModels()` → GET `/api/tags`
  - [x] `listRunningModels()` → GET `/api/ps`
  - [x] `pullModel(model, stream)` → POST `/api/pull`
  - [x] `showModel(model)` → POST `/api/show`
  - [x] `copyModel(source, destination)` → POST `/api/copy`
  - [x] `deleteModel(model)` → DELETE `/api/delete`
  - [x] `embeddings(model, input)` → POST `/api/embed`
  - [x] `getVersion()` → GET `/api/version`

## Phase 4: Tool Implementation - ✅ COMPLETE

- [x] Implement `ollama-prompt` tool (`tools/prompt.ts`)
  - [x] Define tool schema with TypeBox
    - [x] `model` (string, required)
    - [x] `prompt` (string, required)
    - [x] `system` (string, optional)
    - [x] `options` (object, optional)
    - [x] `stream` (boolean, optional, default: false)
    - [x] `format` (union, optional)
  - [x] Implement `execute()` handler
    - [x] Validate required parameters
    - [x] Load configuration
    - [x] Call Ollama API with non-streaming
    - [x] Return response with content and details
  - [x] Handle error cases:
    - [x] Connection failures
    - [x] Model not found (404)
    - [x] Authentication failures (401/403)
    - [x] Timeout errors
    - [x] Invalid JSON responses

## Phase 5: Slash Commands - ✅ COMPLETE

- [x] Implement `/ollama-models` command
  - [x] Call `listModels()` API
  - [x] Format output as bulleted list
  - [x] Show notification with count
  - [x] Add argument autocomplete for model names (optional)

- [x] Implement `/ollama-running` command
  - [x] Call `listRunningModels()` API
  - [x] Display size, VRAM usage, expiry

- [x] Implement `/ollama-pull` command
  - [x] Parse model name argument
  - [x] Call `pullModel()` with streaming
  - [x] Show progress via `ctx.ui.notify()`
  - [x] Display final success/failure notification

- [x] Implement `/ollama-prompt` command
  - [x] Parse `<model>` and `<prompt>` arguments
  - [x] Reuse tool logic for execution
  - [x] Display response directly

- [x] Implement `/ollama-show` command
  - [x] Call `showModel()` API
  - [x] Display modelfile, template, parameters

- [x] Implement `/ollama-copy` command
  - [x] Parse `<source>` and `<destination>` arguments
  - [x] Call `copyModel()` API

- [x] Implement `/ollama-delete` command
  - [x] Parse model name argument
  - [x] Show confirmation dialog
  - [x] Call `deleteModel()` API on confirm

- [x] Implement `/ollama-embed` command
  - [x] Parse `<model>` and `<text>` arguments
  - [x] Call `embeddings()` API
  - [x] Return embedding vector (truncated display)

- [x] Implement `/ollama-version` command
  - [x] Call `getVersion()` API
  - [x] Display version information

- [x] Implement `/ollama-chat` command
  - [x] Parse `<model>` and `<message>` arguments
  - [x] Call `chat()` API with single message
  - [x] Return assistant response

## Phase 6: Extension Entry Point - ✅ COMPLETE

- [x] Implement main extension (`index.ts`)
  - [x] Create extension factory function
  - [x] Register all slash commands
  - [x] Register `ollama-prompt` tool
  - [x] Set up event handlers (optional)

- [x] Handle extension lifecycle
  - [x] Clean up on session shutdown (if needed)

## Phase 7: Error Handling & Safety - ✅ COMPLETE

- [x] Sanitize model names (prevent injection)
- [x] Validate prompt content is non-empty
- [x] Handle `keep_alive: 0` for model unloading
- [x] Implement retry logic with backoff (optional)
- [x] Add timeout handling with user-friendly messages

## Phase 8: Testing - ✅ COMPLETE

- [x] Create unit tests for config loading
  - [x] Test env var path priority
  - [x] Test default config values
  - [x] Test missing config graceful handling

- [x] Create unit tests for HTTP client
  - [x] Test timeout handling
  - [x] Test auth header injection
  - [x] Test error response parsing

- [x] Create integration tests for tool
  - [x] Test valid model/prompt execution
  - [x] Test missing model error
  - [x] Test connection failure handling
  - [x] Test response parsing

- [x] Create integration tests for commands
  - [x] Test `/ollama-models` formatting
  - [x] Test `/ollama-pull` progress display
  - [x] Test `/ollama-prompt` command
  - [x] Test `/ollama-delete` confirmation flow
  - [x] Test argument parsing edge cases

## Phase 9: Documentation & Polish - ✅ COMPLETE

- [x] Add README.md
  - [x] Installation instructions
  - [x] Configuration guide
  - [x] Usage examples for tool
  - [x] Usage examples for each command
  - [x] Troubleshooting section

- [x] Create example config files
  - [x] `config.example.json` with all options

- [x] Add CHANGELOG.md
  - [x] Document initial release

## Phase 10: Future Enhancements (Out of Scope for v1) - ⏭️ DEFERRED

- [ ] Multi-turn conversation support
  - [ ] Store message history in session
  - [ ] Add `/ollama-chat` with history flag
- [ ] Model aliases normalization
- [ ] Streaming responses for tool (accumulated chunks)
- [ ] Custom renderers for model info display

---

## Summary

**Total Files Created:** 32

**Source Files:**
- `index.ts` - Main extension entry point
- `config.ts` - Configuration loading
- `types.ts` - TypeScript interfaces
- `client.ts` - HTTP client and API functions
- `tools/prompt.ts` - ollama-prompt tool

**Commands:**
- `commands/models.ts`
- `commands/running.ts`
- `commands/pull.ts`
- `commands/prompt.ts`
- `commands/show.ts`
- `commands/copy.ts`
- `commands/delete.ts`
- `commands/embed.ts`
- `commands/version.ts`
- `commands/chat.ts`
- `commands/index.ts`

**Tests:**
- `test/support/helpers.ts`
- `test/support/mock-http.ts`
- `test/support/register-loader.mjs`
- `test/support/ts-loader.mjs`
- `test/integration/ollama-prompt.test.ts`
- `test/integration/commands.test.ts`
- `test/integration/client.test.ts`
- `test/unit/config.test.ts`

**Documentation:**
- `README.md`
- `CHANGELOG.md`
- `config.example.json`
- `docs/agent-proposal.md`
- `docs/implementation-checklist.md` (this file, updated with completion status)

**Config:**
- `package.json`
- `tsconfig.json`
- `.gitignore`