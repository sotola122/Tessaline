import { describe, expect, test } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  parseInterfaceSpec,
  renderInterfaceHTML,
  renderInterfaceSVG,
} from "../src/index.ts";

const examplesDir = join(dirname(fileURLToPath(import.meta.url)), "../examples");

const files = readdirSync(examplesDir)
  .filter((name) => name.endsWith(".yml") || name.endsWith(".yaml"))
  .sort();

describe("tessaline examples", () => {
  test("examples/ contains multiple YAML samples", () => {
    expect(files.length).toBeGreaterThanOrEqual(2);
  });

  for (const file of files) {
    test(`parses and renders ${file}`, () => {
      const source = readFileSync(join(examplesDir, file), "utf8");
      const parsed = parseInterfaceSpec(source, { sourceName: file });
      const errors = parsed.diagnostics.filter((item) => item.severity === "error");
      expect(errors, errors.map((item) => item.message).join("\n")).toEqual([]);

      const html = renderInterfaceHTML(source, { sourcePath: file });
      expect(html.html.length).toBeGreaterThan(0);
      expect(html.html).not.toContain("<script");
      expect(html.operationIds.length).toBeGreaterThan(0);

      const svg = renderInterfaceSVG(source, { sourcePath: file });
      expect(svg.svg).toContain("<svg");
      expect((svg.svg.match(/<svg\b/g) ?? []).length).toBe(1);
      expect(svg.svg).not.toContain("foreignObject");
      expect(svg.width).toBeGreaterThan(0);
      expect(svg.height).toBeGreaterThan(0);
    });
  }
});
