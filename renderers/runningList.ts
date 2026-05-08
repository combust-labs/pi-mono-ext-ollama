// SPDX-License-Identifier: Apache-2.0

/**
 * Rich renderer for /ollama-running output
 */

import { Container, Spacer, Text } from "@mariozechner/pi-tui";
import type { OllamaRunningModel } from "../types.js";

export interface RunningListTheme {
  title: (s: string) => string;
  row: (s: string) => string;
  active: (s: string) => string;
  dim: (s: string) => string;
}

export function runningListTheme(theme: { fg: (color: string, text: string) => string }): RunningListTheme {
  return {
    title: (s) => theme.fg("accent", s),
    row: (s) => theme.fg("text", s),
    active: (s) => theme.fg("success", s),
    dim: (s) => theme.fg("dim", s),
  };
}

function formatSize(bytes: number): string {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let unitIndex = 0;
  let size = bytes;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(1)}${units[unitIndex]}`;
}

function formatExpiry(dateStr: string, theme: RunningListTheme): string {
  try {
    const diff = new Date(dateStr).getTime() - Date.now();
    if (diff < 0) return theme.dim("expired");
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return theme.active(`${minutes}m remaining`);
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return theme.active(`${hours}h remaining`);
    return theme.active(`${Math.floor(hours / 24)}d remaining`);
  } catch {
    return dateStr;
  }
}

export function buildRunningListComponent(
  models: OllamaRunningModel[],
  theme: RunningListTheme
): Container {
  const container = new Container();

  // Title
  container.addChild(
    new Text(theme.title(`⚡ Running Models (${models.length})`), 1, 0)
  );
  container.addChild(new Spacer(1));

  if (models.length === 0) {
    container.addChild(
      new Text(theme.dim("  No models loaded in memory."), 0, 0)
    );
    container.addChild(
      new Text(theme.dim("  Start one with /ollama-chat <model> <message>"), 0, 0)
    );
  } else {
    for (const model of models) {
      const size = formatSize(model.size);
      const vram = model.size_vram
        ? ` | VRAM: ${formatSize(model.size_vram)}`
        : "";
      const expiry = formatExpiry(model.expires_at, theme);

      const line = `  ${theme.active("●")} ${model.name.padEnd(24)} ${size}${vram}`;
      container.addChild(new Text(theme.row(line), 0, 0));
      container.addChild(
        new Text(theme.dim(`     expires in ${expiry}`), 0, 0)
      );
      container.addChild(new Spacer(1));
    }
  }

  // Dismiss hint
  container.addChild(new Spacer(1));
  container.addChild(
    new Text(theme.dim("Press any key to close"), 0, 0)
  );

  return container;
}