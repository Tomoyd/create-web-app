import type { RollupOptions } from 'rollup';
import dts from 'rollup-plugin-dts';
const options: RollupOptions[] = [
  {
    input: 'lib/create.ts',
    plugins: [dts({})],

    output: {
      file: 'dist/create.d.ts',
      format: 'es',
    },
  },
];
export default options;
