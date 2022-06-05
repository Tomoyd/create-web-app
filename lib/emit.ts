import fse from 'fs-extra';
import path from 'path';
import { format } from 'prettier-package-json';
import { createPkg } from './pkg';
const { getPkg, extendsPkg } = createPkg();
export const emitFile = (dir, files = [], name) => {
  files.forEach((file) => {
    const filepath = path.join(dir, file);
    try {
      const wPath = path.join(process.cwd(), name, file);
      fse.ensureDirSync(path.dirname(wPath));
      //   fse.writeFileSync(wPath, fse.readFileSync(filepath));
      fse.createReadStream(filepath).pipe(fse.createWriteStream(wPath));
      emitJson(name);
    } catch (error) {
      console.log('error', error);
    }
  });
};

function emitJson(pName) {
  extendsPkg({ name: pName });
  fse.writeFileSync(
    path.join(process.cwd(), pName, 'package.json'),
    format(getPkg(), { enforceMultiple: true }),
  );
}
