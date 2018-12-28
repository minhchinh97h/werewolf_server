var express = require('express');
var router = express.Router();
const mongoose = require('mongoose')

var axios = require('axios')
var mongoUrl = 'mongodb://werewolf_minhchinh_01:Haigay1997@ds057000.mlab.com:57000/werewolf_01'

var roomSchema = require('../../../../mongoose-schema/roomSchema')

var Room = mongoose.model('Room', roomSchema)

router.post('/:roomid/cupid-connect', (req, res, next) => {
    mongoose.connect(mongoUrl, { useNewUrlParser: true })

    var db = mongoose.connection

    db.on('error', console.error.bind(console, 'connection error: '))

    db.once('open', () => { 
        Room.findOne( {'roomid': req.params.roomid}, {'callingOrder': 1, '_id': 0}, (err, result) => {
            if(err) return console.log(err)

            if(result !== null){
                result.callingOrder.every((order, index) => {
                    if(order.name === 'The Lovers'){
                        result.callingOrder[index].player = req.body.playersToConnect
                    }
                })

                Room.updateOne({'roomid': req.params.roomid}, {$set: {'callingOrder': result.callingOrder}}, (err, result) => {
                    if(err) return console.log(err)

                    if(result !== null){
                        res.send({
                            player1: req.body.playersToConnect[0],
                            player2: req.body.playersToConnect[1]
                        })
                    }
                })
            }
        })
    })
})

module.exports = (io) => {
    let cupidIO = io.of('cupid')

    const requestConnect = async (data) => {
        await axios({
            method: 'post',
            url: 'http://localhost:3001/in-game/actions/' + data.roomid + '/cupid-connect',
            data: {
                playersToConnect: data.playersToConnect
            }
        })
        .then(res => {
            cupidIO.emit('ConnectedPlayers', res.data)
        })
        .catch(err => console.log(err))
    }

    cupidIO.on('connect', (socket) => {
        socket.on('RequestToConnectPlayers', data => {
            requestConnect(data)
        })
    })
    return router
}