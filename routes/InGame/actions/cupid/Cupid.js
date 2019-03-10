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
                let player1Role = '',
                    player2Role = ''

                result.callingOrder.forEach((order, index) => {
                    if(order.name === 'The Lovers'){
                        result.callingOrder[index].player = req.body.playersToConnect
                    }
                    
                    if(order.player.length > 0){
                        for(let i = 0; i < order.player.length; i++){
                            if(order.player[i] === req.body.playersToConnect[0]){
                                player1Role = order.name
                            }

                            else if (order.player[i] === req.body.playersToConnect[1]){
                                player2Role = order.name
                            }
                        }
                    }
                })

                Room.updateOne({'roomid': req.params.roomid}, {$set: {'callingOrder': result.callingOrder}}, (err, result) => {
                    if(err) return console.log(err)

                    if(result !== null){

                        res.send(new Array[
                            {
                                player: req.body.playersToConnect[0],
                                role: player1Role
                            },

                            {
                                player: req.body.playersToConnect[1],
                                player2Role: player2Role
                            }
                        ])
                    }
                })
            }
        })
    })
})

module.exports = (io) => {
    let cupidIO = io.of('/cupid')

    let inGameIO = io.of('/in-game')

    const requestConnect = async (data, socket) => {
        await axios({
            method: 'post',
            url: 'http://localhost:3001/in-game/actions/' + data.roomid + '/cupid-connect',
            data: {
                playersToConnect: data.playersToConnect
            }
        })
        .then(res => {
            socket.emit('ConnectedPlayers', res.data)


            inGameIO.in(data.roomid).emit('RevealLovers', res.data)
        })
        .catch(err => console.log(err))
    }


    cupidIO.on('connect', (socket) => {
        socket.on('RequestToConnectPlayers', data => {
            requestConnect(data, socket)
        })
    })
    return router
}