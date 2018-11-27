const mongoose = require('mongoose')

var roomSchema = new mongoose.Schema({
    roomid: String,
    admin: String,
    timeCreated: Number,
    numberOfPlayers: Number,
    players: [String],
    status: {
        type: String,
        enum: ['open', 'full', 'ongoing']
    },
    currentRoles: [String]
})

module.exports = roomSchema