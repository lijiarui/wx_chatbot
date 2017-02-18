# 微信机器人

## 项目起步

### 依赖安装

    - 安装项目依赖
    ```npm install```
    - 安装ts-node
    ```npm install -g ts-node```

### 运行

    ```ts-node robot/index.ts```

    ```
    function wechaty() {
    docker run \
        -t -i --rm \
        -e WECHATY_LOG="$WECHATY_LOG" \
        --volume="$(pwd)":/bot \
        --name=juxiaomi \
        zixia/wechaty:latest \
        "$@"
    }

    wechaty robot/index.ts
    ```

未完待续...
