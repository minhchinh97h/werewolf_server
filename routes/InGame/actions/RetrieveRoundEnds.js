var express = require('express');
var router = express.Router();
const mongoose = require('mongoose')

var axios = require('axios')
var mongoUrl = 'mongodb://werewolf_minhchinh_01:Haigay1997@ds057000.mlab.com:57000/werewolf_01'

var roomSchema = require('../../../mongoose-schema/roomSchema')

var Room = mongoose.model('Room', roomSchema)

var playerSchema = require('../../../mongoose-schema/playerSchema')

var Player = mongoose.model('Player', playerSchema)

router.get('/:roomid/retrieve-round-ends', (req, res, next) => {
    mongoose.connect(mongoUrl, { useNewUrlParser: true })

    var db = mongoose.connection

    db.on('error', console.error.bind(console, 'connection error: '))

    db.once('open', () => { 
        Player.find({'roomid': req.params.roomid}).toArray((err, result) => {
            if(err) return console.log(err)

            if(result !== null){

                var sendingData = {
                    dead: [],
                    silence: String
                }

                result.forEach((data, i) => {
                    if(data.status.dead > 0)
                        sendingData.dead.push(data.username)
                    else
                        if(data.status.silence > 0)
                            sendingData.silence = data.username
                })

                res.send(sendingData)
            }
        })
    })
})

module.exports = (io) => {

    return router
}