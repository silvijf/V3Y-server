const express = require("express");
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const fs = require('fs').promises;
const { exec } = require("child_process");

app.use(express.static(__dirname));

async function readTurnOn() {
    try {
        const data = await fs.readFile("server-settings.json", "utf-8");
        return JSON.parse(data).canTurnOn;
    } catch (err) {
        return true;
    }
}

io.on("connection", (socket) => {
    exec('tmux ls', (err, stdout, stderr) => {
        if (stdout.includes("minecraft")) io.emit("serveron", true);
    })
    readTurnOn().then(canTurnOn => {
        if (!canTurnOn) io.emit("cantturnon");
    })
    socket.on("on", () => {
        readTurnOn().then(canTurnOn => {
            if (canTurnOn) {
                exec('tmux ls', (err, stdout, stderr) => {
                    if (!stdout.includes("minecraft")) {
                        exec('tmux new-session -d -s minecraft -c /home/jeppe2/minecraft "java -Xms4G -Xmx4G -XX:+UseG1GC -XX:+ParallelRefProcEnabled -XX:MaxGCPauseMillis=200 -XX:+UnlockExperimentalVMOptions -XX:+DisableExplicitGC -XX:+AlwaysPreTouch -XX:G1NewSizePercent=30 -XX:G1MaxNewSizePercent=40 -XX:G1HeapRegionSize=8M -XX:G1ReservePercent=20 -XX:G1HeapWastePercent=5 -XX:G1MixedGCCountTarget=4 -XX:InitiatingHeapOccupancyPercent=15 -XX:G1MixedGCLiveThresholdPercent=90 -XX:G1RSetUpdatingPauseTimePercent=5 -XX:SurvivorRatio=32 -XX:+PerfDisableSharedMem -XX:MaxTenuringThreshold=1 -jar paper.jar nogui"');
                    }
                })
                io.emit("serveron", true);
            } else io.emit("cantturnon");
        })
    })
})

http.listen(3000, "0.0.0.0", () => {
    console.log('Server is active on http://localhost:3000');
});
