var buildLayerLint = require('../');

var fs = require('fs');
var path = require('path');
var mockFs = require('mock-fs');

var expect = require('chai').expect;

var fixturePath = path.join(__dirname, './fixtures');

describe('buildLayerLint', function() {
  afterEach(function() {
    mockFs.restore();
  });

  it('is requirable', function() {
    expect(buildLayerLint).to.exist;
  });

  describe('given a build.json file', function() {
    it('reads it when it exists', function() {
      mockFs({
        'build.json': fs.readFileSync(path.join(fixturePath, 'simple/build.json'))
      });

      expect(function() {
        buildLayerLint('build.json');
      }).to.not.throw(Error);
    });

    it('throws an error when it does not exist', function() {
      mockFs();

      expect(function() {
        buildLayerLint('build.json');
      }).to.throw(/no such file or directory/);
    });
  });

  describe('given a build.json with a mainConfigFile', function() {
    it('reads reads it when it exists', function() {
      mockFs({
        'build.json': fs.readFileSync(path.join(fixturePath, 'with-config/build.json')),
        'config.js': fs.readFileSync(path.join(fixturePath, 'with-config/config.js'))
      });

      expect(function() {
        buildLayerLint('build.json');
      }).to.not.throw(Error);
    });

    it('throws an error when it does not exist', function() {
      mockFs({
        'build.json': fs.readFileSync(path.join(fixturePath, 'with-config/build.json')),
      });

      expect(function() {
        buildLayerLint('build.json');
      }).to.throw(/require\.js config file does not exist/);
    });
  });

  describe('given a build.json where all modules are defined', function() {
    it('returns an empty array', function() {
      mockFs({
        'build.json': fs.readFileSync(path.join(fixturePath, 'simple/build.json')),
        'foo': 'foo',
        'bar': 'bar'
      });

      expect(buildLayerLint('build.json')).to.deep.equal([]);
    });
  });

  describe('given a build.json where all modules are not defined', function() {
    it('returns an array of the undefined module names', function() {
      mockFs({
        'build.json': fs.readFileSync(path.join(fixturePath, 'simple/build.json')),
        'foo': 'foo',
      });

      expect(buildLayerLint('build.json')).to.deep.equal(['bar']);
    });
  });

  describe('given a build.json where paths are given in a config', function() {
    it('returns an array of the undefined module names', function() {
      mockFs({
        'build.json': fs.readFileSync(path.join(fixturePath, 'with-config/build.json')),
        'config.js': fs.readFileSync(path.join(fixturePath, 'with-config/config.js')),
        'vendor/foo': 'foo',
        'bar': 'bar'
      });

      expect(buildLayerLint('build.json')).to.deep.equal([]);
    });
  });

  describe('given a module root', function() {
    it('searches for module relative to that module root', function() {
      mockFs({
        'build.json': fs.readFileSync(path.join(fixturePath, 'with-config/build.json')),
        'config.js': fs.readFileSync(path.join(fixturePath, 'with-config/config.js')),
        'forks/vendor/foo': 'foo',
        'forks/bar': 'bar'
      });

      expect(buildLayerLint('build.json', 'forks')).to.deep.equal([]);
    });
  });
});