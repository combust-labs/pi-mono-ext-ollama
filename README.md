# pi-mono Ollama Extension

<!-- SPDX-License-Identifier: Apache-2.0 -->
<!-- Copyright 2025 -->

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

## Installation

1. Ensure you have [Ollama](https://ollama.ai/) installed and running
2. Install the extension in your pi-mono configuration:

```bash
# Copy extension to your pi extensions directory
mkdir -p ~/.pi/agent/extensions/ollama
cp -r . ~/.pi/agent/extensions/ollama/
```

Or reference it directly in your configuration:

```bash
pi -e /path/to/pi-mono-ext-ollama/index.ts
```

## Configuration

Create a `config.json` file in one of these locations (in order of priority):

1. Path specified by `OLLAMA_EXTENSION_CONFIG` environment variable
2. `~/.pi/agent/extensions/ollama/config.json`
3. `./.pi/extensions/ollama/config.json`

### Example Configuration

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
| `defaultModel` | string? | `null` | Default model to use when not specified |
| `timeout` | number | `120000` | Request timeout in milliseconds |

## Usage

### Tool Usage

Agents can use the `ollama-prompt` tool:

```
Tool: ollama-prompt
Parameters:
{
  "model": "llama3.2",
  "prompt": "What is 2+2?",
  "options": {
    "temperature": 0.7
  }
}
```

### Slash Commands

From the chat interface:

```
/ollama-models                    # List available models
/ollama-pull llama3.2:3b          # Pull a new model
/ollama-prompt llama3.2 Hello!    # Quick prompt
/ollama-show llama3.2             # View model details
/ollama-version                   # Check Ollama version
```

## Requirements

- Node.js 18+
- pi-mono coding agent
- Ollama running locally (default: http://localhost:11434)

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test              # Unit tests
npm run test:integration  # Integration tests

# Build (if needed)
npx tsc
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