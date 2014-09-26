var fs = require('fs');
var url = require('url');
var path = require('path');
var mkdirp = require('mkdirp');
var request = require('request');
var htmlparser = require('htmlparser');

var Crawler = function (page, dest, onComplete) {
  if (!(this instanceof Crawler)) return new Crawler(page, dest, onComplete);
  
  var self = this;
  self._count = 0;
  self._page = page;
  self._dest = dest;
  self._onComplete = onComplete;
  
  request(self._page.url, self._onPageLoaded.bind(self));
};

Crawler.prototype._onPageLoaded = function (err, res, body) {
  var self = this;
  if (err) return self._onComplete(err);
  self._handlePageResponse(res, body);
};

Crawler.prototype._handlePageResponse = function (res, body) {
  var self = this, err;
  
  if (res.statusCode === 200) {
    self._getImages(body);
  }
  else if (res.statusCode === 404) {
    self._onComplete(new Error('Page not found'));
  }
  else {
    err = new Error('Received an unsupported response status code');
    err.statusCode = res.statusCode;
    self._onComplete(err);
  }
};

Crawler.prototype._getImages = function (body) {
  var self = this, err;
  
  var handler = new htmlparser.DefaultHandler(function (error, dom) {
    self._collectImagesRecursive(dom);
  });
  
  new htmlparser.Parser(handler).parseComplete(body);
};

Crawler.prototype._collectImagesRecursive = function (elements) {
  var self = this;
  
  for (var i = 0; i < elements.length; i++) {
    var element = elements[i];
    
    if (self._isImage(element)) {
      var imageUrl = self._getImageUrl(element);
      var filepath = self._getDownloadPath(imageUrl);
      var image = { src: imageUrl, path: filepath, status: 'downloading', };
      
      self._page.images.push(image);
      self._download(image, function (err) {
        image.err = err;
        image.status = !!err ? 'error' : 'downloaded';
        
        if (self._isComplete()) {
          self._onComplete(null, self._imgs);
        }
      });
    }
    else if (element.children) {
      self._collectImagesRecursive(element.children);
    }
  }
};

Crawler.prototype._isComplete = function () {
  var self = this;
  
  return self._page.images.filter(function (image) {
    return image === 'downloading';
  }).length === 0;
};

Crawler.prototype._isImage = function (element) {
  var self = this;
  
  return element.name === 'img' && element.attribs && element.attribs.src;
};

Crawler.prototype._getImageUrl = function (element) {
  var self = this;
  var src = element.attribs.src.trim();
  var parsed = url.parse(src);
  
  if (!parsed.hostname) {
    src = url.resolve(self._page.url, src);
  }
  
  return src;
};

Crawler.prototype._getDownloadPath = function (image) {
  var self = this;
  
  var chars = ['?', '#', ';', ':', '/', '\\', '|', '\'', '"', '&', '%', ',', '!', '=', '---', '--'];
  var filename = url.parse(image).path;
  var parsed = url.parse(self._page.url);
  
  for (var i = 0; i < chars.length; i++) {
    while (filename.indexOf(chars[i]) !== -1) {
      filename = filename.replace(chars[i], '-');
    }
  }
  
  //Uncomment this line to have all images (in case the same image is repeat in the page => px.gif)
  //filename = (self._count++) + '-' + filename;
  
  if (parsed.pathname.substring(0, 1) === '/') {
    parsed.pathname = parsed.pathname.substring(1);
  }
  
  return path.resolve(self._dest, parsed.hostname, parsed.pathname, filename);
};

Crawler.prototype._download = function (image, callback) {
  var self = this;
  var dir = path.dirname(image.path);
  
  mkdirp(dir, function (err) {
    if (err) return callback(err);
    
    request(image.src)
      .pipe(fs.createWriteStream(image.path))
      .on('error', callback.bind(null, new Error('Error while downloading file.')))
      .on('close', callback);
  });
};

module.exports = Crawler;