var express = require('express');
var router = express.Router();
const mongoose = require('mongoose')

var axios = require('axios')
var mongoUrl = 'mongodb://werewolf_minhchinh_01:Haigay1997@ds057000.mlab.com:57000/werewolf_01'

var roomSchema = require('../../mongoose-schema/roomSchema')

var Room = mongoose.model('Room', roomSchema)

router.get('/:roomid/get-game-info', (req, res, next) => {
    mongoose.connect(mongoUrl, { useNewUrlParser: true })

    var db = mongoose.connection

    db.on('error', console.error.bind(console, 'connection error: '))

    db.once('open', () => {
        Room.findOne( {'roomid': req.params.roomid}, {'callingOrder': 1, '_id': 0}, (err, result) => {
            if(err) return console.log(err)

            if(result !== null)
                res.send(result.callingOrder)
            else
                res.send('not ok')
        })
    })
})

router.post('/:roomid/retrieve-game-turn', (req, res, next) => {
    mongoose.connect(mongoUrl, { useNewUrlParser: true })

    var db = mongoose.connection

    db.on('error', console.error.bind(console, 'connection error: '))

    db.once('open', () => { 
        Room.findOne( { 'roomid': req.params.roomid }, {'callingOrder': 1, '_id': 0}, (err, result) => {
            if(err) return console.log(err)

            if(result !== null){
                if(req.body.data.flag === "start"){
                    res.send(result.callingOrder[0])
                }
            }

        })
    })

})

module.exports = (io) => {
    let inGameIO = io.of('/in-game')

    inGameIO.setMaxListeners(Infinity)

    const getGameInfo = async (roomid) => {
        await axios({
            method: 'get',
            url: 'http://192.168.1.3:3001/in-game/' + roomid + '/get-game-info'
        })
        .then(res => {
            inGameIO.in(roomid).emit('RetrieveGameInfo', res.data)
        })
    }

    inGameIO.on('connect', socket => {
        socket.on('JoinRoom', data => {
            socket.join(data)

            getGameInfo(data)
        })

        inGameIO.on('disconnect', () => {
            console.log('user disconnected')
        })
    })

    inGameIO.on('RequestToStartTheGame', data => {

    })
    return router
}