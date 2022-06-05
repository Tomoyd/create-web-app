import type { RollupOptions } from 'rollup';
import esbuild from 'rollup-plugin-esbuild';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import dts from 'rollup-plugin-dts';
const options: RollupOptions[] = [
  {
    input: 'lib/create.ts',
    plugins: [esbuild(), nodeResolve({ modulesOnly: true })],
    output: {
      file: 'dist/create.js',
      format: 'cjs',
    },
  },
  {
    input: 'lib/create.ts',
    plugins: [dts()],
    output: {
      file: 'dist/create.d.ts',
      format: 'es',
    },
  },
];
export default options;
