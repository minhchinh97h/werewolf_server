var express = require('express');
var router = express.Router();
const mongoose = require('mongoose')

var axios = require('axios')
var mongoUrl = 'mongodb://werewolf_minhchinh_01:Haigay1997@ds057000.mlab.com:57000/werewolf_01'

var roomSchema = require('../../../mongoose-schema/roomSchema')

var Room = mongoose.model('Room', roomSchema)

router.post('/:roomid/retreive-next-turn', (req, res, next) => {
    mongoose.connect(mongoUrl, { useNewUrlParser: true })

    var db = mongoose.connection

    db.on('error', console.error.bind(console, 'connection error: '))

    db.once('open', () => { 
        Room.findOne( {'roomid': req.params.roomid}, {'callingOrder': 1, '_id': 0}, (err, result) => {
            if(err) return console.log(err)

            if(result !== null){
                result.callingOrder.forEach((data, index) => {
                    if(data.role === req.body.role && index < (result.callingOrder.length - 1)){
                        res.send(result.callingOrder[index+1])
                        console.log(result.callingOrder[index+1])
                    }

                    else if(data.role === req.body.role && index === (result.callingOrder.length -1)){
                        res.send("round ends")
                    }
                })
            }
        })
    })
})

module.exports = (io) => {

    let rntIO = io.of('/retrieve-next-turn')

    const getNextTurn = (data) => {
        
        axios({
            method: 'post',
            url: 'http://localhost:3001/in-game/actions/' + data.roomid + '/retreive-next-turn',
            data: {
                roomid: data.roomid,
                role: data.role
            }
        })
        .then(res => {
            rntIO.in(data.roomid).emit('getNextTurn', res.data)
        })
        .catch(err => console.log(err))
    }

    rntIO.on('connect', socket => {
        socket.on('JoinRoom', data => {
            socket.join(data)

        })

        socket.on('RequestToGetNextTurn', (data) => {
            getNextTurn(data)
        })
    })

    return router
}