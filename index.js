var fs = require('fs');
var path = require('path');
var extend = require('extend');
var ConfigFile = require('requirejs-config-file').ConfigFile;

/**
 * Given a path to a build.json file, check that each build layer
 * specified actually exits.
 *
 * @param {String} configPath - Path to build.json file
 * @param {String} modulesRoot - Root directory containing all of the source modules
 *
 * @return {Array} List of all module names that do not have an associated file
 */
module.exports = function(configPath, modulesRoot) {
  modulesRoot = modulesRoot || '.';

  var buildConfig = readBuildConfig(configPath);
  var requireConfig = readRequireConfig(buildConfig);
  var reqConfig = extend({}, requireConfig);
  var config = extend({}, requireConfig, buildConfig);
  var moduleNames = config.modules.reduce(function(names, module) {
    names.push(module.name);

    if (module.include) {
      names = arrayUnion(names, module.include);
    }
    if (module.exclude) {
      names = arrayUnion(names, module.exclude);
    }

    return names;
  }, []);

  return moduleNames.reduce(function(undefinedModules, name) {
    var resolvedName = path.join(modulesRoot, resolveModuleName(config, reqConfig, name));

    if (!checkModuleExists(resolvedName)) {
      undefinedModules.push(name);
    }

    return undefinedModules;
  }, []);
};

function arrayUnion(arrA, arrB) {
  return arrA.concat(arrB.filter(function(item) {
    return arrA.indexOf(item) === -1;
  }));
}

function resolveModuleName(config, requireConfig, moduleName) {
  var splitPath = moduleName.split(path.sep);
  var pathRoot = splitPath[0];

  if (config.map && config.map['*'] && config.map['*'][moduleName]) {
    return config.map['*'][moduleName];
  }

  // only the path root can be a lookup, as lookups are either relative to
  // a baseUrl, or to /
  if (requireConfig.paths && requireConfig.paths.hasOwnProperty(pathRoot)) {
    splitPath[0] = requireConfig.paths[pathRoot];
    moduleName = splitPath.join(path.sep);
  }

  return moduleName;
}

function checkModuleExists(resolvedModuleName) {
  var fileName = !!~resolvedModuleName.indexOf('.js') ? resolvedModuleName : resolvedModuleName + '.js';

  try { fs.statSync(fileName); }
  catch(e) { return false; }

  return true;
}

function readBuildConfig(configPath) {
  var fileContents = fs.readFileSync(path.resolve(configPath)).toString();
  return JSON.parse(fileContents);
}

function readRequireConfig(buildConfig) {
  if (!buildConfig.mainConfigFile) { return; }

  var configPath = path.join(process.cwd(), buildConfig.mainConfigFile);

  try { fs.statSync(configPath); }
  catch(e) { throw new Error('require.js config file does not exist at "' + configPath + '"'); }

  return (new ConfigFile(configPath)).read();
}
