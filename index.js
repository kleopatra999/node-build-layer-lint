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
  var config = extend({}, requireConfig, buildConfig);

  return config.modules.reduce(function(undefinedModules, module) {
    var name = module.name;
    var resolvedName = path.join(modulesRoot, resolveModuleName(config, name));

    if (!checkModuleExists(resolvedName)) {
      undefinedModules.push(name);
    }

    return undefinedModules;
  }, []);
};

function resolveModuleName(config, moduleName) {
  if (config.map && config.map['*'] && config.map['*'][moduleName]) {
    return config.map['*'][moduleName];
  }

  if (config.paths && config.paths[moduleName]) {
    return config.paths[moduleName];
  }

  return moduleName;
}

function checkModuleExists(resolvedModuleName) {
  try { fs.statSync(resolvedModuleName); }
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
