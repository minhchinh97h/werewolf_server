const mongoose = require('mongoose')

var roomSchema = new mongoose.Schema({
    roomid: String,
    admin: String,
    timeCreated: Number,
    numberOfPlayers: Number,
    players: [String],
    totalPlayers: [String],
    currentPlayers: [String],
    status: {
        type: String,
        enum: ['open', 'full', 'ongoing']
    },
    currentRoles: {
        'Werewolves': Number,
        'Ordinary Townsfolk': Number,
        'Seer/ Fortune Teller': Number,
        // 'Hunter': Number,
        'Cupid': Number,
        'Witch': Number,
        // 'Little Girl': Number,
        // 'Sheriff': Number,
        // 'Thief': Number,
        // 'The village Idiot': Number,
        // 'The ancient': Number,
        // 'The scapegoat': Number,
        'The savior': Number,
        'The pied piper': Number,
        // 'The villager villager': Number,
        // 'The two sisters': Number,
        // 'The three brothers': Number,
        // 'The knight with the rusty sword': Number,
        'The fox': Number,
        'The bear leader': Number,
        // 'The devoted servant': Number,
        // 'The wild child': Number,
        // 'The dog wolf': Number
    },
    // recommendedRoles: {
    //     'Werewolves': Number,
    //     'Ordinary Townsfolk': Number,
    //     'Seer/ Fortune Teller': Number,
    //     'Hunter': Number,
    //     'Cupid': Number,
    //     'Witch': Number,
    //     'Little Girl': Number,
    //     'Sheriff': Number,
    //     'Thief': Number,
    //     'The village Idiot': Number,
    //     'The ancient': Number,
    //     'The scapegoat': Number,
    //     'The savior': Number,
    //     'The pied piper': Number,
    //     'The villager villager': Number,
    //     'The two sisters': Number,
    //     'The three brothers': Number,
    //     'The knight with the rusty sword': Number,
    //     'The fox': Number,
    //     'The bear leader': Number,
    //     'The devoted servant': Number,
    //     'The wild child': Number,
    //     'The dog wolf': Number,
    //     'totalCards': Number
    // },
    HumanSide: {
        player: [String]
    },
    WerewolvesSide: {
        player: [String]
    },
    LoverSide: {
        player: [String]
    },
    callingOrder: [Object],
    unusedRoles: [Object],
    playerCurrentStatus: [Object]
})

module.exports = roomSchema