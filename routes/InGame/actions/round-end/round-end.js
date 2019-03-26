var express = require('express');
var router = express.Router();
const mongoose = require('mongoose')

var axios = require('axios')
var mongoUrl = 'mongodb://werewolf_minhchinh_01:Haigay1997@ds057000.mlab.com:57000/werewolf_01'


var roomSchema = require('../../../../mongoose-schema/roomSchema')

var Room = mongoose.model('Room', roomSchema)

module.exports = (io) => {

    let reIO = io.of('/round-end')

    reIO.setMaxListeners(Infinity)

    reIO.on('connect', socket => {
        socket.on('JoinRoom', roomid => {
            socket.join(roomid)
        })

        socket.on('BroadCastMyChoice', data => {
            reIO.in(data.roomid).emit('GetOtherChoices', data)
        })
    })

    return router
}