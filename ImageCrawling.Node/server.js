var PORT = 1337;

var express = require('express');
var bodyParser = require('body-parser');
var trycatch = require('trycatch');
var http = require('http');
var path = require('path');

var JobManager = require('./job-manager.js');

var app = express();
var jobManager = new JobManager();

app.use(bodyParser.json());

app.use(function (req, res, next) {
  console.log(req.url);
  return next();
});

app.post('/jobs', function (req, res, next) {
  var urls = req.body;
  var job = jobManager.queueNewJob(urls);
  res.status(201).send(job);
});

app.get('/jobs', function (req, res, next) {
  var jobs = jobManager.getJobs();
  res.status(200).send(jobs);
});

app.get('/jobs/:id', function (req, res, next) {
  //TODO : get job by id
});

app.get('/jobs/:id/result', function (req, res, next) {
  //TODO : get job result by id
});

app.use('/', express.static(__dirname + '/static'));

http.createServer(app).listen(PORT, function () {
  console.log('Express server listening on port ' + PORT);
});
