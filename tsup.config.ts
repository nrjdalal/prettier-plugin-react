import { defineConfig } from "tsup"

export default defineConfig({
  clean: true,
  entry: {
    index: "src/index.ts",
  },
  format: ["cjs", "esm"],
  minify: true,
  outDir: "dist",
})
