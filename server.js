var port = process.env.PORT || 1337;

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

app.get('/jobs/:id/pages/:page', function (req, res, next) {
  var id = req.param('id');
  var page = req.param('page');

  var job = jobManager.getJob(id);

  if (!job || page >= job.pages.length) {
    res.status(404).send('404 Not Found');
  }
  else {
    res.status(200).send(job.pages[page]);
  }
});

// an other possibility here is to directly pipe the current request to another request pointing at the image location
app.get('/jobs/:id/pages/:page/images/:image', function (req, res, next) {
  var id = req.param('id');
  var page = req.param('page');
  var image = req.param('image');

  var job = jobManager.getJob(id);
  
  if (!job || page >= job.pages.length || image >= job.pages[page].images.length) {
    res.status(404).send('404 Not Found');
  }
  else {
    res.writeHead(301, { 'Location': job.pages[page].images[image].src });
    res.end();
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

http.createServer(app).listen(port, function () {
  console.log('Express server listening on port ' + port);
});
