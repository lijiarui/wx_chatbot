/** 
  * 消息提醒
  * https://git.kazejs.xyz/rockq/wechat-group-master/issues/14
 */
import {Message} from 'wechaty'
export const request = require('request')
const host = 'http://datacollection.arrking.com'
const postUrl = '/parse/classes/Message/'
const channel = 'wechaty'
const botName = '桔小秘'
const type = 'textMessage'

export class SaveMsg {
  private content
  private contact
  private type
  private group

  public constructor(public message: Message) {
    this.message = message
    this.content = message.content()
    this.contact = message.from()
    const room = message.room()
    if (room) {
      this.group = room.topic()
    } else {
      this.group = null
    }
  }

  public inbound() {

    const options = { 
      method: 'POST',
      url: host + postUrl,
      headers: { 
        'content-type': 'application/json',
        'x-parse-rest-api-key': 'AgOodsirtan5',
        'x-parse-application-id': 'datacollection' 
      },
      body: {
          "channel": channel,
          "agent": botName,
          "direction": "inbound", // 是机器人接收的消息, outbound是机器人发送的消息
          "type": type,
          "textMessage": this.content,
          "sender": this.contact.name(),
          "fromUserId": this.contact.alias(),
          "group": this.group,
          "recipient": "" // TODO
        },
      json: true 
    }

    request(options, function (error, response, body) {
      if (error) throw new Error(error)
    })
  }
}