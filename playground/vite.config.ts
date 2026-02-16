import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "node:path";

export default defineConfig({
  base: './',
	plugins: [vue()],
	resolve: {
		alias: {
			"sileo-vue": resolve(__dirname, "../packages/sileo-vue/src/index.ts"),
		},
	},
});
