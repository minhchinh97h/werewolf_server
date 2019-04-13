var express = require('express');
var router = express.Router();
const mongoose = require('mongoose')

var axios = require('axios')
var mongoUrl = 'mongodb://werewolf_minhchinh_01:Haigay1997@ds057000.mlab.com:57000/werewolf_01'

var roomSchema = require('../../../../mongoose-schema/roomSchema')

var Room = mongoose.model('Room', roomSchema)

var serverUrl = require('../../../../serverUrl')

router.post('/:roomid/bear-scent', (req, res, next) => {
    mongoose.connect(mongoUrl, { useNewUrlParser: true })

    var db = mongoose.connection

    db.on('error', console.error.bind(console, 'connection error: '))

    db.once('open', () => { 
        Room.findOne({'roomid': req.params.roomid}, {'callingOrder': 1, '_id': 0}, (err, result) => {
            if(err) return console.log(err)

            if(result !== null){
                let found = false;

                result.callingOrder.every((order, index) => {
                    req.body.playersToScent.every(player => {
                        if(!order.special && order.player instanceof Array && order.player.includes(player)){
                            if(order.name === 'Werewolves'){
                                found = true
                                return false
                            }
                        }

                        return true
                    })

                    if(found){
                        res.send(true)
                        return false
                    }

                    return true
                })

                if(!found)
                    res.send(false)
            }
        })
    })
})


module.exports = (io) => {

    let bearIO = io.of('bear')

    bearIO.setMaxListeners(Infinity)

    const ScentPlayer = (data, socket) => {
        axios({
            method: 'post',
            url: serverUrl + 'in-game/actions/' + data.roomid + '/bear-scent',
            data: {
                playersToScent: data.playersToScent
            }
        })
        .then(res => {
            socket.emit('ScentPlayer', res.data)
        })
        .catch(err => console.log(err))
    }

    bearIO.on('connect', (socket) => {
        socket.on('RequestToScentPlayer', data => {
            ScentPlayer(data, socket)
        })
    })

    return router
}