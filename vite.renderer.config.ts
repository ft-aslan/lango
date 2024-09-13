import type { ConfigEnv, UserConfig } from 'vite';
import { defineConfig } from 'vite';
import { pluginExposeRenderer } from './vite.base.config';

import { defineConfig } from "vite";
import { sveltekit } from "@sveltejs/kit/vite";
// https://vitejs.dev/config
export default defineConfig((env) => {
	const forgeEnv = env as ConfigEnv<'renderer'>;
	const { root, mode, forgeConfigSelf } = forgeEnv;
	const name = forgeConfigSelf.name ?? '';

	return {
		root,
		mode,
		base: './',
		build: {
			outDir: `.vite/renderer/${name}`
		},
		plugins: [pluginExposeRenderer(name),sveltekit()],
		resolve: {
			preserveSymlinks: true
		},
		clearScreen: false
	} as UserConfig;
});
