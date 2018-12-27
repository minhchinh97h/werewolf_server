var express = require('express');
var router = express.Router();
const mongoose = require('mongoose')

var axios = require('axios')
var mongoUrl = 'mongodb://werewolf_minhchinh_01:Haigay1997@ds057000.mlab.com:57000/werewolf_01'

var roomSchema = require('../../../../mongoose-schema/roomSchema')

var Room = mongoose.model('Room', roomSchema)



router.post('/:roomid/the-fox-scent', (req, res, next) => {
    mongoose.connect(mongoUrl, { useNewUrlParser: true })

    var db = mongoose.connection

    db.on('error', console.error.bind(console, 'connection error: '))

    db.once('open', () => { 
        Room.findOne( {'roomid': req.params.roomid}, {'callingOrder': 1, '_id': 0 }, (err, result) => {
            if(err) return console.log(err)

            if(result !== null){
                let found = false
                req.body.players.forEach(player => {
                    result.callingOrder.forEach(order => {
                        if(player === order.name && (order.role === 'Werewolves' 
                                                    || order.role === 'The dog wolf'
                        )){
                            res.send(true)
                            found = true
                        }
                    })
                })

                if(!found)
                    res.send(false)
            }
        })
    })
})


module.exports = (io) => {
    let foxIO = io.of('/the-fox')

    const requestFoxScent = async (data) => {
        await axios({
            method: 'post',
            url: 'http://localhost:3001/in-game/actions/' + data.roomid + '/the-fox-scent',
            data: {
                players: data.players
            }
        })
        .then(res => {
            foxIO.emit('GetScentPlayers', res.data)
        })
        .catch(err => console.log(err))
    }

    foxIO.on('connect', (socket) => {
        socket.on('JoinRoom', (data) => {
            socket.join(data.roomid)
        })

        socket.on('Request', data => {
            requestFoxScent(data)
        })

        socket.on('disconnect', () => {
            console.log('user disconnected')
        })
    })

    return router
}