const { Telnet } = require('telnet-client')
const fs = require('fs');
const utils = require('./utils');

const saved_data = JSON.parse(fs.readFileSync('./data/data.json'));
utils.log('DATA READ');

const saved_stats = JSON.parse(fs.readFileSync('./data/stats.json'));
utils.log('STATS READ');

const saved_wasOnline = JSON.parse(fs.readFileSync('./data/wasOnline.json'));
utils.log('WASONLINE READ');


function stats() {
  return saved_data; 
}

function stats2() {
  return last_stats( saved_stats);
}


/**
 * Соединяется с OpenVPN management interface и получает результаты команды status
 * и сохраняет результаты в data.json, а какую-то статистику сохраняет в stats.json
 * а если пользователь появляется первый раз в онлайне, то вызывает opt.onNewUserOnline 
 * (и хранит пользователей, вышедших в онлайн, в файле wasOnline.json)
 * 
 * @param port {Number}
 * @param opt {Object}
 *          onNewUserOnline {Function}
 *            @param name {String}
 */
function get_stats(port, opt) {
  if (!port) port = 7505;

  const stime = Date.now();
  utils.log('  getting stats...');

  const connection = new Telnet()

  const params = {
    host: '127.0.0.1',
    port: port,
    shellPrompt: '>INFO', // or negotiationMandatory: false
    timeout: 1000,
    debug: true
  }

  var recieved = '';

  connection.on('ready', prompt => {
    connection.send('status');
  })
  connection.on('data', data => {

//utils.log('raw_data:', data.toString())

    if (data.indexOf('\nEND') === -1) {
      recieved = recieved + data.toString();
    } else {
      recieved = recieved + data.toString();

      var onlineUsers = [];
      var updated = 0;
      var created = 0;
                                                               
      const stats_minute = Math.trunc(Date.now() /1000 /60) * 1000 *60;
      const stats_hour = Math.trunc(Date.now() /1000 /60 /60) * 1000 *60 *60;
      const stats_day = Math.trunc(Date.now() /1000 /60 /60 /24) * 1000 *60 *60 *24;
      const stats_month = new Date((new Date()).getFullYear(), (new Date()).getMonth(), 1).getTime();

      recieved
      .split('\n')
      .filter(itm => itm.startsWith('CLIENT_LIST'))
      .forEach(itm => {
               const x = itm.split(',');
               const common_name = x[1];
               const client_id = x[10];
               const bytes_recieved = parseInt(x[5]);
               const bytes_sent = parseInt(x[6]);
               const connected_since = new Date(+x[8] * 1000);

               onlineUsers.push(common_name);

               if (!saved_data[common_name]) saved_data[common_name] = {};

               (saved_data[common_name][client_id] ? updated++ : created++);

               var delta_recieved;
               var delta_sent;
               if (saved_data[common_name][client_id]) {
                 delta_recieved = bytes_recieved - saved_data[common_name][client_id].bytes_recieved;
                 delta_sent     = bytes_sent -     saved_data[common_name][client_id].bytes_sent;
               } else {
                 delta_recieved = bytes_recieved;
                 delta_sent     = bytes_sent;
               }
               update( saved_stats, 'stats_m_rcv',  common_name, stats_minute, delta_recieved);
               update( saved_stats, 'stats_m_sent', common_name, stats_minute, delta_sent);
               update( saved_stats, 'stats_h_rcv',  common_name, stats_hour, delta_recieved);
               update( saved_stats, 'stats_h_sent', common_name, stats_hour, delta_sent);
               update( saved_stats, 'stats_d_rcv',  common_name, stats_day, delta_recieved);
               update( saved_stats, 'stats_d_sent', common_name, stats_day, delta_sent);
               update( saved_stats, 'stats_mon_rcv',  common_name, stats_day, delta_recieved);
               update( saved_stats, 'stats_mon_sent', common_name, stats_day, delta_sent);
                                                                 
               saved_data[common_name][client_id] = {
                 bytes_recieved,
                 bytes_sent,
                 connected_since,
                 raw : itm
               }

               if (saved_wasOnline.indexOf(common_name) === -1) {
                 if (opt && typeof opt.onNewUserOnline == 'function') opt.onNewUserOnline(common_name);
                 saved_wasOnline.push(common_name);
                 fs.writeFileSync('./data/wasOnline.json', JSON.stringify(saved_wasOnline, null, 4));
               }
      });
      connection.end()

      saved_data['online'] = onlineUsers.sort();
      saved_data['lastUpdate'] = new Date();
      fs.writeFileSync('./data/data.json', JSON.stringify(saved_data, null, 4));
      fs.writeFileSync('./data/stats.json', JSON.stringify(saved_stats, null, 4));

utils.log('  [stats] done.', Date.now()-stime, 'ms', 'updated:', updated, 'created:', created); 
    }
  })

  connection.on('timeout', () => {
    utils.log('socket timeout!')
    connection.end()
  })
  connection.on('close', () => {
//    utils.log('connection closed')
  })
  connection.on('error', err => {
    utils.log('Error', err)
  })
  connection.connect(params)
}


function update( o, index1, index2, index3, value) {
  if (!o[index1]) o[index1]={};
  if (!o[index1][index2]) o[index1][index2]={};
  if (!o[index1][index2][index3]) o[index1][index2][index3]=0;
  o[index1][index2][index3] = o[index1][index2][index3] + value;
}


function last_stats( o) {
  var users = [];
  var index1List = Object.keys(o);
  index1List.forEach( index1 => {
    var index2List = Object.keys(o[index1]);
    index2List.forEach( index2 => {
      if (users.indexOf(index2) === -1) users.push(index2);
    })
  })
  users.sort();

  const stats_minute = Math.trunc(Date.now() /1000 /60) * 1000 *60;
  const stats_hour = Date.now() - 1000 * 60 * 60;
  const stats_day = Date.now() - 1000 * 60 * 60 * 24;

  var ret = {};
  users.forEach(user => {
    if (!ret[user]) ret[user] = {}
    ret[user]['stats_m_rcv']  = o['stats_m_rcv'][user][stats_minute];
    ret[user]['stats_m_sent'] = o['stats_m_sent'][user][stats_minute];

    var rcv_minutes = Object.keys(o['stats_m_rcv'][user]);
    var sent_minutes = Object.keys(o['stats_m_sent'][user]);

    var rcv_hour = 0;
    var rcv_hour_qty = 0;
    var rcv_day = 0;
    var rcv_day_qty = 0;
    rcv_minutes.forEach( minute => {
      const parsed_minute = parseInt(minute);
      if (parsed_minute > stats_hour) {
        rcv_hour = rcv_hour + o['stats_m_rcv'][user][minute];
        rcv_hour_qty++;
      }
      if (parsed_minute > stats_day) {
        rcv_day = rcv_day + o['stats_m_rcv'][user][minute];
        rcv_day_qty++;
      }
    });
    ret[user]['stats_h_rcv'] = {tot: rcv_hour, qty:rcv_hour_qty}
    ret[user]['stats_d_rcv'] = {tot: rcv_day, qty:rcv_day_qty}

    var sent_hour = 0;
    var sent_hour_qty = 0;
    var sent_day = 0;
    var sent_day_qty = 0;
    sent_minutes.forEach( minute => {
      const parsed_minute = parseInt(minute);
      if (parsed_minute > stats_hour) {
        sent_hour = sent_hour + o['stats_m_sent'][user][minute];
        sent_hour_qty++;
      }
      if (parsed_minute > stats_day) {
        sent_day = sent_day + o['stats_m_sent'][user][minute];
        sent_day_qty++;
      }
    });
    ret[user]['stats_h_sent'] = {tot: sent_hour, qty:sent_hour_qty}
    ret[user]['stats_d_sent'] = {tot: sent_day, qty:sent_day_qty}
  })
  return ret;
}


/*
 * Суммирует статистику по saved_data и last_stats(saved_stats)
 *
 * @returns [
 *            {name: "2210-200", online: false, all_rcv: 0, all_sent: 0, m_rcv: 0, m_sent: 0, h_rcv: {tot: 0, qty: 0}, h_sent: {tot: 0, qty: 0}},
 *             ...
 *            {name: "lastUpdate", lastUpdate: "2022-05-29T21:53:00.004Z"}
 *          ]
 */
function total_stats(data, stats) {
  var ret = [];

  var users = Object.keys(data).filter( itm => ['online', 'lastUpdate'].indexOf(itm) === -1);
  // сортировка по алфавиту, но UNDEF всегда последний
  users.sort((a, b) => {
    if (a == 'UNDEF') return 1;
    if (b == 'UNDEF') return -1;

    if (a > b) return 1;
    if (a < b) return -1;
    return 0;
  });
   
  var ret = users.map( user => {
    const uData = data[user];
    var all_rcv = 0;
    var all_sent = 0;
    Object.keys(uData).forEach( d => {
      all_rcv = all_rcv + parseInt(data[user][d].bytes_recieved);
      all_sent = all_sent + parseInt(data[user][d].bytes_sent);
    })
    return {
      name : user, 
      online : (data['online'].indexOf(user)!==-1),
      all_rcv,
      all_sent,
      m_rcv  : stats[user]['stats_m_rcv']  || 0,
      m_sent : stats[user]['stats_m_sent'] || 0,
      h_rcv  : {tot:stats[user]['stats_h_rcv'].tot || 0,
                qty:stats[user]['stats_h_rcv'].qty || 0},
      h_sent : {tot:stats[user]['stats_h_sent'].tot || 0,
                qty:stats[user]['stats_h_sent'].qty || 0},
      d_rcv  : {tot:stats[user]['stats_d_rcv'].tot || 0,
                qty:stats[user]['stats_d_rcv'].qty || 0},
      d_sent : {tot:stats[user]['stats_d_sent'].tot || 0,
                qty:stats[user]['stats_d_sent'].qty || 0},
    }
  })
  ret.push({name:'lastUpdate', lastUpdate:data.lastUpdate})
  return ret;
}


module.exports = {get_stats, stats, stats2, total_stats}
