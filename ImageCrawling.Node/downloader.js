var fs = require('fs');
var url = require('url');
var path = require('path');
var mkdirp = require('mkdirp');
var request = require('request');
var trycatch = require('trycatch');

var Downloader = function (config, onComplete) {
  if (!(this instanceof Downloader)) return new Downloader(config, onComplete);
  
  var self = this;
  self._imgs = [];
  self._onComplete = onComplete;
  
  for (var i = 0; i < config.pages.length; i++) {
    var index = i;
    var dest = self._getDestinationPath(config.path, config.pages[index].url);
    
    mkdirp(dest, function () {
      self._downloadImgs(dest, config.pages[index], function (err, files) {
        if (err) return self._onComplete(err);
        config.pages[index].files = files;
        if (index === config.pages.length - 1) {
          self._onComplete(null, config.pages);
        }
      });
    });
  }
};

Downloader.prototype._downloadImgs = function (dest, page, onComplete) {
  var self = this, files = [];
  
  for (var i = 0; i < page.imgs.length; i++) {
    var index = i;
    var img = self._getFullUrl(page, page.imgs[index]);
    var filename = path.basename(img);
    var filepath = path.resolve(dest, filename);
    var _onComplete = function (err) {
      if (files.length === page.imgs.length) {
        onComplete(null, files);
      }
    };
    
    trycatch(function () {
      request(img).pipe(fs.createWriteStream(filepath)).on('end', function (err, res) {
        files.push(filename);
        console.log(filename);
        _onComplete();
      }).on('close', function (err, res) {
        files.push(filename);
        console.log(filename);
        _onComplete();
      }).on('error', function (err, res) {
        files.push(err);
        console.log(err);
        _onComplete();
      });
    }, function (err) {
      files.push(err);
      console.log(err);
      _onComplete();
    });
  }
};

Downloader.prototype._getDestinationPath = function (dest, uri) {
  var self = this, parsed = url.parse(uri);
  
  if (parsed.pathname.substring(0, 1) === '/') {
    parsed.pathname = parsed.pathname.substring(1);
  }
  
  var result = path.resolve('files', dest, parsed.hostname, parsed.pathname.replace('/', '-'));
  return result;
};

Downloader.prototype._getFullUrl = function (page, uri) {
  var self = this, parsed = url.parse(uri);
  
  if (!parsed.hostname) {
    
    if (page.url.substring(page.url.length - 1) === '/' || parsed.pathname.substring(0, 1) === '/') {
      uri = page.url + uri;
    }
    else {
      uri = page.url + '/' + uri;
    }
  }
  return uri;
};

module.exports = Downloader;