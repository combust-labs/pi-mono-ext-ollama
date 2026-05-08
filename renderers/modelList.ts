// SPDX-License-Identifier: Apache-2.0

/**
 * Rich renderer for /ollama-models output
 */

import { Container, Spacer, Text } from "@mariozechner/pi-tui";
import type { OllamaModel } from "../types.js";

export interface ModelListTheme {
  title: (s: string) => string;
  header: (s: string) => string;
  row: (s: string) => string;
  accent: (s: string) => string;
  dim: (s: string) => string;
}

export function modelListTheme(theme: { fg: (color: string, text: string) => string }): ModelListTheme {
  return {
    title: (s) => theme.fg("accent", s),
    header: (s) => theme.fg("muted", s),
    row: (s) => theme.fg("text", s),
    accent: (s) => theme.fg("accent", s),
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

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toISOString().split("T")[0];
  } catch {
    return dateStr;
  }
}

export function buildModelListComponent(
  models: OllamaModel[],
  theme: ModelListTheme
): Container {
  const container = new Container();

  // Title
  container.addChild(
    new Text(theme.title(`📦 Available Models (${models.length})`), 1, 0)
  );
  container.addChild(new Spacer(1));

  if (models.length === 0) {
    container.addChild(
      new Text(theme.dim("  No models found. Pull one with /ollama-pull"), 0, 0)
    );
  } else {
    // Column header
    container.addChild(
      new Text(
        theme.header("  NAME                  SIZE       PARAMS                MODIFIED"),
        0, 0
      )
    );
    container.addChild(new Spacer(1));

    // Model rows
    for (const model of models) {
      const size = formatSize(model.size);
      const modified = formatDate(model.modified_at);
      const params = model.details
        ? `${model.details.parameter_size} (${model.details.quantization_level})`
        : "—";

      // Pad columns for table-like alignment (accounting for Unicode)
      const name = model.name.padEnd(20);
      const sizeStr = size.padEnd(9);
      const paramsStr = params.slice(0, 18).padEnd(18);

      container.addChild(
        new Text(
          theme.row(`  ${name} ${sizeStr} ${paramsStr} ${modified}`),
          0, 0
        )
      );
    }
  }

  // Dismiss hint
  container.addChild(new Spacer(1));
  container.addChild(
    new Text(theme.dim("Press any key to close"), 0, 0)
  );

  return container;
}