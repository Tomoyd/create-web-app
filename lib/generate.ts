import { globby } from 'globby';
import path from 'path';
import { emitFile } from './emit';

export const generate = async (relativeDir, name = '') => {
  const dir = path.join(process.cwd(), 'dist/template/' + relativeDir);
  const files = await globby(['**/*'], {
    cwd: dir,
    dot: true,
  });
  console.log('files', files);
  emitFile(dir, files, name);
};
