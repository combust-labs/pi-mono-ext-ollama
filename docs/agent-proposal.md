# pi-mono Ollama Extension - Implementation Proposal

<!-- SPDX-License-Identifier: Apache-2.0 -->
<!-- Copyright 2025 -->

## Overview

This extension provides seamless integration with local Ollama models, allowing agents to leverage local LLMs for various tasks. The extension follows the established pi-mono extension patterns and provides both a configurable tool and slash commands.

## Design Decisions

### Configuration

**Config file location priority** (following the read-website extension pattern):
1. Environment variable: `OLLAMA_EXTENSION_CONFIG` (if set and file exists)
2. `~/.pi/agent/extensions/ollama/config.json`
3. `./pi/extensions/ollama/config.json`

**Config schema:**
```json
{
  "baseUrl": "http://localhost:11434",
  "authToken": "optional-auth-token",
  "defaultModel": "llama3.2",
  "timeout": 120000
}
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `baseUrl` | string | `http://localhost:11434` | Ollama API base URL |
| `authToken` | string? | `null` | Optional Bearer token for authenticated endpoints |
| `defaultModel` | string? | `null` | Default model to use if not specified |
| `timeout` | number | `120000` | Request timeout in ms |

### HTTP Client

- Use native `fetch` API for HTTP requests
- Add `Authorization: Bearer <token>` header when `authToken` is configured
- Support streaming responses with `ReadableStream` for pull/push operations
- Timeout handling via `AbortSignal`

---

## Tool: `ollama-prompt`

The primary tool for interacting with Ollama models.

### Parameters (JSON Schema via TypeBox)
```typescript
{
  model: string,       // Required: model name (e.g., "llama3.2", "codellama:code")
  prompt: string,      // Required: the prompt to send
  system?: string,     // Optional: system prompt override
  options?: {          // Optional: Ollama generation options
    temperature?: number,
    top_p?: number,
    top_k?: number,
    num_predict?: number,
    seed?: number,
    stop?: string[],
    // ... other Ollama options
  },
  stream?: boolean,    // Optional: enable streaming (default: false)
  format?: "json" | object  // Optional: structured output format
}
```

### Behavior
1. Validate required parameters (`model`, `prompt`)
2. Load configuration
3. Send `POST /api/generate` with `stream: false`
4. Parse and return the complete response

### Response
```typescript
{
  content: [{ type: "text", text: "The model's response..." }],
  details: {
    model: string,
    createdAt: string,
    done: boolean,
    doneReason?: string,
    totalDuration: number,
    loadDuration: number,
    promptEvalCount: number,
    evalCount: number,
    // ... other stats
  }
}
```

### Error Handling
- Connection failures → descriptive error message
- Model not found (404) → "Model '<model>' not found"
- Auth failures (401/403) → "Authentication failed"
- Timeout → "Request timed out after <X>ms"
- Invalid JSON response → "Invalid response from Ollama"

---

## Slash Commands

### `/ollama-models`

**Description:** List all locally available models

**Handler:**
- Calls `GET /api/tags`
- Displays formatted list with name, size, and modified date
- Shows notification with count

**Output format:**
```
Available Models:
  • llama3.2:latest (2.0GB, modified 2025-05-04)
  • deepseek-r1:latest (4.7GB, modified 2025-05-10)
  • codellama:code (3.8GB, modified 2025-05-08)
```

### `/ollama-running`

**Description:** List currently loaded models in memory

**Handler:**
- Calls `GET /api/ps`
- Displays models with size, VRAM usage, and expiry

### `/ollama-pull <model>`

**Description:** Pull a model from the Ollama library

**Parameters:**
- `model` (required): Model name (e.g., `llama3.2:3b`)

**Handler:**
- Calls `POST /api/pull` with streaming
- Shows progress via `ctx.ui.notify()` updates
- Progress format: `Pulling <model>: <status> (<completed>/<total>)`
- Final notification on success/failure

**Example:** `/ollama-pull llama3.2:3b`

### `/ollama-prompt <model> <prompt>`

**Description:** Send a prompt to a model (shortcut for the tool)

**Parameters:**
- `model` (required): Model name
- `prompt` (required): The prompt text

**Handler:**
- Delegates to the `ollama-prompt` tool logic
- Shows response directly

**Example:** `/ollama-prompt llama3.2 What is 2+2?`

### `/ollama-show <model>`

**Description:** Show detailed information about a model

**Handler:**
- Calls `POST /api/show` with `verbose: true`
- Displays modelfile, template, parameters, system prompt

### `/ollama-copy <source> <destination>`

**Description:** Copy a local model to a new name

**Parameters:**
- `source`: Current model name
- `destination`: New model name

**Handler:**
- Calls `POST /api/copy`

### `/ollama-delete <model>`

**Description:** Delete a model and its data

**Parameters:**
- `model`: Model name to delete

**Handler:**
- Calls `DELETE /api/delete`
- Shows confirmation dialog first

### `/ollama-embed <model> <text>`

**Description:** Generate embeddings for text

**Parameters:**
- `model`: Embedding model (e.g., `nomic-embed-text`)
- `text`: Text to embed

**Handler:**
- Calls `POST /api/embed`
- Returns embedding vector

### `/ollama-version`

**Description:** Show Ollama server version

**Handler:**
- Calls `GET /api/version`
- Displays version and available updates

### `/ollama-chat <model> <message>`

**Description:** Quick chat completion (single message, no history)

**Parameters:**
- `model`: Model name
- `message`: User message

**Handler:**
- Calls `POST /api/chat` with single user message
- Returns assistant response

---

## Additional Considerations

### Streaming Support
- For pull/push operations, implement streaming with progress updates
- Use `onUpdate` callback in tool execution for progress
- For chat/generate streaming, accumulate chunks and return complete response

### State Management
- No persistent state required (Ollama handles model loading)
- Optionally track last used model in session via `pi.appendEntry()`

### Model Aliases
- Support common aliases (e.g., `llama3` → `llama3.2:latest`)
- Normalize model names before API calls

### Safety
- Sanitize model names to prevent injection
- Validate prompt content is non-empty
- Handle `keep_alive: 0` for unloading models

### Multi-turn Conversations (Future Extension)
- Store message history in session state
- Use `/api/chat` instead of `/api/generate` for context-aware responses
- Consider `/ollama-chat` command with history flag

---

## File Structure

```
pi-mono-ext-ollama/
├── index.ts           # Main extension entry point
├── config.ts          # Configuration loading utilities
├── types.ts           # TypeScript interfaces
├── commands/
│   ├── models.ts      # /ollama-models
│   ├── running.ts     # /ollama-running
│   ├── pull.ts        # /ollama-pull
│   ├── prompt.ts      # /ollama-prompt
│   ├── show.ts        # /ollama-show
│   ├── copy.ts        # /ollama-copy
│   ├── delete.ts      # /ollama-delete
│   ├── embed.ts       # /ollama-embed
│   ├── version.ts     # /ollama-version
│   └── chat.ts        # /ollama-chat
├── tools/
│   └── prompt.ts      # ollama-prompt tool
└── package.json       # Dependencies
```

---

## Implementation Notes

1. **Auth Token Handling:** Only add Authorization header when `authToken` is non-empty string
2. **Default Model:** Use `config.defaultModel` when `model` param is omitted (with warning)
3. **Timeout:** Respect `config.timeout` for all HTTP requests
4. **Error Messages:** Keep error messages user-friendly, not technical
5. **Completeness:** Always return `done: true` responses for the tool; streaming is for commands only
6. **Concurrency:** Ollama handles concurrent requests; no special handling needed

---

## Integration Testing Approach

Based on analysis of the `pi-subagents` extension's `test/integration/` directory, integration tests in pi-mono follow a specific pattern:

### Test Execution

Tests are run using Node.js's built-in test runner with experimental TypeScript transform support:

```bash
npm run test:integration: node --experimental-transform-types --import ./test/support/register-loader.mjs --test test/integration/*.test.ts
```

Key flags:
- `--experimental-transform-types`: Transforms TypeScript parameter properties (constructor(private x: T))
- `--import ./test/support/register-loader.mjs`: Registers a custom loader hook for .js → .ts resolution

### Test Structure

Tests use Node.js's built-in test module with `describe`, `it`, `before`, `after`, `beforeEach`, `afterEach` hooks:

```typescript
import { describe, it, before, after, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
```

### Test Support Infrastructure

The `test/support/` directory provides:

| File | Purpose |
|------|---------|
| `helpers.ts` | Shared utilities: `createMockPi()`, `createTempDir()`, `removeTempDir()`, `createEventBus()`, `makeAgent()`, `tryImport()`, `events` helpers |
| `mock-pi.ts` | Mock Pi CLI that intercepts spawn calls and returns predefined responses |
| `mock-pi-script.mjs` | Executable script that reads queued responses |
| `register-loader.mjs` | Registers custom .js → .ts loader |
| `ts-loader.mjs` | Loader that rewrites .js extensions to .ts |

### Mock Pi CLI Pattern

The `createMockPi()` helper creates a temporary directory with mock `pi` executables that read queued JSON responses instead of making real API calls:

```typescript
const mockPi = createMockPi();
mockPi.install();  // Puts mock bin in PATH

mockPi.onCall({ output: "Hello from mock" });  // Queue a response
mockPi.onCall({ exitCode: 1, stderr: "Error" });  // Queue next response

// Run your code that spawns pi

assert.equal(mockPi.callCount(), 2);  // Verify calls
mockPi.uninstall();  // Restore original PATH
```

### Lazy Module Import Pattern

Modules are imported lazily with `tryImport()` to allow graceful skipping when dependencies aren't available:

```typescript
const execution = await tryImport<ExecutionModule>("./src/runs/foreground/execution.ts");
const available = !!execution;

describe("feature", { skip: !available ? "pi packages not available" : undefined }, () => {
  // tests
});
```

### Event Helper Utilities

The `events` object provides builders for JSONL message events:

```typescript
export const events = {
  assistantMessage(text: string, model = "mock/test-model") { /* ... */ },
  toolStart(toolName: string, args: Record<string, unknown> = {}) { /* ... */ },
  toolEnd(toolName: string) { /* ... */ },
  toolResult(toolName: string, text: string, isError = false) { /* ... */ },
};
```

### Test Patterns for Extensions

For testing extension tools and commands directly (without spawning the full pi CLI):

1. **Direct function import**: Import the module functions directly via `tryImport()`
2. **Mock pi API**: Create a mock `pi` object with the required methods (`events`, `registerTool`, `registerCommand`, etc.)
3. **State management**: Create a mock state object matching the expected interface
4. **Event bus**: Use `createEventBus()` for event-driven communication

Example for command testing:

```typescript
const commands = new Map<string, { handler(args: string, ctx: unknown): Promise<void> }>();
const events = createEventBus();

const pi = {
  events,
  registerCommand(name: string, spec: { handler(args: string, ctx: unknown): Promise<void> }) {
    commands.set(name, spec);
  },
  registerShortcut() {},
  sendMessage(message: unknown) {},
};

registerSlashCommands(pi, createState(cwd));
await commands.get("my-command")!.handler("args", createCommandContext({ cwd }));
```

### Temporary Directory Management

```typescript
const tempDir = createTempDir("pi-ollama-test-");
// ... run tests ...
removeTempDir(tempDir);  // Cleanup in afterEach
```

### Test Skipping Pattern

Tests gracefully skip when dependencies are unavailable:

```typescript
describe("feature", { skip: !available ? "reason for skip" : undefined }, () => {
  it("test description", async () => {
    // test code
  });
});
```

### For This Extension

To add integration tests for the Ollama extension:

1. Create `test/integration/` directory structure
2. Add `test/support/` with helpers for:
   - Mock HTTP responses (since Ollama runs locally, mock the fetch calls or run against a real/test instance)
   - Config file fixtures
3. Test scenarios:
   - Tool execution with various model/prompt combinations
   - Slash commands with parsing and execution
   - Error handling (connection refused, model not found, auth failures, timeouts)
   - Config loading from different paths
   - Streaming responses for pull/push operations