'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var arg = require('arg');
var inquirer = require('inquirer');
var chalk = require('chalk');
var fs = require('fs');
var ncp = require('ncp');
var path = require('path');
var util = require('util');
var execa = require('execa');
var Listr = require('listr');
var pkgInstall = require('pkg-install');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var arg__default = /*#__PURE__*/_interopDefaultLegacy(arg);
var inquirer__default = /*#__PURE__*/_interopDefaultLegacy(inquirer);
var chalk__default = /*#__PURE__*/_interopDefaultLegacy(chalk);
var fs__default = /*#__PURE__*/_interopDefaultLegacy(fs);
var ncp__default = /*#__PURE__*/_interopDefaultLegacy(ncp);
var path__default = /*#__PURE__*/_interopDefaultLegacy(path);
var execa__default = /*#__PURE__*/_interopDefaultLegacy(execa);
var Listr__default = /*#__PURE__*/_interopDefaultLegacy(Listr);

const access = util.promisify(fs__default["default"].access);
const copy = util.promisify(ncp__default["default"]);
async function initGit(options) {
  const result = await execa__default["default"]('git', ['init'], {
    cwd: options.targetDirectory,
  });
  if (result.failed) {
    return Promise.reject(new Error('Failed to initialize git'));
  }
  return;
}

async function copyTemplateFiles(options) {
  return copy(options.templateDirectory, options.targetDirectory, {
    clobber: false,
  });
}

async function createProject(options) {
  options = {
    ...options,
    targetDirectory:
      options.targetDirectory || path__default["default"].join(process.cwd(), options.projectName),
  };

  const templateDir = path__default["default"].resolve(
    __dirname,
    '../templates',
    options.template.toLowerCase(),
  );

  options.templateDirectory = templateDir;

  try {
    await access(templateDir, fs__default["default"].constants.R_OK);
  } catch (err) {
    console.log('err', err);
    console.error('%s Invalid template name', chalk__default["default"].red.bold('ERROR'));
    process.exit(1);
  }

  const tasks = new Listr__default["default"]([
    {
      title: 'Copy project files',
      task: () => copyTemplateFiles(options),
    },
    {
      title: 'Initialize git',
      task: () => initGit(options),
      enabled: () => options.git,
    },
    {
      title: 'Install dependencies',
      task: () =>
        pkgInstall.projectInstall({
          cwd: options.targetDirectory,
        }),
      skip: () =>
        !options.runInstall
          ? 'Pass --install to automatically install dependencies'
          : undefined,
    },
  ]);

  await tasks.run();
  return true;
}

function parseArgumentsInputOptions(rawArgs) {
  const args = arg__default["default"](
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
    console.error(chalk__default["default"].red('Error: project name cannot empty'));
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

  const answers = await inquirer__default["default"].prompt(question);
  return {
    ...options,
    template: options.template || answers.template,
  };
}

async function cli(args) {
  let options = parseArgumentsInputOptions(args);
  options = await promptForMissionOption(options);
  await createProject(options);
  console.log('options', options);
}

exports.cli = cli;
