import arg from 'arg';
import inquirer from 'inquirer';
import { createProject } from './main';
import chalk from 'chalk';

function parseArgumentsInputOptions(rawArgs) {
  const args = arg(
    {
      '--git': Boolean,
      '--yes': Boolean,
      '--install': Boolean,
      '--template': String,
      '-g': '--git',
      '-y': '--yes',
      '-i': '--install',
    },
    rawArgs.slice(2),
  );

  if (!args._[0]) {
    console.error(chalk.red('Error: project name cannot empty'));
    process.exit(1);
  }

  return {
    skipPrompts: args['--yes'] || false,
    git: args['--git'] || false,
    template: args['--template'],
    projectName: args._[0],
    runInstall: args['--install'] || false,
  };
}

async function promptForMissionOption(options) {
  const defaultTemplate = 'JavaScript';
  if (options.skipPrompts) {
    return {
      ...options,
      template: options.template || defaultTemplate,
    };
  }

  const question = [];

  if (!options.template) {
    question.push({
      type: 'list',
      name: 'template',
      message: 'Please choose which project template to use',
      choices: ['JavaScript', 'TypeScript'],
      default: defaultTemplate,
    });
  }

  if (options.git) {
    question.push({
      type: 'confirm',
      name: 'git',
      message: 'Initialize a git repository',
      default: false,
    });
  }

  const answers = await inquirer.prompt(question);
  return {
    ...options,
    template: options.template || answers.template,
  };
}

export async function cli(args) {
  let options = parseArgumentsInputOptions(args);
  options = await promptForMissionOption(options);
  await createProject(options);
}
