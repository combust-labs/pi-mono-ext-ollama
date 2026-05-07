<!-- SPDX-License-Identifier: Apache-2.0 -->

# pi-mono Ollama Extension

A pi-mono extension for interacting with local [Ollama](https://ollama.ai/) models. This extension provides both a tool for LLM agents to use and slash commands for direct interaction.

## Features

- **Tool**: `ollama-prompt` - Send prompts to Ollama models and receive complete responses
- **Slash Commands**:
  - `/ollama-models` - List all locally available models
  - `/ollama-running` - List models currently loaded in memory
  - `/ollama-pull <model>` - Pull a model from the Ollama library
  - `/ollama-prompt <model> <prompt>` - Quick prompt from chat
  - `/ollama-show <model>` - Show detailed model information
  - `/ollama-copy <source> <destination>` - Copy a model to a new name
  - `/ollama-delete <model>` - Delete a model and its data
  - `/ollama-embed <model> <text>` - Generate embeddings for text
  - `/ollama-version` - Show Ollama server version
  - `/ollama-chat <model> <message>` - Quick chat completion

## Requirements

- Node.js 18+
- [Ollama](https://ollama.ai/) installed and running locally (or at configured `baseUrl`)
- pi-mono coding agent

## Installation

### Option 1: Copy to Extensions Directory

```bash
# Create the extensions directory if it doesn't exist
mkdir -p ~/.pi/agent/extensions/ollama

# Clone or copy this extension into the directory
cp -r /path/to/pi-mono-ext-ollama/* ~/.pi/agent/extensions/ollama/

# Install dependencies
cd ~/.pi/agent/extensions/ollama
npm install
```

### Option 2: Reference Directly

Reference the extension path in your pi-mono configuration:

```bash
pi -e /path/to/pi-mono-ext-ollama/index.ts
```

## Configuration

### Configuration File Locations

The extension searches for configuration in the following order (first found wins):

1. **Environment variable**: `OLLAMA_EXTENSION_CONFIG` (must be set to an existing file path)
2. **User-level config**: `~/.pi/agent/extensions/ollama/config.json`
3. **Project-level config**: `./.pi/extensions/ollama/config.json`

### Example Configuration

Create a `config.json` file in one of the above locations:

```json
{
  "baseUrl": "http://localhost:11434",
  "authToken": "",
  "defaultModel": "llama3.2",
  "timeout": 120000
}
```

### Configuration Options

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `baseUrl` | string | `http://localhost:11434` | Ollama API base URL. Change this if Ollama runs on a different host/port. |
| `authToken` | string? | `null` | Optional Bearer token for authenticated Ollama endpoints. |
| `defaultModel` | string? | `null` | Default model to use when `model` is not specified in tool/command calls. |
| `timeout` | number | `120000` | Request timeout in milliseconds. 2 minutes by default. |

### Environment Variable Override

```bash
# Set config via environment variable
export OLLAMA_EXTENSION_CONFIG="/path/to/my-ollama-config.json"
pi
```

## Usage

### Tool: `ollama-prompt`

Agents use this tool to generate completions from Ollama models.

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `model` | string | Yes | Ollama model name (e.g., `llama3.2`, `codellama:code`, `deepseek-r1:7b`) |
| `prompt` | string | Yes | The prompt to send to the model |
| `system` | string | No | System prompt override |
| `options` | object | No | Generation options (see below) |
| `format` | string | No | Set to `"json"` for JSON output mode |
| `stream` | boolean | No | Enable streaming (default: false) |

#### Generation Options (`options`)

| Option | Type | Description |
|--------|------|-------------|
| `temperature` | number | Randomness (0-1). Lower = more focused. |
| `top_p` | number | Nucleus sampling threshold (0-1) |
| `top_k` | number | Top-k sampling (0 = unlimited) |
| `num_predict` | number | Max tokens to generate |
| `seed` | integer | Random seed for reproducibility |
| `stop` | string[] | Stop sequences |
| `num_ctx` | integer | Context window size |
| `keep_alive` | number | Model keep-alive duration in seconds |

#### Tool Example

```
Tool: ollama-prompt
Parameters:
{
  "model": "llama3.2",
  "prompt": "Explain quantum entanglement in simple terms",
  "options": {
    "temperature": 0.7,
    "num_predict": 500
  }
}
```

#### Tool Response

```json
{
  "content": [
    {
      "type": "text",
      "text": "Quantum entanglement is a phenomenon where two particles become connected..."
    }
  ],
  "details": {
    "model": "llama3.2",
    "createdAt": "2025-05-07T12:00:00.000Z",
    "done": true,
    "doneReason": "stop",
    "totalDuration": 1234567890,
    "loadDuration": 500000000,
    "promptEvalCount": 15,
    "evalCount": 250
  }
}
```

### Slash Commands

All commands are prefixed with `/ollama-`.

---

#### `/ollama-models`

List all locally available models.

```
/ollama-models
```

**Output:**
```
Available Models:
  • llama3.2:latest (2.0GB, modified 2025-05-04)
  • deepseek-r1:latest (4.7GB, modified 2025-05-10)
  • codellama:code (3.8GB, modified 2025-05-08)
Found 3 model(s)
```

---

#### `/ollama-running`

List models currently loaded in memory.

```
/ollama-running
```

**Output:**
```
Running Models:
  • llama3.2:latest - 2.0GB (VRAM: 1.5GB), expires in 15m
Currently running 1 model(s)
```

---

#### `/ollama-pull <model>`

Pull a model from the Ollama library. Shows progress during download.

```
/ollama-pull llama3.2:3b
```

**Output:**
```
Pulling model: llama3.2:3b...
Pulling llama3.2:3b: downloading manifest
Progress: 25% (500MB / 2.0GB)
Progress: 50% (1.0GB / 2.0GB)
Progress: 75% (1.5GB / 2.0GB)
Progress: 100% (2.0GB / 2.0GB)
Successfully pulled model: llama3.2:3b
```

---

#### `/ollama-prompt <model> <prompt>`

Quick prompt from chat (shortcut for the tool).

```
/ollama-prompt llama3.2 What is the capital of France?
```

**Output:**
```
Response from llama3.2:
The capital of France is Paris.
```

---

#### `/ollama-show <model>`

Show detailed information about a model including modelfile, template, and parameters.

```
/ollama-show llama3.2
```

**Output:**
```
Model: llama3.2
Format: gguf
Family: llama
Parameter Size: 3.2B
Quantization: Q4_K_M
Capabilities: completion, chat

--- Template ---
{{ if .System }}<|start_header_id|>system<|end_header_id|>
{{ .System }}<|eot_id|>{{ end }}...
```

---

#### `/ollama-copy <source> <destination>`

Copy a model to a new name (useful for creating variants).

```
/ollama-copy llama3.2 llama3.2-instruction-tuned
```

**Output:**
```
Successfully copied llama3.2 to llama3.2-instruction-tuned
```

---

#### `/ollama-delete <model>`

Delete a model and all its data. Requires confirmation.

```
/ollama-delete llama3.2:3b
```

**Confirmation Dialog:**
```
Delete model: llama3.2:3b?
This action cannot be undone and will remove all model data.
[Cancel] [Confirm]
```

---

#### `/ollama-embed <model> <text>`

Generate embeddings for text using an embedding model.

```
/ollama-embed nomic-embed-text The quick brown fox jumps over the lazy dog
```

**Output:**
```
Embedding generated (768 dimensions):
[0.0231, -0.0452, 0.0891, ... (+763 more dimensions)]
```

---

#### `/ollama-version`

Show the Ollama server version.

```
/ollama-version
```

**Output:**
```
Ollama Version: 0.5.1
```

---

#### `/ollama-chat <model> <message>`

Quick single-message chat completion.

```
/ollama-chat llama3.2 Hello! How are you?
```

**Output:**
```
Response from llama3.2:
Hello! I'm doing well, thank you for asking. How can I help you today?
```

---

## Common Use Cases

### Code Generation

```
Tool: ollama-prompt
Parameters: {
  "model": "codellama:code",
  "prompt": "Write a Python function to calculate fibonacci numbers recursively",
  "options": {
    "temperature": 0.2
  }
}
```

### Question Answering

```
/ollama-prompt llama3.2 What are the main differences between SQL and NoSQL databases?
```

### Text Summarization

```
Tool: ollama-prompt
Parameters: {
  "model": "llama3.2",
  "prompt": "Summarize the following text: [long text here]",
  "options": {
    "temperature": 0.3,
    "num_predict": 100
  }
}
```

### Embedding Search

```
/ollama-embed nomic-embed-text Your search query here
```

---

## Development

```bash
# Clone the repository
git clone https://github.com/your-repo/pi-mono-ext-ollama.git
cd pi-mono-ext-ollama

# Install dependencies
npm install

# Run tests
npm test              # Unit tests only
npm run test:integration  # Integration tests only
npm run test:all      # All tests

# Build TypeScript (if needed)
npx tsc
```

## Testing

The extension includes 38 tests (5 unit + 33 integration):

- **Unit tests**: Configuration loading, default values, path priority
- **Integration tests**: API response parsing, command argument parsing, tool registration

```bash
# Run all tests
npm run test:all

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration
```

## Troubleshooting

### "Connection failed: Is Ollama running?"

Ollama is not running or not accessible at the configured `baseUrl`.

```bash
# Start Ollama
ollama serve

# Or check if Ollama is running
curl http://localhost:11434/api/version
```

### "Model not found"

The specified model is not installed.

```bash
# Pull the model
/ollama-pull llama3.2

# Or via CLI
ollama pull llama3.2
```

### "Authentication failed"

Check your `authToken` in the configuration file.

### Tests fail with "MODULE_NOT_FOUND"

Ensure TypeScript files are compiled and dependencies are installed:

```bash
npm install
npx tsc
```

## File Structure

```
pi-mono-ext-ollama/
├── index.ts              # Main extension entry point
├── config.ts             # Configuration loading
├── types.ts              # TypeScript interfaces
├── client.ts             # HTTP client and API functions
├── tools/
│   └── prompt.ts         # ollama-prompt tool
├── commands/
│   ├── models.ts         # /ollama-models
│   ├── running.ts        # /ollama-running
│   ├── pull.ts           # /ollama-pull
│   ├── prompt.ts         # /ollama-prompt
│   ├── show.ts           # /ollama-show
│   ├── copy.ts           # /ollama-copy
│   ├── delete.ts         # /ollama-delete
│   ├── embed.ts          # /ollama-embed
│   ├── version.ts        # /ollama-version
│   └── chat.ts           # /ollama-chat
├── test/
│   ├── unit/             # Unit tests
│   ├── integration/      # Integration tests
│   └── support/          # Test helpers and mocks
├── docs/
│   ├── agent-proposal.md
│   └── implementation-checklist.md
├── config.example.json   # Example configuration
├── LICENSE               # Apache 2.0 license
└── package.json
```

## Contributing

Contributions welcome! Please ensure tests pass before submitting PRs.

```bash
npm run test:all
```

## License

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

See [LICENSE](./LICENSE) for the full license text.

---

**Credit**: Implemented by **mlx-community/MiniMax-M2.7-8bit**