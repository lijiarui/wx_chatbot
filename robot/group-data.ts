/*
  get all group settings
 */
const fs = require('fs');
const path = require("path");

// settings file path
const acjsonPath = path.join(__dirname, 'config', 'ac.json');
const groupjsonPath = path.join(__dirname, 'config', 'group.json');
const keyjsonPath = path.join(__dirname, 'config', 'key-word.json')
const multiGroupjsonPath = path.join(__dirname, 'config', 'multi-group.json')

export function getGroupJson() {
    return JSON.parse(fs.readFileSync(groupjsonPath, 'utf8'));
}

export function getContactJson() {
    return JSON.parse(fs.readFileSync(acjsonPath, 'utf8'));
}

export function getKeyWordJson() {
    return JSON.parse(fs.readFileSync(keyjsonPath, 'utf8'));
}

export function getMultiGroupJson() {
    return JSON.parse(fs.readFileSync(multiGroupjsonPath, 'utf8'));
}

export function setKeyWordJson(json){
    fs.writeFileSync(keyjsonPath,JSON.stringify(json, null, 2 ), "utf8")
}

export function setGroupJson(json){
    fs.writeFileSync(groupjsonPath,JSON.stringify(json, null, 2 ), "utf8")
}

export function setContactJson(json){
    fs.writeFileSync(acjsonPath,JSON.stringify(json, null, 2 ), "utf8")
}

export function isKeyword(content){
    let groupJson = getGroupJson();
    let keyword = ''
    //关键词
    let key = new RegExp(groupJson['KEYWORD'],"i")

    if(groupJson['KEYWORD'] && key.test(content)){
        keyword = 'replyKey'
        return keyword
    }
    //入群关键词
    for (let key in groupJson) {
        let regKey = new RegExp(groupJson[key].secret, "i")
        if (groupJson[key].secret && regKey.test(content)) {
            keyword = 'roomKey'
            return keyword
        }
    }
    return keyword
}
