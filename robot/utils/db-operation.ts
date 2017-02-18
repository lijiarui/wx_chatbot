import {Wechaty, Contact, Room} from 'wechaty'
import Config from '../config/config'
import logger from '../utils/logger'
import * as GroupData from '../group-data';

const dataStore = require('nedb')
export type keyWordData={
  roomKey: string[],
  replyKey: string[],
}

// 存储所有的关键词，从数据库中获取，每次数据库有更新，都会引发keyWordData的变化 关键词包括：1.入群关键词 2.配置关键词
export let keyWordList : keyWordData={
  roomKey:[],
  replyKey:[]
}

export let db = {
  message: new dataStore({filename: './db/message.db', autoload: true}),
  roomInfo: new dataStore({filename: './db/room-info.db', autoload: true}),
  contact: new dataStore({filename: './db/contact.db', autoload:true}),
  keyWord: new dataStore({filename: './db/key-word.db', autoload: true}),
  // multiGroupSend: new dataStore({filename: './db/multi-group-send.db', autoload: true})
}

export async function initKeyWord(){
  const roomInfo = await getRoomInfoAll()
  const keyInfo = await getKeyWordInfoAll()
  for(let i in roomInfo){
    (roomInfo[i].secret) && (keyWordList.roomKey.push(roomInfo[i].secret))
  }
  for(let i in keyInfo){
    (keyInfo[i].key) && (keyWordList.replyKey.push(keyInfo[i].key))
  }
}

export function getRoomInfoAll() {
  return new Promise<Object>((resolve, reject)=>{
     db.roomInfo.find({},function(err, docs){
      if (err) {
        reject(err)
      }
      resolve(docs)
    })
  })
}

// export function getMultiGroupSend() {
//   return new Promise<Object>((resolve)=>{
//      db.multiGroupSend.find({},function(err, docs){
//       resolve(docs)
//     })
//   })
// }

export function getKeyWordInfoAll() {
  return new Promise<Object>((resolve)=>{
     db.keyWord.find({},function(err, docs){
        resolve(docs)
     })
  })
}

// 通过群聊名称获取群聊信息
export function getRoomInfoByTopic(topic: String){
  return new Promise<Object>((resolve)=>{
    db.roomInfo.findOne({roomName: topic}, function(err, doc){
      resolve(doc)
    })
  })
}

// 通过关键词获取群聊信息
export function getRoomInfoBySecret(secret:string) {
  return new Promise<Object>((resolve)=>{
    let reg = new RegExp(secret)
    db.roomInfo.findOne({secret: {$regex:reg}}, function(err, doc){
      resolve(doc)
    })
  })
}

// 通过关键词获取群聊信息
export function getkeyWordInfo(keyword:string) {
  return new Promise<Object>((resolve)=>{
    let reg = new RegExp(keyword)
    db.keyWord.findOne({key: {$regex:reg}}, function(err, doc){
      resolve(doc)
    })
  })
}

// 更新群配置信息, 群名称不可重复
export async function insertRoomInfo(){
  let groupJson = GroupData.getGroupJson()
  for(let key in groupJson){
    let doc = groupJson[key]
    doc['roomName'] = key
    // TODO 群聊触发关键词不能重复
    db.roomInfo.find({roomName: key}, async function(err, docFind){
      if(docFind && docFind.length > 0){
        throw new Error(`Woops...Room Topic: ${key} Exist`)
      } else{
        await db.roomInfo.insert(doc)        
        db.roomInfo.loadDatabase()
        (doc.secret) && (keyWordList.roomKey.push(doc.secret))
      }
    }) 
  }
}

// 更新关键词配置信息, 关键词不可重复或包含，使用模糊匹配的方式
export async function insertKeyWordInfo(){
  let keyJson = GroupData.getKeyWordJson()
  for(let key in keyJson){
    let doc = keyJson[key]
    let reg = new RegExp(doc.key)
    db.keyWord.find({key: {$regex:reg}}, async function(err, docFind){
      if(docFind && docFind.length > 0){
        throw new Error (`Woops... Key Word ${reg} Exist`)
      } else {
        await db.keyWord.insert(doc)
        db.keyWord.loadDatabase()
        (doc.key) && (keyWordList.replyKey.push(doc.key))
      }
    })
  }
}

export function isKeyword(content){
    let realKey : keyWordData = {
      roomKey:[],
      replyKey:[]
    }
    // 关键词
    for(let key in keyWordList.replyKey){
      let reg = new RegExp(keyWordList.replyKey[key], "g")
      content.match(reg) && (realKey.replyKey = realKey.replyKey.concat(content.match(reg)))
    }
    // 入群
    for(let key in keyWordList.roomKey){
      let reg = new RegExp(keyWordList.roomKey[key], "g")
      content.match(reg) && (realKey.roomKey = realKey.roomKey.concat(content.match(reg)))
    }
    return realKey
}

export async function main(){
  await initKeyWord()
}

// export function insertMultiGroupSend() {
//   let groupJson = GroupData.getMultiGroupJson()
//   for(let key in groupJson){
//     let doc = groupJson[key]

//     db.multiGroupSend.find({roomName: key}, async function(err, docFind){
//       if(docFind && docFind.length > 0){
//         throw new Error(`Woops...Room Topic: ${key} Exist`)
//       } else{
//         await db.roomInfo.insert(doc)        
//         db.roomInfo.loadDatabase()
//         (doc.secret) && (keyWordList.roomKey.push(doc.secret))
//       }
//     }) 
//   }
// }