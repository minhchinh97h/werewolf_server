var express = require('express');
var router = express.Router();

var axios = require('axios')
var mongoUrl = 'mongodb://werewolf_minhchinh_01:Haigay1997@ds057000.mlab.com:57000/werewolf_01'

const mongoose = require('mongoose')
var roomSchema = require('../mongoose-schema/roomSchema')
var Room = mongoose.model('Room', roomSchema)

//return players field for MainPage component
router.get('/:roomid', (req, res, next) => {
    
    mongoose.connect(mongoUrl, { useNewUrlParser: true })
    
    var db = mongoose.connection

    db.on('error', console.error.bind(console, 'connection error: '))

    db.once('open', () => {
        
        // //return only players field
        Room.findOne({ 'roomid' : req.params.roomid}, {'players': 1, '_id': 0}, (err, result) => {
            if(err) return console.log(err)

            if(result !== null){
                res.send(result.players)
            }
            
            else
                res.send("not ok")

        })
    })
})

module.exports = (io) => {
    io.of('/main-page').setMaxListeners(Infinity)

    // let roomid

    // io.of('/main-page').use((socket, next) => {
    //     roomid = socket.handshake.query.roomid
    //     if(roomid.length > 0)
    //         return next()
        
    //     return next(new Error('roomid does not found'))
    // })
    
    const getPlayers = (roomid, socket) => {
        axios({
            method: 'get',
            url: 'http://localhost:3001/main-page/' + roomid
        })
        .then(res => {
            socket.emit('GetPlayers', res.data)
        })
        .catch(err => console.log(err))
    }

    const broadCastPlayers = (roomid) => {
        axios({
            method: 'get',
            url: 'http://localhost:3001/main-page/' + roomid
        })
        .then(res => {
            io.of('/main-page').in(roomid).emit('GetBroadCastPlayers', res.data)
        })
        .catch(err => console.log(err))
    }

    io.of('/main-page').on('connect', socket => {
        socket.on('RequestToGetPlayersAndJoinRoom', roomid => {
            socket.join(roomid)
            broadCastPlayers(roomid)
        })

        socket.on('RequestToGetPlayers', data => {
            getPlayers(data, socket)
        })

        io.of('/main-page').on('disconnect', () => {
            console.log('user disconnected')
        })
    })

    return router
};
