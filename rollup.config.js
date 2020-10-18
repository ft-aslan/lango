import svelte from "rollup-plugin-svelte";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import livereload from "rollup-plugin-livereload";
import { terser } from "rollup-plugin-terser";
import preprocess from "svelte-preprocess";
import typescript from "@rollup/plugin-typescript";
import json from "@rollup/plugin-json";

// import builtins from 'rollup-plugin-node-builtins';
// import globals from 'rollup-plugin-node-globals';
// import polyfills from 'rollup-plugin-node-polyfills';
// import externals from 'rollup-plugin-node-externals'

const production = !process.env.ROLLUP_WATCH;

export default [
  {
    input: ["src/electron.ts"],
    output: {
      sourcemap: true,
      format: "cjs",
      dir: "public/build",
    },
    plugins: [typescript({ sourceMap: !production })],
    external: [
      "electron",
      "child_process",
      "fs",
      "path",
      "url",
      "module",
      "os",
      "stream",
      "tty"
    ],
  },
  {
    input: ["src/svelte.ts"],
    output: {
      sourcemap: true,
      format: "cjs",
      dir: "public/build",
      exports: "auto",
    },
    plugins: [
      svelte({
        // enable run-time checks when not in production
        dev: !production,
        // we'll extract any component CSS out into
        // a separate file - better for performance
        css: (css) => {
          css.write("public/build/bundle.css");
        },
        preprocess: preprocess(),
      }),

      // If you have external dependencies installed from
      // npm, you'll most likely need these plugins. In
      // some cases you'll need additional configuration -
      // consult the documentation for details:
      // https://github.com/rollup/plugins/tree/master/packages/commonjs
      typescript({ sourceMap: !production }),
      //polyfills(),
      resolve({
        browser: true,
        dedupe: ["svelte"],
        preferBuiltins: true,
      }),
      commonjs(),
      json(),

      // In dev mode, call `npm run start` once
      // the bundle has been generated
      //			!production && serve(),

      // Watch the `public` directory and refresh the
      // browser on changes when not in production
      !production && livereload("public"),

      // If we're building for production (npm run build
      // instead of npm run dev), minify
      production && terser(),
    ],
    external: [
      "electron",
      "child_process",
      "fs",
      "path",
      "url",
      "module",
      "os",
      "util",
      "worker_threads",
      "http",
      "https",
      "zlib",
      "assert",
    ],
    watch: {
      clearScreen: false,
    },
  },
];

// function serve() {
// 	let started = false;

// 	return {
// 		writeBundle() {
// 			if (!started) {
// 				started = true;

// 				require('child_process').spawn('npm', ['run', 'svelte-start', '--', '--dev'], {
// 					stdio: ['ignore', 'inherit', 'inherit'],
// 					shell: true
// 				});
// 			}
// 		}
// 	};
// }
