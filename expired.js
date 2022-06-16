const axios = require('axios');
const TimeAgo = require('javascript-time-ago');
TimeAgo.addDefaultLocale( require('javascript-time-ago/locale/en'));
const timeAgo = new TimeAgo('en-US');

const utils = require('./utils');

/**
 * Checks all users that start with specified profix (from /ovpn/get-prefix)
 * (assuming user names was created by <prefix><yyMMdd>-<random-number> template)
 * and if yyMMdd is less than the current date, then deletes the user
 * (and fires onDeleteUser)
 * 
 * @param port {Number}
 * @param opt {Object}
 *          onDeleteUser {Function}
 *            @param name {String}
 */
function check_expired(url, opt) {
  const stime = Date.now();
  utils.log('  checking expired...');

  const ret = Promise.resolve();

  axios.get(url+'/get-prefix')
  .then(prefix => {
    prefix = prefix.data.data;
    return axios.get(url+'/get')
           .then(r => {
             let ret = Promise.resolve();

             r.data.data
             .filter(name => name.startsWith(prefix))
             .forEach(name => {
               const name_date = name.split('-')[1];
               const y = '20'+name_date.substr(0,2),
                     m = name_date.substr(2,2) - 1,
                     d = name_date.substr(4,2);
               const date = new Date(y,m,d);

               let ta; 
               try{ 
                 ta = timeAgo.format(date)
                 //to process names that do not fit the <prefix><yyMMdd>-<random-number> template
                 //but consist of numbers - do not check them
                 if (+date.getFullYear() != +y || +date.getMonth() != +m || +date.getDate() != +d) ta = undefined;
               } catch(e) {
               }

               utils.log('    checking', name, 'result:', ta ? ta : 'unknown');
               if (ta) {
                 if (date.getTime() - Date.now() < 0) {
                   utils.log(`      [${name}] deleting...`);
                   ret = ret.then(() => {
                     return axios.post(url+'/remove', {name})
                                 .then(res   => utils.log( `      [${name}] deleted.`))
                                 .catch(error => utils.log(`      [${name}] error`, error))
                                 .then( () => {
                                   if (opt && typeof opt.onDeleteUser == 'function') opt.onDeleteUser(name);
                                 })
                   })
                 }
               }
             })
             return ret;
           });
  })
  .catch(error => {
    utils.log('  [expired] ERROR', error);
  })
  .then( () => {
    utils.log('  [expired] done.', Date.now()-stime, 'ms'); 
  })
}

module.exports = { check_expired }