/*
  消息提醒
 */
// TODO 迁到 使用 快站服务
import Config from "../config/config";

import logger from '../utils/logger';

const os = require('os')

export let info = {
    botName: 'null',
    hostName: os.hostname()+"lijiarui"
}

export function tellMe(content) {

    let request = require('request');
    let url = 'http://sc.ftqq.com/' + Config.SCKEY + '.send';

    let botName = info.botName
    let desp = "content: " + content + "<br>" + "\n\n"+ "    hostname: " + info.hostName
    let propertiesObject = {text: botName, desp: desp};

    request({url: url, qs: propertiesObject}, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            let testjson = JSON.parse(body);
            logger.info(`#SEVERCHAN_${JSON.stringify(testjson)}`)
        }
    });
}
