'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var fse = require('fs-extra');
var fs = require('node:fs');
var path = require('node:path');
require('merge2');
var fastGlob = require('fast-glob');
var dirGlob = require('dir-glob');
var process$1 = require('node:process');
var gitIgnore = require('ignore');
var node_url = require('node:url');
require('node:stream');
var path$1 = require('path');
var prettierPackageJson = require('prettier-package-json');
var inquirer = require('inquirer');
var chalk = require('chalk');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var fse__default = /*#__PURE__*/_interopDefaultLegacy(fse);
var fs__default = /*#__PURE__*/_interopDefaultLegacy(fs);
var path__default = /*#__PURE__*/_interopDefaultLegacy(path);
var fastGlob__default = /*#__PURE__*/_interopDefaultLegacy(fastGlob);
var dirGlob__default = /*#__PURE__*/_interopDefaultLegacy(dirGlob);
var process__default = /*#__PURE__*/_interopDefaultLegacy(process$1);
var gitIgnore__default = /*#__PURE__*/_interopDefaultLegacy(gitIgnore);
var path__default$1 = /*#__PURE__*/_interopDefaultLegacy(path$1);
var inquirer__default = /*#__PURE__*/_interopDefaultLegacy(inquirer);
var chalk__default = /*#__PURE__*/_interopDefaultLegacy(chalk);

function slash(path) {
	const isExtendedLengthPath = /^\\\\\?\\/.test(path);
	const hasNonAscii = /[^\u0000-\u0080]+/.test(path); // eslint-disable-line no-control-regex

	if (isExtendedLengthPath || hasNonAscii) {
		return path;
	}

	return path.replace(/\\/g, '/');
}

const toPath = urlOrPath => urlOrPath instanceof URL ? node_url.fileURLToPath(urlOrPath) : urlOrPath;

const isNegativePattern = pattern => pattern[0] === '!';

const ignoreFilesGlobOptions = {
	ignore: [
		'**/node_modules',
		'**/flow-typed',
		'**/coverage',
		'**/.git',
	],
	absolute: true,
	dot: true,
};

const GITIGNORE_FILES_PATTERN = '**/.gitignore';

const applyBaseToPattern = (pattern, base) => isNegativePattern(pattern)
	? '!' + path__default["default"].posix.join(base, pattern.slice(1))
	: path__default["default"].posix.join(base, pattern);

const parseIgnoreFile = (file, cwd) => {
	const base = slash(path__default["default"].relative(cwd, path__default["default"].dirname(file.filePath)));

	return file.content
		.split(/\r?\n/)
		.filter(line => line && !line.startsWith('#'))
		.map(pattern => applyBaseToPattern(pattern, base));
};

const toRelativePath = (fileOrDirectory, cwd) => {
	cwd = slash(cwd);
	if (path__default["default"].isAbsolute(fileOrDirectory)) {
		if (slash(fileOrDirectory).startsWith(cwd)) {
			return path__default["default"].relative(cwd, fileOrDirectory);
		}

		throw new Error(`Path ${fileOrDirectory} is not in cwd ${cwd}`);
	}

	return fileOrDirectory;
};

const getIsIgnoredPredicate = (files, cwd) => {
	const patterns = files.flatMap(file => parseIgnoreFile(file, cwd));
	const ignores = gitIgnore__default["default"]().add(patterns);

	return fileOrDirectory => {
		fileOrDirectory = toPath(fileOrDirectory);
		fileOrDirectory = toRelativePath(fileOrDirectory, cwd);
		return ignores.ignores(slash(fileOrDirectory));
	};
};

const normalizeOptions$1 = (options = {}) => ({
	cwd: toPath(options.cwd) || process__default["default"].cwd(),
});

const isIgnoredByIgnoreFiles = async (patterns, options) => {
	const {cwd} = normalizeOptions$1(options);

	const paths = await fastGlob__default["default"](patterns, {cwd, ...ignoreFilesGlobOptions});

	const files = await Promise.all(
		paths.map(async filePath => ({
			filePath,
			content: await fs__default["default"].promises.readFile(filePath, 'utf8'),
		})),
	);

	return getIsIgnoredPredicate(files, cwd);
};

const assertPatternsInput = patterns => {
	if (patterns.some(pattern => typeof pattern !== 'string')) {
		throw new TypeError('Patterns must be a string or an array of strings');
	}
};

const toPatternsArray = patterns => {
	patterns = [...new Set([patterns].flat())];
	assertPatternsInput(patterns);
	return patterns;
};

const checkCwdOption = options => {
	if (!options.cwd) {
		return;
	}

	let stat;
	try {
		stat = fs__default["default"].statSync(options.cwd);
	} catch {
		return;
	}

	if (!stat.isDirectory()) {
		throw new Error('The `cwd` option must be a path to a directory');
	}
};

const normalizeOptions = (options = {}) => {
	options = {
		ignore: [],
		expandDirectories: true,
		...options,
		cwd: toPath(options.cwd),
	};

	checkCwdOption(options);

	return options;
};

const normalizeArguments = fn => async (patterns, options) => fn(toPatternsArray(patterns), normalizeOptions(options));

const getIgnoreFilesPatterns = options => {
	const {ignoreFiles, gitignore} = options;

	const patterns = ignoreFiles ? toPatternsArray(ignoreFiles) : [];
	if (gitignore) {
		patterns.push(GITIGNORE_FILES_PATTERN);
	}

	return patterns;
};

const getFilter = async options => {
	const ignoreFilesPatterns = getIgnoreFilesPatterns(options);
	return createFilterFunction(
		ignoreFilesPatterns.length > 0 && await isIgnoredByIgnoreFiles(ignoreFilesPatterns, {cwd: options.cwd}),
	);
};

const createFilterFunction = isIgnored => {
	const seen = new Set();

	return fastGlobResult => {
		const path = fastGlobResult.path || fastGlobResult;
		const pathKey = path__default["default"].normalize(path);
		const seenOrIgnored = seen.has(pathKey) || (isIgnored && isIgnored(path));
		seen.add(pathKey);
		return !seenOrIgnored;
	};
};

const unionFastGlobResults = (results, filter) => results.flat().filter(fastGlobResult => filter(fastGlobResult));

const convertNegativePatterns = (patterns, options) => {
	const tasks = [];

	while (patterns.length > 0) {
		const index = patterns.findIndex(pattern => isNegativePattern(pattern));

		if (index === -1) {
			tasks.push({patterns, options});
			break;
		}

		const ignorePattern = patterns[index].slice(1);

		for (const task of tasks) {
			task.options.ignore.push(ignorePattern);
		}

		if (index !== 0) {
			tasks.push({
				patterns: patterns.slice(0, index),
				options: {
					...options,
					ignore: [
						...options.ignore,
						ignorePattern,
					],
				},
			});
		}

		patterns = patterns.slice(index + 1);
	}

	return tasks;
};

const getDirGlobOptions = (options, cwd) => ({
	...(cwd ? {cwd} : {}),
	...(Array.isArray(options) ? {files: options} : options),
});

const generateTasks = async (patterns, options) => {
	const globTasks = convertNegativePatterns(patterns, options);

	const {cwd, expandDirectories} = options;

	if (!expandDirectories) {
		return globTasks;
	}

	const patternExpandOptions = getDirGlobOptions(expandDirectories, cwd);
	const ignoreExpandOptions = cwd ? {cwd} : undefined;

	return Promise.all(
		globTasks.map(async task => {
			let {patterns, options} = task;

			[
				patterns,
				options.ignore,
			] = await Promise.all([
				dirGlob__default["default"](patterns, patternExpandOptions),
				dirGlob__default["default"](options.ignore, ignoreExpandOptions),
			]);

			return {patterns, options};
		}),
	);
};

const globby = normalizeArguments(async (patterns, options) => {
	const [
		tasks,
		filter,
	] = await Promise.all([
		generateTasks(patterns, options),
		getFilter(options),
	]);
	const results = await Promise.all(tasks.map(task => fastGlob__default["default"](task.patterns, task.options)));

	return unionFastGlobResults(results, filter);
});

var __defProp = Object.defineProperty;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
const createPkg = () => {
  const pkg = {
    name: "",
    version: "0.1.0",
    dependencies: {},
    devDependencies: {}
  };
  const getPkg = () => pkg;
  const extendsPkg = (config) => {
    Object.keys(config).forEach((k) => {
      if (Array.isArray(pkg[k])) {
        pkg[k] = [...pkg[k], ...config[k]];
        return;
      }
      if (typeof pkg[k] === "string") {
        pkg[k] = config[k];
        return;
      }
      pkg[k] = __spreadValues(__spreadValues({}, pkg[k] || {}), config[k]);
    });
  };
  return {
    getPkg,
    extendsPkg
  };
};

const { getPkg, extendsPkg } = createPkg();
const emitFile = (dir, files = [], name) => {
  files.forEach((file) => {
    const filepath = path__default$1["default"].join(dir, file);
    try {
      const wPath = path__default$1["default"].join(process.cwd(), name, file);
      fse__default["default"].ensureDirSync(path__default$1["default"].dirname(wPath));
      fse__default["default"].createReadStream(filepath).pipe(fse__default["default"].createWriteStream(wPath));
      emitJson(name);
    } catch (error) {
      console.log("error", error);
    }
  });
};
function emitJson(pName) {
  extendsPkg({ name: pName });
  fse__default["default"].writeFileSync(path__default$1["default"].join(process.cwd(), pName, "package.json"), prettierPackageJson.format(getPkg(), { enforceMultiple: true }));
}

const generate = async (relativeDir, name = "") => {
  const dir = path__default$1["default"].join(process.cwd(), "dist/template/" + relativeDir);
  const files = await globby(["**/*"], {
    cwd: dir,
    dot: true
  });
  console.log("files", files);
  emitFile(dir, files, name);
};

function defineConfigs(questions2) {
  return questions2;
}
const questions = async () => {
  const questions2 = defineConfigs([
    {
      name: "frameworks",
      message: `check the framework needed for your project: `,
      type: "list",
      choices: [
        {
          name: "React",
          value: "react"
        },
        {
          name: "Vue",
          value: "vue"
        }
      ]
    },
    {
      name: "language",
      message: `check the language needed for your project: `,
      type: "list",
      choices: [
        {
          name: "typescript",
          value: "ts"
        },
        {
          name: "javascript",
          value: "js"
        }
      ]
    }
  ]);
  return await inquirer__default["default"].prompt(questions2);
};

async function create(projectName) {
  if (fse__default["default"].pathExistsSync(path__default$1["default"].join(process.cwd(), projectName))) {
    console.error(chalk__default["default"].red(`Error:  ${projectName} has existed`));
    process.exit(1);
  }
  const answers = await questions();
  generate(answers.language + "/" + answers.frameworks, projectName);
  return projectName;
}

exports.create = create;
