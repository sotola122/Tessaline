import { describe, expect, test } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

describe("tessaline isolation", () => {
  test("source does not import elkjs, yoga, or mermaid", () => {
    const root = join(dirname(fileURLToPath(import.meta.url)), "../src");
    const walk = (dir: string): string[] =>
      readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const path = join(dir, entry.name);
        if (entry.isDirectory()) return walk(path);
        return entry.name.endsWith(".ts") ? [path] : [];
      });
    for (const file of walk(root)) {
      const source = readFileSync(file, "utf8");
      expect(source, file).not.toMatch(/elkjs/);
      expect(source, file).not.toMatch(/from ["']yoga/);
      expect(source, file).not.toMatch(/beautiful-mermaid/);
    }
  });
});
