const express = require('express')
const ws = require('ws');
const HyperDeck = require("hyperdeck-js-lib");
const app = express()
const http = require('http')

const server = http.createServer(app);

const wss = new ws.Server({ server });

wss.on('connection', (ws) => {

    let HyperDeckClient

    ws.on('message', async (message) => {
        let data = JSON.parse(message)

        console.log(`Command received: ${data.command}`);

        if (data.command == 'connect') {
            HyperDeckClient = new HyperDeck.Hyperdeck(data.ipAddress);
            HyperDeckClient.onConnected().then(function() {

                HyperDeckClient.makeRequest("device info").then(function(response) {

                    data = {
                        type: 'connection',
                        status: response.code,
                        message: `Connected to Hyperdeck: ${response.params["unique id"]}`
                    }
                    ws.send(JSON.stringify(data))

                })

                HyperDeckClient.makeRequest("notify: display timecode: true").then(function(response) {
                    console.log(response);
                })
            
                HyperDeckClient.getNotifier().on("asynchronousEvent", function(response) {
                    if (response.code == 513) {
                        let send = {
                            type: 'displayTimecode',
                            timecode: response.params['display timecode']
                        }
                        ws.send(JSON.stringify(send))
                        return;
                    } else if (response.code == 502) {
                        let send = {
                            type: 'updateClips'
                        }
                        ws.send(JSON.stringify(send))
                        return;
                    }

                    console.log("Got an asynchronous event", response);
                });
            
                HyperDeckClient.getNotifier().on("connectionLost", function() {
                    console.error("Connection lost.");
                });
            }).catch(function() {
                console.error("Failed to connect to hyperdeck.");
            });
        } else if (data.command == 'getClips') {
            
            HyperDeckClient.clipsGet().then((res) => {
                let clips = []
                for (let i = 1; i <= res.params['clip count']; i++) {
                    let params = res.params[`${i}`]
                    params = params.split(' ')
                    let clipOutTime = params[params.length - 1]
                    let clipInTime = params[params.length - 2]
                    let clipName = res.params[`${i}`]
                    clipName = clipName.substring(0, clipName.length - 24)
                    clips.push({
                        id: i,
                        name: clipName.toUpperCase(),
                        outTime: clipOutTime,
                        inTime: clipInTime
                    })
                }
                clips.sort((a,b) => a.name.localeCompare(b.name))

                let send = {
                    type: 'clipList',
                    clips: clips
                }
                ws.send(JSON.stringify(send))
            })
        } else if (data.command == 'play') {
            
            HyperDeckClient.makeRequest(`play: single clip: true`).then((res) => {
                ws.send(JSON.stringify(res))
            })
        } else if (data.command == 'stop') {
            HyperDeckClient.stop().then((res) => {
                let send = {
                    type: 'stop'
                }
                ws.send(JSON.stringify(send))
            })
        } else if (data.command == 'loadClip') {

            console.log(data.clipId);
            
            HyperDeckClient.makeRequest(`goto: clip id: ${data.clipId}`).then((res) => {
                console.log(res);
            })
        } else if (data.command == 'goToStart') {
            
            HyperDeckClient.makeRequest(`goto: clip: start`).then((res) => {
                console.log(res);
            })
        }
    });
    
});

server.listen(process.env.PORT || 8999, () => {
    console.log(`Server started on port ${server.address().port}`);
});

app.use(express.static('public'))