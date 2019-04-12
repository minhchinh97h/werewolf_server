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

router.get('/:roomid/retrieve-first-turn', (req, res, next) => {
    mongoose.connect(mongoUrl, { useNewUrlParser: true })

    var db = mongoose.connection

    db.on('error', console.error.bind(console, 'connection error: '))

    db.once('open', () => { 
        Room.findOne( { 'roomid': req.params.roomid }, {'callingOrder': 1, '_id': 0}, (err, result) => {
            if(err) return console.log(err)

            if(result !== null){
                result.callingOrder.every(order => {
                    if(order.player instanceof Array && order.player.length !== 0 && !order.special){
                        
                        //Update current called role
                        Room.updateOne({'roomid': req.params.roomid},
                                        {$set: {"callingOrder.$[element].role": order.name}},
                                        {arrayFilters: [{"element.name": "current called role"}]}, (err, result) => {
                            if(err) return console.log(err)

                            if(result !== null){
                                if(order.name === "Werewolves")
                                res.send(order.player)

                                else
                                    res.send(order.player[0])
                            }
                        })

                        return false
                    }
                    else
                        return true
                })
            }

        })
    })

})

module.exports = (io) => {
    let inGameIO = io.of('/in-game')

    inGameIO.setMaxListeners(Infinity)

    const getGameInfo = async (roomid, socket) => {
        await axios({
            method: 'get',
            url: 'http://localhost:3001/in-game/' + roomid + '/get-game-info'
        })
        .then(res => {
            socket.emit('RetrieveGameInfo', res.data)
        })
    }

    const getTheFirstTurn = (roomid) => {
        axios({
            method: 'get',
            url: 'http://localhost:3001/in-game/' + roomid + '/retrieve-first-turn'
        })
        .then(res => {
            inGameIO.in(roomid).emit('Retrieve1stTurn', res.data)
        })
        .catch(err => console.log(err))
    }

    const getAllHypnotized = (roomid, socket) => {
        axios({
            method: 'get',
            url: 'http://localhost:3001/in-game/actions/' + roomid + '/piper-charm'
        })
        .then((res => {
            inGameIO.in(roomid).emit('GetListOfCharmed', res.data)
        }))
        .catch((err) => {
            console.log(err)
        })
    }
    
    inGameIO.on('connect', socket => {
        socket.on('GetGameInfo', data => {
            getGameInfo(data, socket)   
        })

        socket.on('JoinRoom', data => {
            socket.join(data)
        })

        socket.on('RequestToStartTheGame1stRound', (data) => {
            inGameIO.emit('RetrieveGameStart1stRound', 'ok')
        })

        socket.on('RequestToGet1stTurn', data => {
            getTheFirstTurn(data)
        })

        socket.on("RequestToRetrieveCharmPlayers", data => {
            getAllHypnotized(data, socket)
        })
    })



    

    

    return router
}