/*
  logger util

  logger level:
     { error: 0, warn: 1, info: 2, verbose: 3, debug: 4, silly: 5 }

  logger.debug  调试使用
  logger.info   记录信息
  logger.error  异常信息
 */

import settings from '../settings';
const path = require('path');

let winston = require('winston');

winston.level = settings.LOG_LEVEL;
winston.exitOnError = false;

function getUtc(date){
  let now_utc = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return now_utc;
}

winston.configure({
    transports: [
        new (winston.transports.File)({ name: 'error-file',
                                        filename: path.resolve(__dirname, '../../var/error.log'),
                                        level: 'error' ,
                                        timestamp: function() {return getUtc(new Date())} }),
        new (winston.transports.File)({ name: 'info-file',
                                        filename: path.resolve(__dirname, '../../var/info.log'),
                                        level: 'info' ,
                                        timestamp: function() {return getUtc(new Date())} }),
        new (winston.transports.Console)({ level: 'verbose' })
    ]
})

export default winston;
