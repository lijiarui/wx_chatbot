// 任务管理
export let taskFuncList: Function[] = [];
let taskSerialNumber = 0;
export let taskFuncListAi: Function[] = [];
let taskSerialNumberAi = 0;

// 不同的task任务
export let taskFriendList: Function[] = [];
export let taskRoomAddList: Function[] = [];
export let taskTalkList: Function[] = [];
export let taskRemarkList: Functon[] = [];

export function addTaskFunc(taskFunc: Function, taskName = "unnamed", interval = 3) {
    taskSerialNumber++;
    taskFunc["taskName"] = "#" + taskSerialNumber + " " + taskName;
    taskFunc["interval"] = interval;
    taskFuncList.push(taskFunc);
}

// export function addTaskFuncAi(taskFuncAi: Function, taskName = "unnamed", interval = 4) {
//     taskSerialNumberAi++;
//     taskFuncAi["taskName"] = "#ai" + taskSerialNumberAi + " " + taskName;
//     taskFuncAi["interval"] = interval;
//     taskFuncListAi.push(taskFuncAi);
// }

// TODO: switch to rabbitMq
export function processTask(taskList:Functon[]) {
    let interval = 5;
    if (taskList.length > 0) {
        const taskFunc = taskList.shift();
        if (taskFunc) {
            console.log("processTaskList: " + taskFunc["taskName"]);
            interval = taskFunc["interval"];
            taskFunc();
        } else {
            console.error("processTaskList: pop task empty?")
        }
        if (taskList.length === 1) {
            console.log(`基本任务已经处理完`);
        }
    } 
    setTimeout(processTask, interval * 1000);   
}

export function main(){
    
}

export function processTaskList() {
    let interval = 5;
    if (taskFuncList.length > 0) {
        const taskFunc = taskFuncList.shift();
        if (taskFunc) {
            console.log("processTaskList: " + taskFunc["taskName"]);
            interval = taskFunc["interval"];
            taskFunc();
        } else {
            console.error("processTaskList: pop task empty?")
        }
        if (taskFuncList.length === 1) {
            console.log(`基本任务已经处理完`);
        }
    } 
    setTimeout(processTaskList, interval * 1000);
}


else if (taskFuncListAi.length > 0) {
        const taskFuncAi = taskFuncListAi.shift();

        if (taskFuncAi) {
            console.log("processTaskList: " + taskFuncAi["taskName"]);
            interval = taskFuncAi["interval"];
            taskFuncAi();
        } else {
            console.error("processTaskList: pop task empty?");
        }
        if (taskFuncListAi.length === 0) {
            console.log(`所有任务已经处理完，开始休息了`);
        }
    }
