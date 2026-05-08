// SPDX-License-Identifier: Apache-2.0

/**
 * Rich renderer for /ollama-show output
 */

import { Container, Spacer, Text } from "@mariozechner/pi-tui";
import type { OllamaShowResponse } from "../types.js";

export interface ModelShowTheme {
  title: (s: string) => string;
  label: (s: string) => string;
  value: (s: string) => string;
  section: (s: string) => string;
  dim: (s: string) => string;
}

export function modelShowTheme(theme: { fg: (color: string, text: string) => string }): ModelShowTheme {
  return {
    title: (s) => theme.fg("accent", s),
    label: (s) => theme.fg("accent", s),
    value: (s) => theme.fg("text", s),
    section: (s) => theme.fg("muted", s),
    dim: (s) => theme.fg("dim", s),
  };
}

function truncate(text: string, maxLen: number): string {
  const truncated = text.slice(0, maxLen);
  return truncated + (text.length > maxLen ? "\n  ... (truncated)" : "");
}

export function buildModelShowComponent(
  modelName: string,
  response: OllamaShowResponse,
  theme: ModelShowTheme
): Container {
  const container = new Container();

  // Title
  container.addChild(new Text(theme.title(`📋 ${modelName}`), 1, 0));
  container.addChild(new Spacer(1));

  // Details section
  if (response.details) {
    const d = response.details;
    container.addChild(new Text(theme.section("─── Details ───"), 0, 0));
    container.addChild(
      new Text(theme.value(`  Format:       ${d.format}`), 0, 0)
    );
    container.addChild(
      new Text(theme.value(`  Family:       ${d.family}`), 0, 0)
    );
    container.addChild(
      new Text(theme.value(`  Parameters:   ${d.parameter_size}`), 0, 0)
    );
    container.addChild(
      new Text(theme.value(`  Quantization: ${d.quantization_level}`), 0, 0)
    );
  }

  // Capabilities
  if (response.capabilities?.length) {
    container.addChild(new Spacer(1));
    container.addChild(new Text(theme.section("─── Capabilities ───"), 0, 0));
    const caps = response.capabilities.map((c) => `  • ${c}`).join("\n");
    container.addChild(new Text(theme.value(caps), 0, 0));
  }

  // Template
  if (response.template) {
    container.addChild(new Spacer(1));
    container.addChild(new Text(theme.section("─── Template ───"), 0, 0));
    container.addChild(new Text(theme.dim(truncate(response.template, 500)), 0, 0));
  }

  // Parameters
  if (response.parameters) {
    container.addChild(new Spacer(1));
    container.addChild(new Text(theme.section("─── Parameters ───"), 0, 0));
    container.addChild(new Text(theme.dim(truncate(response.parameters, 500)), 0, 0));
  }

  // Modelfile
  if (response.modelfile) {
    container.addChild(new Spacer(1));
    container.addChild(new Text(theme.section("─── Modelfile ───"), 0, 0));
    container.addChild(new Text(theme.dim(truncate(response.modelfile, 500)), 0, 0));
  }

  // Dismiss hint
  container.addChild(new Spacer(1));
  container.addChild(
    new Text(theme.dim("Press any key to close"), 0, 0)
  );

  return container;
}