import { describe, expect, test } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { renderInterfaceHTML } from "../src/index.ts";

const sampleYaml = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../samples/interface-spec/interface-spec.yml",
);

describe("interface HTML goldens", () => {
  test("sample-full fragment matches /tmp/golden/interface", () => {
    const golden = "/tmp/golden/interface/sample-full.fragment.html";
    if (!existsSync(sampleYaml) || !existsSync(golden)) {
      expect(existsSync(golden)).toBe(true);
      return;
    }
    const source = readFileSync(sampleYaml, "utf8");
    const rendered = renderInterfaceHTML(source, { idPrefix: "g-" });
    expect(rendered.html).toBe(readFileSync(golden, "utf8"));
  });
});
