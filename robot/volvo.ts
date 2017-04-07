import * as ServerJiang from './utils/server-jiang'

import {Wechaty, Message, Contact, MsgType} from "wechaty"

const qrcodeTerminal = require("qrcode-terminal")
const bot = Wechaty.instance({profile: "volvo"})
const request = require('request')

bot
    .on("scan", (url, code) => {
        let loginUrl = url.replace("qrcode", "l")
        qrcodeTerminal.generate(loginUrl)
        ServerJiang.tellMe('![logo]('+url+')')
        console.log(`${url} \n ${code}`)
    })

    .on('login', (user) => {
        ServerJiang.info.botName = user.name()
        console.log(`${user.name()} login!`)
        ServerJiang.tellMe(`login`)
    })

    .on('logout', (user) => {
        console.log(`${user.name()} logout!`)
        ServerJiang.tellMe(`logout`)
    })

    .on('message', async function(m: Message){
        if (m.type() === MsgType.TEXT) {
          saveMsg(m)
        }
    })

    .on('error', e => {
        console.log(e.message)
        ServerJiang.tellMe(e.message)
    })
    .init()

async function saveMsg(m: Message) {

  const host = 'http://datacollection.arrking.com'
  const postUrl = '/parse/classes/Message/'
  const channel = 'wechaty'
  const botName = 'volvo'
  const type = 'textMessage'
  const contact = m.from()
  const room = m.room()
  let group
  if (room) {
     group = room.topic()
  } else {
     group = null
  }

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
        "textMessage": m.content(),
        "sender": contact.name(),
        "fromUserId": contact.alias(),
        "group": group,
        "recipient": "" // TODO
      },
    json: true 
  }

  request(options, function (error, response, body) {
    if (error) throw new Error(error)
  })

}
