const ejs = require('ejs');
const fs = require('fs');
const path = require('path');
const { format } = require('prettier-package-json');
const dependencies = {
  '@types/fs-extra': '^9.0.13',
  '@types/inquirer': '^8.2.1',
  arg: '^5.0.1',
  chalk: '^4.1.2',
  commander: '^9.3.0',
  ejs: '^3.1.8',
  esbuild: '^0.14.42',
  esm: '^3.2.25',
  execa: '^5.1.1',
  'fs-extra': '^10.1.0',
  globby: '^13.1.1',
  inquirer: '^8.2.2',
  listr: '^0.14.3',
  ncp: '^2.0.0',
  'pkg-install': '^1.0.0',
  rollup: '^2.70.1',
  typescript: '^4.7.3',
};
ejs
  .renderFile(path.join(__dirname, 'package.ejs'), {
    name: 'web-app',
    dependencies: JSON.stringify(dependencies),
  })
  .then((str) => {
    str = format(JSON.parse(str));
    console.log('str', str);
    fs.writeFileSync('my.json', str);
  });
