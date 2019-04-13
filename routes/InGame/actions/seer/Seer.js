var express = require('express');
var router = express.Router();
const mongoose = require('mongoose')

var axios = require('axios')
var mongoUrl = 'mongodb://werewolf_minhchinh_01:Haigay1997@ds057000.mlab.com:57000/werewolf_01'

var roomSchema = require('../../../../mongoose-schema/roomSchema')

var Room = mongoose.model('Room', roomSchema)

var serverUrl = require('../../../../serverUrl')

router.post('/:roomid/seer-reveal', (req, res, next) => {
    mongoose.connect(mongoUrl, { useNewUrlParser: true })

    var db = mongoose.connection

    db.on('error', console.error.bind(console, 'connection error: '))

    db.once('open', () => { 
        Room.findOne( { 'roomid': req.params.roomid }, { 'callingOrder': 1, '_id': 0 }, (err, result) => {
            if(err) return console.log(err)

            if(result !== null){
                let found = false
                result.callingOrder.forEach((order, index) => {
                    if(!order.special)
                        order.player.every((player) => {
                            if(player === req.body.player){
                                found = true
                                res.send(order.name)
                                return false
                            }
                            return true
                        })
                })

                if(!found){
                    res.send("Ordinary Townsfolk")
                }
            }
        })
    })

})


module.exports = (io) => {

    let seerIO = io.of('/seer')

    seerIO.setMaxListeners(Infinity)

    const revealPlayerRole = (data, socket) => {
        axios({
            method: 'post',
            url: serverUrl + 'in-game/actions/' + data.roomid + '/seer-reveal',
            data: {
                player: data.player
            }
        })
        .then(res => {
            let socketResponseData = {
                role: res.data,
                username: data.player
            }
            socket.emit('RevealPlayer', socketResponseData)
        })
        .catch(err => console.log(err))
    }

    seerIO.on('connect', socket => {

        socket.on('Request', data => {
            revealPlayerRole(data, socket)
        })
    })

    return router
}