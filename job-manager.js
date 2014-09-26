var url = require('url');
var path = require('path');
var util = require('util');
var crawler = require('./crawler');

var JobManager = function () {
  if (!(this instanceof JobManager)) return new JobManager();
  
  this._jobs = {};
};

JobManager.prototype.queueNewJob = function (urls, callback) {
  var self = this, id;
  
  if (!util.isArray(urls)) return callback(new Error('urls must be and Array of urls'));
  
  id = Date.now();
  self._jobs[id] = self._createJob(id, urls);
  
  callback(null, self._jobs[id]);
};

JobManager.prototype.getJobs = function (status) {
  var self = this;
  return Object.keys(self._jobs).filter(function (id) {
    return !status || self._jobs[id].status === status;
  }).map(function (id) {
    return self._jobs[id];
  });
};

JobManager.prototype.getJob = function (id) {
  var self = this;
  return self._jobs[id];
};

JobManager.prototype._createJob = function (id, urls) {
  var self = this;
  
  var job = {
    id: id,
    path: path.resolve('files', id.toString()),
    pages: urls.map(function (url) { return { url: url, images: [], status: 'crawling' }; }),
    status: 'crawling',
  };
  
  var updateJobStatus = function () {
    var workingPages = job.pages.filter(function (page) {
      return page.status === 'crawling';
    });
    
    if (workingPages.length === 0) {
      job.status = 'finish';
    }
  };
  
  for (var i = 0; i < job.pages.length; i++) {
    var page = job.pages[i];
    crawler(page, job.path, function (err) {
      page.err = err;
      page.status = !!err ? 'error' : 'finish';
      updateJobStatus();
    });
  }
  
  return job;
};

module.exports = JobManager;