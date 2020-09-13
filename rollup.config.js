import ts from "@wessberg/rollup-plugin-ts";
import { terser } from "rollup-plugin-terser";

export default {
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
};
