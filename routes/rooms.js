var express = require('express');
var router = express.Router();
const mongoose = require('mongoose')

var axios = require('axios')
var mongoUrl = 'mongodb://werewolf_minhchinh_01:Haigay1997@ds057000.mlab.com:57000/werewolf_01'

var playerSchema = require('../mongoose-schema/playerSchema')
var roomSchema = require('../mongoose-schema/roomSchema')

var Player = mongoose.model('Player', playerSchema)
var Room = mongoose.model('Room', roomSchema)

var serverUrl = require('../serverUrl')

//get admin of the room
router.get('/:roomid/get-admin', (req, res, next) => {

    mongoose.connect(mongoUrl, { useNewUrlParser: true })

    var db = mongoose.connection

    db.on('error', console.error.bind(console, 'connection error: '))

    db.once('open', () => {
        //send back the admin of the current room id
        Room.findOne({roomid: req.params.roomid}, {'numberOfPlayers': 1, 'admin': 1, '_id': 0}, (err, result) => {
            if(err) console.log(err)

            if(result !== null)
                res.send(result)
            else
                res.send('not ok')

        })
    })
})


router.post('/:roomid/get-room-check-username', (req, res, next) => {
    mongoose.connect(mongoUrl, { useNewUrlParser: true })

    var db = mongoose.connection

    db.on('error', console.error.bind(console, 'connection error: '))

    db.once('open', () => {
        Room.findOne({'roomid': req.params.roomid}, {'players': 1, '_id': 0}, (err, result) => {
            if(err) return console.log(err)

            if(result !== null){
                let players = result.players

                if(players instanceof Array && players.includes(req.body.username)){
                    res.send('username exists')
                }

                else{
                    //Create new player document in players collection and update in Rooms collection
                    let player = new Player({
                        username: req.body.username,
                        roomid: req.body.roomid,
                        timeCreated: Date.now(),
                        status: {
                            alive: 1,
                            dead: 0,
                            silence: 0,
                            connected: "",
                            hypnotized: 0,
                            changed: 0
                        },
                        killedByWerewolves: 'false',
                        role: ''
                    })

                    player.save((err, result) => {
                        if(err) return console.log(err)

                        if(result !== null){
                            Room.findOneAndUpdate({'roomid': req.params.roomid}, {$push: {'players': req.body.username, 'totalPlayers': req.body.username}}, (err, result) => {
                                if(err) return console.log(err)

                                if(result !== null){
                                    res.send('ok')
                                }
                            })
                        }

                    })
                }
            }
            
            else{
                res.send('roomid doesnt exist')
            }
        })
    })
})

router.post('/:roomid/create-player-and-room', (req, res, next) => {
    mongoose.connect(mongoUrl, { useNewUrlParser: true })

    var db = mongoose.connection

    db.on('error', console.error.bind(console, 'connection error: '))

    db.once('open', () => {
        let player = new Player({
            username: req.body.username,
            roomid: req.body.roomid,
            timeCreated: Date.now(),
            status: {
                alive: 1,
                dead: 0,
                silence: 0,
                connected: "",
                hypnotized: 0,
                changed: 0
            },
            killedByWerewolves: 'false',
            role: ''
        })

        player.save((err, result) => {
            if(err) return console.log(err)

            if(result !== null){
                //update or create a row if it doesnt exist
                Room.updateOne({admin: req.body.username}, { $set: {
                                                            'roomid': req.body.roomid, 
                                                            'admin': req.body.username, 
                                                            'timeCreated': Date.now(),
                                                            'numberOfPlayers': 1,
                                                            'players': [req.body.username],
                                                            'totalPlayers': [req.body.username],
                                                            'status': 'open',
                                                            'currentRoles': req.body.currentRoles,
                                                            'unusedRoles': []

                }}, {upsert: true}, (err, result) => {
                    if(err) console.log(err)

                    if(result !== null){
                        res.send('ok')
                    }

                    else{
                        res.send('ok')
                    }
                })
            }
        })
    })
})


module.exports = (io) => {
    // let roomid
    let getAdminIO = io.of('/get-admin')

    io.setMaxListeners(Infinity)
    
    getAdminIO.setMaxListeners(Infinity)
    
    //get admin of the room
    const findAdmin = async (roomid, socket) => {
        await axios({
            method: 'get',
            url: serverUrl + 'rooms/' + roomid + '/get-admin'
        })
        .then(res => {
            getAdminIO.in(roomid).emit('GetAdmin', res.data)
        })
        .catch(err => console.log(err)) 
    }

    getAdminIO.on('connect', socket => {

        socket.on('JoinRoom', data => {
            socket.join(data)
            findAdmin(data)
        })

    })

    io.on('connect', socket => {

        socket.on('disconnect', () => {
        })
    })

    return router
};
