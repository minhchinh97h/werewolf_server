var express = require('express');
var router = express.Router();
const mongoose = require('mongoose')

var axios = require('axios')
var mongoUrl = 'mongodb://werewolf_minhchinh_01:Haigay1997@ds057000.mlab.com:57000/werewolf_01'

var roomSchema = require('../../../../mongoose-schema/roomSchema')

var Room = mongoose.model('Room', roomSchema)

//Update the calling order
router.post('/:roomid/piper-charm', (req, res, next) => {
    mongoose.connect(mongoUrl, { useNewUrlParser: true })

    var db = mongoose.connection

    db.on('error', console.error.bind(console, 'connection error: '))

    db.once('open', () => { 
        Room.findOne({'roomid': req.params.roomid}, {'callingOrder': 1, '_id': 0}, (err, result) => {
            if(err) return console.log(err)

            if(result !== null){
                result.callingOrder.forEach(order => {
                    if(order.name === 'The hypnotized'){
                        order.player.concat(req.body.playersToCharm)
                    }
                })

                Room.updateOne({'roomid': req.params.roomid}, {$set: {'callingOrder': result.callingOrder}}, (err, result) => {
                    if(err) return console.log(err)

                    if(result !== null){
                        res.send(new Array[
                            {
                                player: req.body.playersToCharm[0]
                            },
                            {
                                player: req.body.playersToCharm[1]
                            }
                        ])
                    }
                })
            }
        })
    })
})

//Get all the hypnotized players
router.get('/:roomid/piper-charm', (req, res, next) => {
    mongoose.connect(mongoUrl, { useNewUrlParser: true })

    var db = mongoose.connection

    db.on('error', console.error.bind(console, 'connection error: '))

    db.once('open', () => {
        Room.findOne({'roomid': req.params.roomid}, {'callingOrder': 1, '_id': 0}, (err, result) => {
            if(err) return console.log(err)

            if(result !== null){
                result.callingOrder.every(order => {
                    if(order.name === 'The hypnotized'){
                        res.send(order.player)
                        return false
                    }   
                    return true
                })
            }
        })
    })
})

module.exports = (io) => {
    let piperIO = io.of("piper")

    const requestToCharm = async (data) => {
        await axios({
            method: 'post',
            url: 'http://localhost:3001/in-game/actions/' + data.roomid + '/piper-charm',
            data: {
                playersToCharm : data.playersToCharm
            }
        })
        .then((res) => {
            piperIO.emit("CharmedPlayers", res.data)

            getAllHypnotized(data)
            
        })
        .then((res) => {
            piperIO.emit("GetListOfCharmed", res.data)
        })
        .catch((err) => {
            console.log(err)
        })
    }

    const getAllHypnotized = async (data) => {
        return await axios({
            method: 'get',
            url: 'http://localhost:3001/in-game/actions/' + data.roomid + '/piper-charm'
        })
    }

    piperIO.on("connect", (socket) => {
        socket.on("RequestToCharmPlayers", data => {
            requestToCharm(data)
        })
    })
    return router
}
