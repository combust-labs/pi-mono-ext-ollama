// SPDX-License-Identifier: Apache-2.0

/**
 * Rich renderer for Ollama prompt info box (inserted into chat history)
 */

import { Box, Container, Markdown, Spacer, Text, type MarkdownTheme } from "@mariozechner/pi-tui";

export interface PromptBoxTheme {
  header: (s: string) => string;
  label: (s: string) => string;
  box: (s: string) => string;
  dim: (s: string) => string;
}

export function promptBoxTheme(theme: { fg: (color: string, text: string) => string }): PromptBoxTheme {
  return {
    header: (s) => theme.fg("accent", s),
    label: (s) => theme.fg("muted", s),
    box: (s) => s, // Box handles its own styling
    dim: (s) => theme.fg("dim", s),
  };
}

export function buildOllamaPromptBox(
  model: string,
  prompt: string,
  theme: PromptBoxTheme,
  markdownTheme: MarkdownTheme
): Container {
  const container = new Container();

  // Box with customMessageBg background
  const box = new Box(1, 1, (s) => s);
  box.addChild = ((orig: (c: typeof box.children[0]) => void) => {
    return (child: typeof box.children[0]) => {
      // We need a different approach - use a styled box wrapper
      orig.call(box, child);
    };
  })(box.addChild.bind(box));

  // Header: 🤖 Ollama — <model>
  container.addChild(
    new Text(theme.header(`🤖 Ollama — ${model}`), 1, 0)
  );
  container.addChild(new Spacer(1));

  // "**You:**" label
  container.addChild(
    new Text(theme.label("**You:**"), 0, 0)
  );
  container.addChild(new Spacer(1));

  // Prompt rendered as markdown (in a box with background)
  const promptBox = new Box(1, 0, (s) => s); // placeholder, styling applied at container level
  const markdown = new Markdown(prompt, 0, 0, markdownTheme);
  promptBox.addChild(markdown);
  container.addChild(promptBox);

  return container;
}

export function buildOllamaPromptBoxSimple(
  model: string,
  prompt: string,
  theme: PromptBoxTheme,
  markdownTheme: MarkdownTheme
): Box {
  const container = new Box(1, 1, (s) => s);

  // Header
  container.addChild(new Text(theme.header(`🤖 Ollama — ${model}`), 1, 0));
  container.addChild(new Spacer(1));

  // "**You:" label
  container.addChild(new Text(theme.label("**You:**"), 0, 0));
  container.addChild(new Spacer(1));

  // Markdown-rendered prompt
  const markdown = new Markdown(prompt, 0, 0, markdownTheme);
  container.addChild(markdown);

  return container;
}