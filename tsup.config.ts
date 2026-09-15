import { copyFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { defineConfig } from "tsup";

export default defineConfig({
  entry: { index: "src/index.ts" },
  format: ["esm"],
  dts: {
    compilerOptions: {
      skipLibCheck: true,
      strict: false,
    },
  },
  splitting: false,
  sourcemap: true,
  clean: true,
  target: "es2022",
  outDir: "dist",
  external: ["yaml"],
  async onSuccess() {
    const cssSrc = "src/styles.css";
    const cssDest = "dist/styles.css";
    mkdirSync(dirname(cssDest), { recursive: true });
    copyFileSync(cssSrc, cssDest);
  },
});
