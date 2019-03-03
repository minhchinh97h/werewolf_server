const mongoose = require('mongoose')

var playerSchema = new mongoose.Schema({
    username: String,
    roomid: String,
    timeCreated: Number,
    status: {
        dead: Number,
        silence: Number
    },
    role: String,
    currentAction: Object

})

module.exports = playerSchema