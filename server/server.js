const http = require('http')
const path = require('path')
const express = require('express')
const socketIO = require('socket.io')
const needle = require('needle')
const bodyParser = require("body-parser")
const config = require('dotenv').config()

const PORT = process.env.PORT || 8000
const TOKEN = process.env.TWITTER_BEARER_TOKEN
const rulesURL = "https://api.twitter.com/2/tweets/search/stream/rules"
const streamURL = "https://api.twitter.com/2/tweets/search/stream?tweet.fields=public_metrics&expansions=author_id"

const app = express()
const server = http.createServer(app)
const socketio = socketIO(server)

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(__dirname + '/../front-end/'));

app.get('/', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../', 'front-end', 'index.html'))
})

async function getStreamRules() {
    const response = await needle('get', rulesURL, {
        headers: {
            Authorization: `Bearer ${TOKEN}`
        }
    })

    return response.body
}

async function setStreamRules(rules) {
    data = {
        add: rules
    }
    const response = await needle('post', rulesURL, data, {
        headers: {
            'content-type' : 'application/json',
            Authorization: `Bearer ${TOKEN}`
        }
    })

    return response.body
}

async function deleteStreamRules(rules) {
    if(!Array.isArray(rules.data)) {
        return null;
    }

    rule_ids = rules.data.map((rule) => rule.id)
    const data = {
        delete: {
                    ids: rule_ids
                },
    };

    const response = await needle('post', rulesURL, data, {
        headers: {
            'content-type' : 'application/json',
            Authorization: `Bearer ${TOKEN}`
        }
    })

    return response.body
}

function streamTweets(socket) {
    const stream = needle.get(streamURL, {
        headers: {
            Authorization: `Bearer ${TOKEN}`
        }
    })

    stream.on('data', (data) => {
        try {
            const tweet = JSON.parse(data)
            console.log(tweet)
            socket.emit('ListenTweet', tweet)
        } catch (err) {

        }
    })

    return stream
}

socketio.on('connection', async (socket) => {
    console.log('Client connected...')

    let currentRules;
    socket.on('getRules', async rules => {
        console.log("In server.js socket.on('getRules') function.")
        try {
            currentRules = await getStreamRules()
            await deleteStreamRules(currentRules)
            await setStreamRules(rules);
            console.log("Hello")
        } catch (err){
            console.error(err);
            process.exit(1);
        }
    
        const filteredStream = streamTweets(socket);
        let timeout = 0;
        filteredStream.on('timeout', () => {
            console.warn('A connection error occured. Reconnecting...')
            setTimeout(() => {
                timeout++
                streamTweets(socket)
            }, 2 ** timeout);
            streamTweets(socket);
        });
    });
    
    socket.on('reconnect', () => {
        console.log("Client Reconnected");
    });
});

server.listen(PORT, () => console.log(`Listening on port ${PORT}...`))