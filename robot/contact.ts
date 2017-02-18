import Config from './config/config'
import logger from './utils/logger'
import * as ServerJiang from './utils/server-jiang'
import { Contact, Room } from "wechaty"
import * as TaskManager from './utils/task'

export type ContactDoc = {
  id:     Number
  name:   String
  remark: String
  weixin: String
  admin:  String[]
  black:  String[]
}

export async function remarkInit(){
  let contactList = await Contact.findAll()

}