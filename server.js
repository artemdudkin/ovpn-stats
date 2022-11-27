var os = require('os');
const fs = require('fs');
const http = require('http');

const express = require('express');
const serveStatic = require('serve-static');
const CronJob = require('cron').CronJob
const compression = require('compression');
const ds = require('disk-space');
const axios = require('axios');

const { get_stats, stats, stats2, total_stats } = require('./stats');
const utils = require('./utils');
const { check_expired } = require('./expired');


const SERVER_PORT = 8094;
const OPENVPN_MANAGEMENT_PORT = 8989;
const OVPN_URL = 'http://localhost:2222';
const WEBHOOK_URL = '';

utils.log('cwd dir == ' + process.cwd());
utils.log("config dir == ", __dirname);
utils.log('port == ' + SERVER_PORT);
utils.log('openVpn management port == ' + OPENVPN_MANAGEMENT_PORT);
utils.log('ovpn url == ' + OVPN_URL);
utils.log(WEBHOOK_URL ? 'webhook url == ' + WEBHOOK_URL : 'no web hooks');


(new CronJob('0 */1 * * * *', () => { //every minute - get vpn stats
  get_stats(OPENVPN_MANAGEMENT_PORT, {
    onNewUserOnline: (name) => {
      if (WEBHOOK_URL) {
        const url = WEBHOOK_URL+'&hook=first_connect&name='+name;
        utils.log(`  >>hook (${name}) sending to ${url}`);
        axios.get(url)
             .then(res    => utils.log(`  <<hook (${name}) ok`, res.status))
             .catch(error => utils.log(`  <<hook (${name}) error`, error));

        utils.log(`  >>ovpn (${name}) hide`);
        axios.post(OVPN_URL+'/hide', {name})
             .then(res    => utils.log(`  <<ovpn (${name}) ok`))
             .catch(error => utils.log(`  <<ovpn (${name}) error`, error));
      }
    }
  });
})).start();



(new CronJob('0 0 * * * *', () => { // every hour - checks is there expired users (and removes them)
  check_expired(OVPN_URL, {
    onDeleteUser: (name) => {
      if (WEBHOOK_URL) {
        const url = WEBHOOK_URL+'&hook=expired&name='+name;
        utils.log(`  >>hook (${name}) sending to ${url}`);
        axios.get(url)
             .then(res    => utils.log(`  <<hook (${name}) ok`, res.status))
             .catch(error => utils.log(`  <<hook (${name}) error`, error));
      }
    }
  })
})).start();




var app = express();

app.use(compression());

//static files
app.use(serveStatic('./html'));

//log request
app.use(function(req, res, next) {
  utils.log('<<', req.protocol + '://' + req.get('host') + req.originalUrl);
  next();
})

//get request body
app.use (function(req, res, next) {
    var data='';
    req.setEncoding('utf8');
    req.on('data', chunk => data += chunk);
    req.on('end', function() {
        req.body = data;
        next();
    });
});


/*
app.all('/get-raw-data', function(req, res, next) {
  res.end( JSON.stringify(stats()));
})

app.all('/get-stats', function(req, res, next) {
  res.end( JSON.stringify(stats2()));
})
*/

app.all('/get-total-stats', function(req, res, next) {
  const stime = Date.now();
  res.end( JSON.stringify(total_stats(stats(), stats2())));
  utils.log('   /get-total-stats:', Date.now()-stime, 'ms'); 
})


app.all('/get-hw-stats', function(req, res, next) {
  //RAM (from https://github.com/nodejs/node/issues/23892#issuecomment-657636387)
  const available = 1024 * Number(/MemAvailable:[ ]+(\d+)/.exec(fs.readFileSync('/proc/meminfo', 'utf8'))[1]);
  var ram_used_percent = 100 - Math.round(available / os.totalmem() * 100);

  //DISK
  ds("/" , function(error , data){
    var disk_used_percent = Math.round(data.usedSize / data.totalSize * 100);

    res.end( JSON.stringify({ram_used_percent, disk_used_percent}));
  })
})


app.all('/ovpn/get', function(req, res, next) {
  axios
    .get(OVPN_URL+'/get')
    .then(r => res.end(JSON.stringify(r.data)))
    .catch(error => {
      utils.log('error', error);
      res.status(500).end();
    });
})


app.all('/ovpn/get-prefix', function(req, res, next) {
  axios
    .get(OVPN_URL+'/get-prefix')
    .then(r => res.end(JSON.stringify(r.data)))
    .catch(error => {
      utils.log('error', error);
      res.status(500).end();
    });
})


app.all('/ovpn/add', function(req, res, next) {
  axios
    .post(OVPN_URL+'/add', req.body)
    .then(r => res.end(JSON.stringify(r.data)))
    .catch(error => {
      utils.log('error', error);
      res.status(500).end();
    });
})

app.all('/ovpn/remove', function(req, res, next) {
  axios
    .post(OVPN_URL+'/remove', req.body)
    .then(r => res.end(JSON.stringify(r.data)))
    .catch(error => {
      utils.log('error', error);
      res.status(500).end();
    });
})

app.all('/ovpn/hide', function(req, res, next) {
  axios
    .post(OVPN_URL+'/hide', req.body)
    .then(r => res.end(JSON.stringify(r.data)))
    .catch(error => {
      utils.log('error', error);
      res.status(500).end();
    });
})


http.createServer(app).listen(SERVER_PORT);
