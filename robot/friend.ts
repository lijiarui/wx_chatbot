// 好友请求处理
import * as TaskManager from "./utils/task"
import {putInRoom} from "./room"
import Msg from "./config/msg"
import logger from './utils/logger'
import * as ServerJiang from './utils/server-jiang'
import * as DbOperation from './utils/db-operation'

let friendNum = 0
export async function friendEventHandler(contact, request) {
    try {
        if (request) {
            friendNum = friendNum + 1
            let name = contact.name()
            let friendlog = "#" + friendNum + "addfriend(" + name + ")"
            TaskManager.addTaskFunc(async _ => {
                let requestResult = await request.accept()

                if (requestResult) {
                    logger.info(`#FREIND_INFO_SUCCESS#${friendNum} 好友请求成功通过,好友昵称${contact.name()}`)
                } else {
                    logger.info(`#FREIND_INFO_FAIL#${friendNum} 好友请求未通过,好友昵称${contact.name()}`)
                    ServerJiang.tellMe(`#FREIND_INFO_FAIL#${friendNum} 好友请求未通过,好友昵称${contact.name()}`)
                    TaskManager.FlagInfo[TaskManager.TaskName.FRIEND.type] = false
                }
            }, TaskManager.TaskName.FRIEND)
            return
        } else {
            if (DbOperation.isKeyword((contact as any).rawObj.Content).roomKey.length > 0) {
                await putInRoom(DbOperation.isKeyword((contact as any).rawObj.Content).roomKey[0], contact)
            } else {
                await contact.say(Msg.FREIND_INFO)
            }
        }
    } catch (e) {
        logger.error('error',e.message)
    }
}

