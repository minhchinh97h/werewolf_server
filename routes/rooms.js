var express = require('express');
var router = express.Router();
const mongoose = require('mongoose')

var axios = require('axios')
var mongoUrl = 'mongodb://werewolf_minhchinh_01:Haigay1997@ds057000.mlab.com:57000/werewolf_01'

var playerSchema = require('../mongoose-schema/playerSchema')
var roomSchema = require('../mongoose-schema/roomSchema')

var Player = mongoose.model('Player', playerSchema)
var Room = mongoose.model('Room', roomSchema)

//create or update if newRoomBttn clicked
router.post('/create-or-update/:roomid', (req, res, next) => {

    mongoose.connect(mongoUrl, { useNewUrlParser: true })

    var db = mongoose.connection

    db.on('error', console.error.bind(console, 'connection error: '))

    db.once('open', () => {

        //to update the current player's data row in Players collection
        Player.updateOne({username: req.body.admin}, {$set: {roomid: req.body.roomid}}, (err, result) => {
            if(err) console.log(err)

            //return if does not find the valid username
            if(result === null){
                res.send("cannot find player")
            }

            //proceed if finds
            else{
                //update or create a row if it doesnt exist
                Room.updateOne({admin: req.body.admin}, { $set: {
                                                                            'roomid': req.body.roomid, 
                                                                            'admin': req.body.admin, 
                                                                            'timeCreated': req.body.timeCreated,
                                                                            'numberOfPlayers': req.body.numberOfPlayers,
                                                                            'players': [req.body.players],
                                                                            'status': req.body.status,
                                                                            'currentRoles': req.body.currentRoles,
                                                                            'recommendedRoles': req.body.recommendedRoles

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


//response 
router.get('/:roomid', (req, res, next) => {

    mongoose.connect(mongoUrl, { useNewUrlParser: true })

    var db = mongoose.connection

    db.on('error', console.error.bind(console, 'connection error: '))

    db.once('open', () => {
        //to verify that the req.params.roomid exists both in Rooms collection and db as a collection
        Room.findOne({'roomid': req.params.roomid}, (err, result) => {
            if(err) return console.log(err)

            if(result !== null){
                res.send("ok")
            }

            else
                res.send("not found")

        })
    })
} )


//update the related roomid if joinBttn clicked
router.post('/:roomid/update', (req, res, next) => {

    mongoose.connect(mongoUrl, { useNewUrlParser: true })

    var db = mongoose.connection

    db.on('error', console.error.bind(console, 'connection error: '))

    db.once('open', () => {
        var username = req.body.username

        //increase the numberOfPlayers field and push the new username into players field
        Room.updateOne({'roomid': req.body.roomid}, { $inc: { 'numberOfPlayers': 1 },  $push: {'players': username} } , (err, result) => {
            if(err) return console.log(err)

            if(result !== null){

                res.send("ok")
            }  

            else{
                res.send("not ok")
            }

        })
    })
})

var roomid

//get admin of the room
router.get('/:roomid/get-admin', (req, res, next) => {
    roomid = req.params.roomid

    mongoose.connect(mongoUrl, { useNewUrlParser: true })

    var db = mongoose.connection

    db.on('error', console.error.bind(console, 'connection error: '))

    db.once('open', () => {
        //send back the admin of the current room id
        Room.findOne({roomid: roomid}, {'numberOfPlayers': 1, 'admin': 1, '_id': 0}, (err, result) => {
            if(err) console.log(err)

            if(result !== null)
                res.send(result)
            else
                res.send('not ok')

            db.close()
        })
    })
})


module.exports = (io) => {
    // let roomid
    let getAdminIO = io.of('/get-admin')

    // getAdminIO.use( (socket, next) => {
    //     roomid = socket.handshake.query.roomid

    //     if(roomid.length > 0)
    //         return next()

    //     return next(new Error('roomid not found'))    
    // }) 
    getAdminIO.setMaxListeners(Infinity)
    
    const findAdmin = async (roomid) => {
        await axios({
            method: 'get',
            url: 'http://192.168.1.3:3001/rooms/' + roomid + '/get-admin'
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

        getAdminIO.on('disconnect', () => {
            console.log('user disconnected')
        })
    })

    return router
};
