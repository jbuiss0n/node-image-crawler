var url = require('url');
var path = require('path');
var util = require('util');
var crawler = require('./crawler');
var downloader = require('./downloader');

var JobManager = function () {
  if (!(this instanceof JobManager)) return new JobManager();
  
  this._jobs = {};
};

JobManager.prototype.queueNewJob = function (urls) {
  var self = this, id;
  
  if (!util.isArray(urls)) throw new Exception('urls must be and Array of urls');
  
  id = Date.now();
  self._jobs[id] = self._createJob(id, urls);
  
  return self._jobs[id];
};

JobManager.prototype.getJobs = function (status) {
  var self = this;
  return Object.keys(self._jobs).filter(function (id) {
    return !status || self._jobs[id].status === status;
  }).map(function (id) {
    return self._jobs[id];
  });
};

JobManager.prototype._createJob = function (id, urls) {
  var self = this;
  
  var job = {
    id: id,
    urls: urls,
    status: 'crawling',
    results: []
  };
  
  for (var i = 0; i < urls.length; i++) {
    var url = urls[i];
    crawler({ url: url }, function (err, data) {
      job.results.push({ url: url, err: err, imgs: data });
      if (job.results.length === job.urls.length) {
        self._onCrawled(job);
      }
    });
  }
  
  return job;
};

JobManager.prototype._onCrawled = function (job) {
  job.status = 'finish';
};

module.exports = JobManager;