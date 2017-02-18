import { Contact, Room, Message } from "wechaty"
import * as GroupData from './group-data'
import * as TaskManager from './utils/task'
import Msg from './config/msg'
import Config from './config/config'
import logger from './utils/logger'
import * as ServerJiang from './utils/server-jiang'
import * as DbOperation from './utils/db-operation'

// ai robot client
const Tuling123 = require('tuling123-client')
const brain = new Tuling123(Config.TULING123_API_KEY)

let groupNum = 0
let dealNum = 0

let contactJson = GroupData.getContactJson()

export async function roomOperation(m: Message) {
    const botname = ServerJiang.info.botName
    const contact = m.from()
    const content = m.content()
    const type = m.type()
    const room = m.room()
    const id = contact.id

    if (m.self()) {
        return
    }

    //  if (beginMulti(contact, content) === true){
    //      return
    //  }

    //处理付费结果
    if (contact.name() === "简单支付") {
        if (type === 49) { feeToRoom(m) }
        return
    }

    if (type !== 1) { return null }

    //处理群内消息
    if (room) {
        //群内有人@我和我说话
        let regKey = new RegExp("@" + botname, "i")
        if (regKey.test(content)) {
            TaskManager.addTaskFunc(async function(){
                // TODO 优化如果查过数据库，notuling 就不要再放在任务队列了
                let roomFind = await DbOperation.getRoomInfoByTopic(room.topic())
                if(room.topic() && roomFind && roomFind["tuling"] == false){
                    return
                } else {
                    talk(m)
                }
            }, TaskManager.TaskName.TALK)
        }
    } else {
        // TODO 单独付费功能，暂时是写死的
        if (/天使汇/.test(content) || /^同意$/.test(content)){
            angelCrunch(m)
            return
        }

        if(DbOperation.isKeyword(content).roomKey.length > 0 || DbOperation.isKeyword(content).replyKey.length > 0){
            // 群关键词
            DbOperation.isKeyword(content).roomKey.forEach(keyword => {
                let roomLog = "RoomKeyWord: " + keyword + "contact: " + contact.name() 
                TaskManager.addTaskFunc(_=>{
                    putInRoom(keyword, contact)
                }, TaskManager.TaskName.ROOM_ADD, roomLog)
            })
            // 关键词回复
            DbOperation.isKeyword(content).replyKey.forEach(keyword => {
                let replyLog = "ReplyKeyWord: " + keyword + "contact: " + contact.name() 
                TaskManager.addTaskFunc(async function(){
                    let keyReply = await DbOperation.getkeyWordInfo(keyword)
                    keyReply && m.say(keyReply["content"].join())
                }, TaskManager.TaskName.TALK, replyLog)
            })
        } else {
            // TODO issue new reply
            if (/^我通过了你的朋友验证请求/.test(content) || /已通过你的朋友验证请求/.test(content)) {
                return
            }
            //tuling reply
            TaskManager.addTaskFunc(_=>{
                talk(m)
            }, TaskManager.TaskName.TALK)
        }
    }
    return null
}

export async function putInRoom(keyword: string, contact: Contact) {
    let roomInfo = await DbOperation.getRoomInfoBySecret(keyword)
    if(!roomInfo){
        throw new Error ('keyword not exist!')
    } else{
        // 免费入群
        if(roomInfo['charge']===false){
            logger.info(`#FREE_ROOM_INFO_${contact.name()}暗号匹配，希望进入拉入免费${roomInfo['roomName']}群中`)
            groupNum = groupNum + 1
            let roomlog = `#FREE_ROOM_INFO_#${groupNum}正在将${contact.name()}拉入群${roomInfo['roomName']}中`
            let keyroom = await Room.find({ topic: roomInfo['roomName'] })
            // 判断此人是否在群中：
            if (keyroom.has(contact)) {
                contact.say(roomInfo['hasContact'])
                keyroom.say(roomInfo['roomTip'], contact)
            } else {
                contact.say(roomInfo['rule'])
                let roomResult = await keyroom.add(contact)

                if (roomResult) {
                    logger.info( `#FREE_ROOM_INFO_SUCCESS_${contact.name()}成功拉入${roomInfo['roomName']}中`)
                } else {
                    logger.info( `#FREE_ROOM_INFO_FAIL_${contact.name()}拉入${roomInfo['roomName']}中失败`)
                    ServerJiang.tellMe(`#FREE_ROOM_INFO_FAIL_${contact.name()}拉入${roomInfo['roomName']}中失败`)
                    TaskManager.FlagInfo[TaskManager.TaskName.ROOM_ADD.type] = false
                }
            }
        } else{
            //付费入群 TODO
            logger.info(`#FEE_ROOM_INFO_${contact.name()}暗号匹配，希望进入付费群中`)
            groupNum = groupNum + 1

            TaskManager.addTaskFunc(async _ => {
                let keyroom = await Room.find({ topic: roomInfo['roomName'] })
                logger.info(`#FEE_ROOM_INFO_找到付费房间 ${keyroom.topic()}`)

                // 判断此人是否在群中：
                if (keyroom.has(contact)) {
                    contact.say(roomInfo['hasContact'])
                    keyroom.say(roomInfo['roomTip'], contact)
                } else {
                    //此人不在群中
                    const id = contact.id
                    if (id in contactJson) {
                        if (contactJson[id].status === true) {// 已经成功付款了，出现异常没有将用户拉入群中
                            logger.info(`#FEE_ROOM_INFO_${contact.name()}出现异常，此人已付款却没有成功入群`)
                            contact.say(Msg.NO_DUPLICATE)
                        } else { // 没有付款成功，id在json中
                            //发放付费链接
                            let tmplink = ''
                            tmplink = Config.PAY_LINK + id.replace(/@/gm, "")
                            contact.say(Msg.PAY_INFO)
                            contact.say(tmplink)
                        }
                    } else {
                        const tmp = (contact as any).obj.name
                        let contactNameStripHtml = tmp.replace(/<(?:.|\n)*?>/gm, "")
                        contactJson[String(id)] = { name: contactNameStripHtml, status: false }
                        GroupData.setContactJson(contactJson)
                        //发放付费链接
                        let tmplink = ''
                        tmplink = Config.PAY_LINK + id.replace(/@/gm, "")
                        contact.say(Msg.PAY_INFO)
                        contact.say(tmplink)
                    }
                }
            }, TaskManager.TaskName.ROOM_ADD)
        }
        
    }
}

export async function roomTopicNoChange(room, topic, oldTopic, changer, userId) {
    try {
        await room.ready()
        if (userId !== changer.id) {
            let roomInfo = await DbOperation.getRoomInfoByTopic(oldTopic)
            room.say(roomInfo['noChangeTopic'])
            room.topic(oldTopic)
        }
    } catch (e) {
        logger.info('error',e.message)
        console.log(e.message)
    }
}

export async function roomJoin(room, inviteeList, inviter) {
    try {
        await room.ready()
        let topic = room.topic()
        let Welcome = Msg.ROOM_WELCOME
        if (topic) {
            let roomInfo = await DbOperation.getRoomInfoByTopic(topic)
            roomInfo && (roomInfo['roomWelcomeOn']) && (roomInfo['roomWelcomeOn']===true) && roomInfo['roomWelcome'] && (Welcome = roomInfo['roomWelcome'])
            for (let i = 0; i < inviteeList.length; i++) {
                await inviteeList[i].ready()
                logger.info(`#ROOM_JOIN_INFO_${inviter.name()}将${inviteeList[0]}加入群聊${topic}`)
                room.say(Welcome, inviteeList[i])
            }   
        } 

    } catch (e) {
        logger.info('error',e.message)
        console.log(e.message)
    }
}


async function feeToRoom(m) {

    const contact = m.from()

    let contentBack = "@" + (m as any).obj.url.replace(/http:\/\/www.jjdd8.com\/groupuser\//gm, "")
    logger.info( `#FEE_ROOM_INFO_收到简单支付回复消息 ${ (m as any).obj.url.replace(/http:\/\/www.jjdd8.com\/groupuser\//gm, "")}`)

    if(!contactJson){
        contactJson = GroupData.getContactJson()
    }

    // 根据返回值判断是否拉人入群
    if (contentBack in contactJson) {

        logger.info( `#FEE_ROOM_INFO_第${dealNum}个简单支付订单,${contactJson[contentBack].name}付费成功，收到简单支付回复`)
        dealNum = dealNum + 1
        contactJson[contentBack].status = true

        await GroupData.setContactJson(contactJson)

        let taskOk = { "userid": contentBack, "ret": "success" }

        TaskManager.addTaskFunc(async _ => {
            contact.say(JSON.stringify(taskOk))
        }, TaskManager.TaskName.TALK)

        // 找到付费成功的contact
        // todo 正则有待完善
        const roomContactName = contactJson[contentBack].name.replace(/^/g, "\^")

        const regContact = new RegExp(roomContactName, "i")

        //todo 以后要换成remark处理
        let roomContact = await Contact.find({ name: regContact })// 用户昵称出现问题怎么办

        if (roomContact) {
            // await roomContact.ready()
            roomContact.say(Msg.DEAL_SUCCESS_INFO)
            logger.info(`#FEE_ROOM_INFO_提示付费用户${contactJson[contentBack].name},支付成功，正在进入群聊`)
            // 准备拉群
            logger.info(`付费群名称：${Config.FEE_ROOM_NAME} `)
            let keyroom = await Room.find({ topic: Config.FEE_ROOM_NAME })
            
            if (keyroom) {
                await keyroom.ready()
                TaskManager.addTaskFunc(async _ => {
                    logger.info(`#FEE_ROOM_INFO_找到目标群：${keyroom.topic()}`)
                    let roomResult = await keyroom.add(roomContact)

                    if (roomResult) {
                        logger.info(`#FEE_ROOM_INFO_SUCCESS_#${groupNum}个入群人员，将付费用户${contactJson[contentBack].name}拉入群聊`)
                        contactJson["successgrouplist"].push(contactJson[contentBack].name)

                    } else {
                        logger.info( `#FEE_ROOM_INFO_FAIL没能将付费用户${contactJson[contentBack].name}拉入群聊`)
                        ServerJiang.tellMe(`#FEE_ROOM_INFO_FAIL没能将付费用户${contactJson[contentBack].name}拉入群聊`)
                        contactJson["failgrouplist"].push(contactJson[contentBack].name)
                        TaskManager.FlagInfo[TaskManager.TaskName.ROOM_ADD.type] = false
                    }

                    groupNum = groupNum + 1
                    // 记录入群人员到ac.json

                    await GroupData.setContactJson(contactJson)
                }, TaskManager.TaskName.ROOM_ADD)

            }
        }

    } else {
        logger.error( `#FEE_ROOM_INFO_ERROR_收到简单支付回复消息 ${m} 但是此人不在数组中，出错！`)
        return null
    }
    return null
}

async function talk(m) {
    const contact = await m.from()
    const room = await m.room()
    const botname = ServerJiang.info.botName
    let content = m.content()
    let TalkName = contact.id

    if (room) {
        TalkName = TalkName + room.id
        let metionname = "@" + botname
        content = content.replace(metionname, "")
    }

    const reply = await brain.ask(content, {userid: TalkName})
    console.log(reply)
    if(room){
        room.say(reply.text, contact)
        logger.info( `【群内回复】：机器人说--${reply.text}--回复了群【${room.topic()}】中【${contact.name()}】的内容---${content}`)    
    } else{
        m.say(reply.text)
        logger.info( `【个人回复】：机器人说--${reply.text}--回复了【${contact.name()}】的内容---${content}`)
    }
    
}

// function beginMulti(contact:Contact, content){
//     let multiJson = GroupData.getMultiGroupJson()
//     let contactList = multiJson.contact
//     if(contactList.indexOf(contact.name())!=-1 && content.match(multiJson.secretBegin)){
//         console.log(content.match(multiJson.secretBegin))
//         multiGroupSend(content.match(multiJson.secretBegin)[1])
//         contact.say("已转发到如下群中："+ multiJson.group.join(","))
//         return true
//     } else {
//         return false
//     }
// }
// var multiJson =   {
//     "contact": ["李佳芮","程棣"],
//     "group": ["多群联播演示1", "多群联播演示2", "多群联播演示3"],
//     "secretBegin": 开始群发(.+)/
// }
// async function multiGroupSend(content){
//     // let multiJson = GroupData.getMultiGroupJson()
//     let roomList = multiJson.group
//     console.log(roomList)
//     roomList.forEach(async function(element){
//         let room = await Room.find({topic:element})
//         room.say(content)
//     })
// }

//angelcrunch:
    async function angelCrunch(m){
        let contact = m .from()
        let content = m.content()
        let id = m.from().id
        let botname = ServerJiang.info.botName
        // 根据关键词返回参数
        if (/天使汇/.test(content)) {
            logger.info(`#ANGELCRUNCH_${contact.name()} 回复了天使汇`)
            // 检测这个人是否在群中
            let anRoom = await Room.find({ topic: Config.FEE_ROOM_NAME })
            if (anRoom) {
                logger.info(`#ANGELCRUNCH_查看${contact.name()}是否在群中${anRoom.topic()}`)
                // await anRoom.ready()

                if (anRoom.has(contact)) {
                    logger.info(`#ANGELCRUNCH_Yeay~${contact.name()}在群中${anRoom.topic()}`)
                    contact.say("检测到你已经在群里啦！")
                    anRoom.say("找不到这个群了，我来这里冒个泡，帮他下", contact)
                }else {
                    logger.info(`#ANGELCRUNCH_Noop。。${contact.name()}不在群中${anRoom.topic()}`)
                    // 这个人多次说话
                    if (id in contactJson) {
                        if (contactJson[id].status === true) {// 已经成功付款了，出现异常没有将用户拉入群中
                            logger.info(`#FEE_ROOM_INFO_${contact.name()}出现异常，此人已付款却没有成功入群`)
                            contact.say(Msg.NO_DUPLICATE)
                        }else {
                            m.say(Msg.PAY_INFO_AGREE)
                        }
                    }else {// 这个人第一次说话，存数据如ac.json
                        const tmp = (contact as any).obj.name
                        let contactNameStripHtml = tmp.replace(/<(?:.|\n)*?>/gm, "")
                        contactJson[String(id)] = {name: contactNameStripHtml, status: false}
                        console.log(contactJson)
                        GroupData.setContactJson(contactJson)
                        m.say(Msg.PAY_INFO_AGREE)
                    }
                }
            }
            return 
        }

      if (/同意/.test(content)) {
          let tmplink = ""
          tmplink = Config.PAY_LINK + id.replace(/@/gm, "")
          console.log(id)
          // 已经回复过天使汇了
          if (id in contactJson) {
            if (contactJson[id].status === true) {// 已经成功付款了，出现异常没有将用户拉入群中
              m.say(Msg.NO_DUPLICATE)
            }else {
                contact.say(Msg.PAY_INFO)
                contact.say(tmplink)
            }
          }else {// 没有回复过天使汇
            talk(m)
          }
          return
      }
    //end angelcrunch
    }