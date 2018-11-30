var express = require('express');
var router = express.Router();

var axios = require('axios')
var mongoUrl = 'mongodb://werewolf_minhchinh_01:Haigay1997@ds057000.mlab.com:57000/werewolf_01'

const mongoose = require('mongoose')
var roomSchema = require('../mongoose-schema/roomSchema')
var Room = mongoose.model('Room', roomSchema)

var players = []

//return players field for MainPage component
router.get('/:roomid', (req, res, next) => {
    
    mongoose.connect(mongoUrl, { useNewUrlParser: true })
    
    var db = mongoose.connection

    db.on('error', console.error.bind(console, 'connection error: '))

    db.once('open', () => {
        
        // //return only players field
        Room.findOne({ 'roomid' : req.params.roomid}, (err, result) => {
            if(err) return console.log(err)

            if(result !== 0 || result.length !== 0){
                players = result.players
                res.send("ok")
            }
            
            else
                res.send("not ok")

            db.close()

            return
        })
    })
})

module.exports = (io) => {
    io.of('/main-page').setMaxListeners(Infinity)
    let roomid

    io.of('/main-page').use((socket, next) => {
        roomid = socket.handshake.query.roomid
        if(roomid.length > 0)
            return next()
        
        return next(new Error('roomid does not found'))
    })
    
    const getPlayers = async () => {
        await axios({
            method: 'get',
            url: 'http://192.168.1.3:3001/main-page/' + roomid
        })
        .then(res => {
            if(res.data === "ok")
                io.of('/main-page').emit('GetPlayersAt'+ roomid, players)
        })
        .catch(err => console.log(err))
    }

    io.of('/main-page').on('connection', socket => {
        getPlayers()
        io.of('/main-page').on('disconnect', () => {
            console.log('user disconnected')
        })
    })

    return router
};
