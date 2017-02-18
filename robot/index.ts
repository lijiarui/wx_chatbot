// import Config from "./config/config"

import * as ServerJiang from './utils/server-jiang'

import {Wechaty, Message} from "wechaty"
import * as Friend from './friend'
import * as RoomHandle from "./room"
import * as TaskManager from "./utils/task"
import logger from './utils/logger'
import * as DbOperation from './utils/db-operation'

const qrcodeTerminal = require("qrcode-terminal")
const bot = Wechaty.instance({profile: "juxiaomi"})

bot
    .on("scan", (url, code) => {
        let loginUrl = url.replace("qrcode", "l")
        qrcodeTerminal.generate(loginUrl)
        ServerJiang.tellMe(`![logo]('+url+')`)
        console.log(`${url} \n ${code}`)
    })

    .on('login', (user) => {
        ServerJiang.info.botName = user.name()
        console.log(`${user.name()} login!`)
        logger.info('info', `${user.name()} login!`)
        ServerJiang.tellMe(`login`)
    })

    .on('logout', (user) => {
        console.log(`${user.name()} logout!`)
        logger.info('info', `${user.name()} logout!`)
        ServerJiang.tellMe(`logout`)
    })

    .on('friend', async function(contact, request) {
        await Friend.friendEventHandler(contact, request)
    })

    .on('room-topic', async function(room, topic, oldTopic, changer) {
        let userId = bot.user().id
        RoomHandle.roomTopicNoChange(room, topic, oldTopic, changer, userId)
    })

    .on('room-join', async function(this, room, inviteeList, inviter){
        RoomHandle.roomJoin(room, inviteeList, inviter)
    })

    .on('message', async function(m: Message){
        RoomHandle.roomOperation(m)
    })

    .on('error', e => {
        console.log(e.message)
        ServerJiang.tellMe(e.message)
        logger.error('error', e.message)
    })
    .init()

DbOperation.main()
TaskManager.taskMain()
