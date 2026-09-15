// ─── Interface Spec Parser ───────────────────────────────────────────────────
// YAML spec loader and parser. Tessaline is YAML-only at the document
// boundary; JSON is accepted because the `yaml` parser also reads JSON.

import { parse as parseYaml } from "yaml";
import type { InterfaceSpec } from "./model.ts";

/**
 * Parse an InterfaceSpec from a raw source string (YAML or JSON).
 * The root value MUST be a mapping/object.
 *
 * @param source - Raw YAML or JSON string.
 * @param sourceName - Label for error messages (default: "<inline>").
 * @returns The parsed InterfaceSpec.
 * @throws If the root value is not an object.
 */
export function parseSpec(
  source: string,
  sourceName = "<inline>",
): InterfaceSpec {
  const parsed = parseYaml(source) as unknown;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`${sourceName}: YAML root must be an object.`);
  }
  return parsed as InterfaceSpec;
}

/**
 * Parse a YAML or JSON source into a plain record, rejecting non-object
 * values. Useful for parsing Markdown `apidoc` block configs that must
 * be a mapping.
 *
 * @param source - Raw YAML or JSON string.
 * @param sourceName - Label for error messages (default: "<inline>").
 * @returns The parsed record.
 * @throws If the parsed value is not a non-array object.
 */
export function parseJsonOrYamlObject(
  source: string,
  sourceName = "<inline>",
): Record<string, unknown> {
  const parsed = parseYaml(source) as unknown;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`${sourceName}: block must be a mapping object.`);
  }
  return parsed as Record<string, unknown>;
}
