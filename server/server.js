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

app.get('/', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../', 'front-end', 'index.html'))
})

rules = [  
          { value: 'Govt' },
]

async function getStreamRules() {
    const response = await needle('get', rulesURL, {
        headers: {
            Authorization: `Bearer ${TOKEN}`
        }
    })

    console.log(response.body)
    return response.body
}

async function setStreamRules() {
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

app.post('/searchTweets', (req, res) => {
    console.log(req.body);
})

socketio.on('connection', async () => {
    console.log('Client connected...')

    let currentRules;

    try {
        currentRules = await getStreamRules()
        await deleteStreamRules(currentRules)
        await setStreamRules()
    } catch(err) {
        console.error(err);
        process.exit(1)
    }

    const filteredStream = streamTweets(socketio)

    let timeout = 0;
    filteredStream.on('timeout', () => {
        console.warn('A connection error occured. Reconnecting...')
        setTimeout(() => {
            timeout++
            streamTweets(io)
        }, 2 ** timeout)
        streamTweets(io)
    })
});

server.listen(PORT, () => console.log(`Listening on port ${PORT}...`))