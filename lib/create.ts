import fse from 'fs-extra';
import { generate } from './generate';
import { questions } from './question';
import path from 'path';
import chalk from 'chalk';
export async function create(projectName) {
  if (fse.pathExistsSync(path.join(process.cwd(), projectName))) {
    console.error(chalk.red(`Error:  ${projectName} has existed`));
    process.exit(1);
  }
  const answers = await questions();
  generate(answers.language + '/' + answers.frameworks, projectName);
  return projectName;
}
