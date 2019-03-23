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
                req.body.players.every(name => {
                    result.callingOrder.every(order => {
                        if(order.name === 'Werewolves' || order.name === 'The dog wolf'){
                            order.player.every((player) => {
                                if(player === name){
                                    found = true
                                    res.send(true)
                                }

                                if(found)
                                    return false
                                else
                                    return true
                            })
                        }
                        
                        if(found)
                            return false
                        else
                            return true
                    })
                    
                    if(found)
                        return false
                    else
                        return true
                })

                if(!found)  
                    res.send(false)
            }
        })
    })
})


module.exports = (io) => {
    let foxIO = io.of('/the-fox')

    const requestFoxScent = (data, socket) => {
        axios({
            method: 'post',
            url: 'http://localhost:3001/in-game/actions/' + data.roomid + '/the-fox-scent',
            data: {
                players: data.players
            }
        })
        .then(res => {
            socket.emit('GetScentPlayers', res.data)
        })
        .catch(err => console.log(err))
    }

    foxIO.on('connect', (socket) => {

        socket.on('RequestToScent', data => {
            requestFoxScent(data, socket)
        })

        socket.on('disconnect', () => {
            console.log('user disconnected')
        })
    })

    return router
}