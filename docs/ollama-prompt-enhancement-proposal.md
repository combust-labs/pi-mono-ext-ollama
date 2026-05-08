<!-- SPDX-License-Identifier: Apache-2.0 -->

# Proposal: Enhance `/ollama-prompt` Command

> ⚠️ This document describes the implemented enhancements. See [Status](#status) for what was completed.

## Summary

Enhance the `/ollama-prompt` command with four quality-of-life improvements:
1. Allow `"default"` as a special model name that resolves to the configured `defaultModel`
2. Insert an inline info box directly into the chat history immediately after sending
3. Show a spinner (`BorderedLoader`) while waiting for the Ollama response
4. Display `"Operation aborted"` in red when the user cancels with ESC

## Motivation

Currently `/ollama-prompt` requires an explicit model name. Users who have a preferred default model must repeat it every time. Additionally, after sending a prompt the chat history offers no trace of what was sent or which model handled it. There is also no feedback while waiting for the model to respond.

## Proposed Changes

### 1. `"default"` Model Alias

When `<model>` is the literal string `"default"`, resolve it to `config.defaultModel` before calling the Ollama API.

**Behavior:**
- If `defaultModel` is not configured, throw: `"No default model configured. Set 'defaultModel' in your config file."`
- Otherwise proceed with the resolved model name

**Example:**
```
/ollama-prompt default What is Docker?
```
→ Uses the configured `defaultModel` (e.g., `llama3.2`)

The `"default"` alias is also supported in the `ollama-prompt` tool for LLM agents.

### 2. Inline Chat History Info Box (Immediately)

Immediately after sending (before the API call), insert a custom message into the chat history using `pi.sendMessage()`. The message is rendered inline using `pi.registerMessageRenderer()`.

**Visual appearance in chat history:**

```
┌─────────────────────────────────────────────────────┐
│ 🤖 Ollama — llama3.2                                │
│                                                     │
│ **You:**                                            │
│ <prompt text rendered as markdown>                  │
└─────────────────────────────────────────────────────┘
```

**Implementation:**

1. `pi.registerMessageRenderer(OLLAMA_PROMPT_CUSTOM_TYPE, ...)` in `index.ts`:
   - Uses `Box` + `Text` + `Markdown` from `@mariozechner/pi-tui`
   - Header in `accent` color, prompt label in `muted`, prompt body as markdown
   - Uses `getMarkdownTheme()` for consistent markdown rendering

2. `pi.sendMessage({ customType, content, display: true, details })` is called **before** the API request so the user sees the prompt immediately.

### 3. Spinner While Waiting

Use `BorderedLoader` from `@mariozechner/pi-coding-agent` to show a spinner while the Ollama API call is in-flight.

```typescript
const response = await ctx.ui.custom<string | null>((tui, theme, _kb, done) => {
  const loader = new BorderedLoader(tui, theme, `Asking ${resolvedModel}...`);
  loader.onAbort = () => {
    settled = true;
    done(null);
  };

  generate(config, { model: resolvedModel, prompt, stream: false })
    .then((resp) => {
      if (!settled) { settled = true; done(resp.response); }
    })
    .catch((err) => {
      if (!settled) { settled = true; done(null); ctx.ui.notify(`Prompt failed: ${err.message}`, "error"); }
    });

  return loader;
});
```

**Key details:**
- `settled` guard prevents race conditions between ESC cancellation and async completion
- Error is shown via `ctx.ui.notify(..., "error")` (which adds the "Error: " prefix)
- ESC closes the loader and returns `null` → triggers abort display

### 4. "Operation aborted" on ESC Cancellation

When the user presses ESC while the spinner is active, display `"Operation aborted"` in red. This matches pi-mono's internal behavior (e.g., when cancelling the main prompt).

Implemented via a minimal custom component that renders the text in red and dismisses on any key:

```typescript
(ctx.ui.custom as (cb: (...args: any[]) => unknown) => Promise<void>)(
  (_tui, _theme, _kb, done) => ({
    render: (w) => new Text(theme.fg("error", "Operation aborted"), 1, 0).render(w),
    invalidate: () => {},
    handleInput: () => { done(); },
  })
);
```

> **Note:** Using `ctx.ui.notify("Operation aborted", "error")` was rejected because it routes to `showError()` which prepends `"Error: "` — pi-mono shows plain `"Operation aborted"` in red without the prefix.

### 5. Filtering from LLM Context

**⚠️ Critical:** Custom messages sent via `pi.sendMessage()` with `display: true` are persisted as `custom_message` entries in the session and **are included in the LLM context** on subsequent calls. Without filtering, the Ollama prompt info box would be forwarded to the main pi-mono model.

A `pi.on("context", ...)` handler filters these out:

```typescript
pi.on("context", async (event, _ctx) => {
  const filtered = event.messages.filter((m) => {
    if ("type" in m && "customType" in m) {
      return !(
        (m as { type: string; customType: string }).type === "custom_message" &&
        (m as { type: string; customType: string }).customType === OLLAMA_PROMPT_CUSTOM_TYPE
      );
    }
    return true;
  });
  return { messages: filtered };
});
```

## Files Modified

| File | Changes |
|------|---------|
| `index.ts` | Register message renderer; register `context` filter |
| `commands/prompt.ts` | `"default"` resolution; `pi.sendMessage()` before API; `BorderedLoader` spinner; `settled` guard; `"Operation aborted"` custom component |
| `tools/prompt.ts` | `"default"` resolution; `ctx.pi.sendMessage()` after API call |
| `renderers/promptBox.ts` | Created but unused (rendering done inline in `index.ts`) |

## Status

All items above are implemented and working.

## Design Notes

- `OLLAMA_PROMPT_CUSTOM_TYPE` constant is defined in `commands/prompt.ts` and imported by `tools/prompt.ts` and `index.ts` for consistency
- `resolveModel()` is duplicated in both `commands/prompt.ts` and `tools/prompt.ts` — a future refactor could extract it to a shared helper
- The `context` filter uses a safe type guard (`"type" in m && "customType" in m`) since `AgentMessage` union types don't all have these properties
- `renderers/promptBox.ts` was created during implementation but the renderer is defined inline in `index.ts` using `Box`, `Text`, and `Markdown` directly for simplicity