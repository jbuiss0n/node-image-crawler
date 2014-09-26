var PORT = 1337;

var express = require('express');
var bodyParser = require('body-parser');
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
  var job = jobManager.queueNewJob(urls, function (err, job) {
    if (err) {
      res.status(400).send(err);
    }
    else {
      res.status(202).send(job); // should return "201 Created" (job created) or "202 Accepted" (job accepted but not yet confirmed) ?
    }
  });
});

app.get('/jobs', function (req, res, next) {
  var jobs = jobManager.getJobs();
  res.status(200).send(jobs);
});

app.get('/jobs/:id', function (req, res, next) {
  var id = req.param('id');
  var job = jobManager.getJob(id);
  if (!job) {
    res.status(404).send('404 Not Found');
  }
  else {
    res.status(200).send(job);
  }
});

app.get('/', express.static(__dirname + '/static'));

app.get('*', function (req, res, next) {
  res.status(404).send('404 Not Found');
});
app.post('*', function (req, res, next) {
  res.status(405).send('405 Not Allowed');
});
app.put('*', function (req, res, next) {
  res.status(405).send('405 Not Allowed');
});
app.delete('*', function (req, res, next) {
  res.status(405).send('405 Not Allowed');
});

http.createServer(app).listen(PORT, function () {
  console.log('Express server listening on port ' + PORT);
});
