import { defineConfig } from "rollup";
import { terser } from "rollup-plugin-terser";
import ts from "rollup-plugin-ts";

export default defineConfig({
	input: "./src/index.ts",
	output: [
		{
			file: "./dist/esm/bundle.min.mjs",
			format: "esm",
		},
		{
			file: "./dist/cjs/bundle.min.js",
			format: "cjs",
		},
	],
	plugins: [ts(), terser()],
});
