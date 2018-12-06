const mongoose = require('mongoose')

var playerSchema = new mongoose.Schema({
    username: String,
    roomid: String,
    timeCreated: Number,
    status: {
        alive: Number,
        dead: Number,
        silence: Number,
        connected: String,
        hypnotized: Number,
        changed: Number
    },
    role: String

})

module.exports = playerSchema