var express = require('express');
var router = express.Router();
const mongoose = require('mongoose')

var axios = require('axios')
var mongoUrl = 'mongodb://werewolf_minhchinh_01:Haigay1997@ds057000.mlab.com:57000/werewolf_01'

var roomSchema = require('../../../../mongoose-schema/roomSchema')

var Room = mongoose.model('Room', roomSchema)

var serverUrl = require('../../../../serverUrl')

//Update the calling order
router.post('/:roomid/piper-charm', (req, res, next) => {
    mongoose.connect(mongoUrl, { useNewUrlParser: true })

    var db = mongoose.connection

    db.on('error', console.error.bind(console, 'connection error: '))

    db.once('open', () => {
        Room.findOne({'roomid': req.params.roomid}, {'callingOrder': 1, '_id': 0}, (err, result) => {
            if(err) return console.log(err)

            if(result !== null){
                result.callingOrder.forEach((order, index, arr) => {
                    if(order.name === 'The hypnotized'){
                        req.body.playersToCharm.forEach(player => {
                            arr[index].player.push(player)
                        })
                    }
                })

                Room.updateOne({'roomid': req.params.roomid}, {$set: {'callingOrder': result.callingOrder}}, (err, result) => {
                    if(err) return console.log(err)

                    if(result !== null){
                        let sendingArray = []

                        sendingArray.push({
                            player: req.body.playersToCharm[0]
                        })

                        sendingArray.push({
                            player: req.body.playersToCharm[1]
                        })

                        res.send(sendingArray)
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
    let piperIO = io.of('/piper')
    let inGameIO = io.of('/in-game')

    piperIO.setMaxListeners(Infinity)
    inGameIO.setMaxListeners(Infinity)

    const requestToCharm = (data, socket) => {
        axios({
            method: 'post',
            url: serverUrl + 'in-game/actions/' + data.roomid + '/piper-charm',
            data: {
                playersToCharm : data.playersToCharm
            }
        })
        .then((res) => {
            socket.emit("CharmedPlayers", res.data)

            return axios({
                method: 'get',
                url: serverUrl + 'in-game/actions/' + data.roomid + '/piper-charm'
            })
        })
        .then((res) => {
            inGameIO.in(data.roomid).emit('GetListOfCharmed', res.data)
        })
        .catch((err) => {
            console.log(err)
        })
    }

    

    piperIO.on('connect', (socket) => {
        socket.on("RequestToCharmPlayers", data => {
            requestToCharm(data, socket)
        })
    })
    return router
}
