import Config from '../config/config'
import logger from './logger'
import * as ServerJiang from './server-jiang';

export type TaskType = {
   type:        string
   interval:    number 
}

export const TaskName = {
    FRIEND: {
        type: 'FRIEND',
        interval: 60
    },
    ROOM_ADD: {
        type:'ROOM_ADD',
        interval: 20
    },
    TALK: {
        type:'TALK',
        interval: 3
    },
    REMARK: {
        type:'REMARK',
        interval:40
    }
}

// 任务状态
export let FlagInfo = {}
FlagInfo[TaskName.FRIEND.type] = true
FlagInfo[TaskName.REMARK.type] = true
FlagInfo[TaskName.ROOM_ADD.type] = true
FlagInfo[TaskName.TALK.type] = true

// 任务管理
export let taskFuncList: Function[] = []
let taskSerialNumber = 0

// 不同的task任务
export let taskFriendList: Function[] = []
export let taskRoomAddList: Function[] = []
export let taskTalkList: Function[] = []
export let taskRemarkList: Function[] = []
let taskFriendNum=1, taskRoomAddNum=1, taskTalkNum=1, taskRemarkNum=1

export function addTaskFunc(taskFunc: Function, taskName: TaskType, taskLog='') {
    taskFunc["taskName"] = taskName.type;
    taskFunc["taskInterval"] = taskName.interval
    taskFunc["taskLog"] = taskLog
    // taskFriendList
    if (taskName.type === TaskName.FRIEND.type) {
        taskFriendList.push(taskFunc)
        taskFunc["taskSerialNum"] = taskFriendNum++
        return
    }

    if (taskName.type === TaskName.ROOM_ADD.type){
        taskRoomAddList.push(taskFunc)
        taskFunc["taskSerialNum"] = taskRoomAddNum++
        return
    }

    if (taskName.type === TaskName.TALK.type) {
        taskTalkList.push(taskFunc)
        taskFunc["taskSerialNum"] = taskTalkNum++
        return
    }

    if (taskName.type === TaskName.REMARK.type) {
        taskRemarkList.push(taskFunc)
        taskFunc["taskSerialNum"] = taskRemarkNum++
        return
    }

    taskFuncList.push(taskFunc);
}

// TODO: switch to rabbitMq
export function processTaskList(taskList:Function[]) {
    let interval = 5; // default interval
    if (taskList.length > 0) {
        const taskFunc = taskList.shift();
        if (taskFunc) {
            // task succeed flag= true
            if(FlagInfo[taskFunc["taskName"]]){
                logger.info("processTaskList: #" + taskFunc["taskName"] + " #" + taskFunc["taskSerialNum"] + " #SUCCEED" + " #interval: " + taskFunc["taskInterval"] + "#taskLog: " + taskFunc["taskLog"])
                interval = taskFunc["taskInterval"]
                taskFunc();
            } else{
                 // task failed flag= false
                logger.info("processTaskList: #" + taskFunc["taskName"] + " #" + taskFunc["taskSerialNum"] + " #FAILED" + " #interval: " + taskFunc["taskInterval"] + "#taskLog: " + taskFunc["taskLog"])
                ServerJiang.tellMe("processTaskList: #" + taskFunc["taskName"] + " #" + taskFunc["taskSerialNum"] + " #FAILED" + " #interval: " + taskFunc["taskInterval"] + "#taskLog: " + taskFunc["taskLog"])
                interval = 120 * 60 // one hour redeal the operation 60*60
                taskList.unshift(taskFunc)
                FlagInfo[taskFunc["taskName"]] = true
            }
            if (taskList.length === 0) {
                logger.info(`${taskFunc['taskName']} Task Done`);
            }
        } else {
            logger.info("processTaskList: pop task empty?")
        } 
    } 
    setTimeout(_=>{processTaskList(taskList)}, interval * 1000);

}

export function taskMain(){
    processTaskList(taskFriendList)
    processTaskList(taskRoomAddList)
    processTaskList(taskTalkList)
    processTaskList(taskRemarkList)    
}
