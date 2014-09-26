var request = require('request');
var htmlparser = require('htmlparser');

var Crawler = function (config, onComplete) {
  if (!(this instanceof Crawler)) return new Crawler(config, onComplete);
  
  var self = this;
  self._imgs = [];
  self._onComplete = onComplete;
  
  request(config, self._onPageLoaded.bind(self));
};

Crawler.prototype._onPageLoaded = function (err, res, body) {
  var self = this;
  if (err) return self._onComplete(err);
  self._handlePageResponse(res, body);
};

Crawler.prototype._handlePageResponse = function (res, body) {
  var self = this, err;
  
  if (res.statusCode === 200) {
    self._getImgs(body);
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

Crawler.prototype._getImgs = function (body) {
  var self = this, err;
  
  var handler = new htmlparser.DefaultHandler(function (error, dom) {
    self._collectImgsRecursive(dom);
    self._onComplete(null, self._imgs);
  });
  
  new htmlparser.Parser(handler).parseComplete(body);
};

Crawler.prototype._collectImgsRecursive = function (elements) {
  var self = this, element, img;
  for (var i = 0; i < elements.length; i++) {
    element = elements[i];
    if (element.name === 'img' && element.attribs && element.attribs.src) {

      self._imgs.push(element.attribs.src.trim()); // TODO : callback here

    } else if (element.children) {
      self._collectImgsRecursive(element.children);
    }
  }
};

module.exports = Crawler;