var express = require('express');
var router = express.Router();
const mongoose = require('mongoose')

var axios = require('axios')
var mongoUrl = 'mongodb://werewolf_minhchinh_01:Haigay1997@ds057000.mlab.com:57000/werewolf_01'

var roomSchema = require('../../mongoose-schema/roomSchema')

var Room = mongoose.model('Room', roomSchema)

var playerSchema = require('../../mongoose-schema/playerSchema')

var Player = mongoose.model('Player', playerSchema)

var serverUrl = require('../../serverUrl')

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
                    if(order.player instanceof Array && order.player.length > 0 && !order.special){
                        
                        // //Update current called role
                        // Room.updateOne({'roomid': req.params.roomid},
                        //                 {$set: {"callingOrder.$[element].role": order.name}},
                        //                 {arrayFilters: [{"element.name": "current called role"}]}, (err, result) => {
                        //     if(err) return console.log(err)

                        //     if(result !== null){
                                if(order.name === "Werewolves")
                                    res.send(order.player)

                                else
                                    res.send(order.player[0])
                        //     }
                        // })

                        return false
                    }

                    return true
                })
            }

        })
    })

})

router.post('/:roomid/player-close-game', (req, res, next) => {
    mongoose.connect(mongoUrl, { useNewUrlParser: true })

    var db = mongoose.connection

    db.on('error', console.error.bind(console, 'connection error: '))

    db.once('open', () => { 
        Player.deleteOne({'username': req.body.username, 'roomid': req.params.roomid}, (err, result) => {
            if(err) return console.log(err)
            
            Room.findOneAndUpdate({'roomid': req.params.roomid}, {$pull: {'totalPlayers': req.body.username}}, (err, result) => {
                if(err) return console.log(err)

                if(result !== null){
                    let totalPlayers = result.totalPlayers

                    if(totalPlayers instanceof Array && totalPlayers.length === 0){
                        Room.deleteOne({'roomid': req.params.roomid}, (err, result) => {
                        })
                    }
                        
                }
            })
        })
        res.send('ok')
    })
})


module.exports = (io) => {
    let inGameIO = io.of('/in-game')

    inGameIO.setMaxListeners(Infinity)

    const getGameInfo = (roomid, socket) => {
        axios({
            method: 'get',
            url: serverUrl + 'in-game/' + roomid + '/get-game-info'
        })
        .then(res => {
            socket.emit('RetrieveGameInfo', res.data)
        })
    }

    const getTheFirstTurn = (roomid) => {
        axios({
            method: 'get',
            url: serverUrl + 'in-game/' + roomid + '/retrieve-first-turn'
        })
        .then(res => {
            inGameIO.in(roomid).emit('Retrieve1stTurn', res.data)
        })
        .catch(err => console.log(err))
    }

    const EachRoleRequestToGetFirstRound = (roomid, socket) => {
        axios({
            method: 'get',
            url: serverUrl + 'in-game/' + roomid + '/retrieve-first-turn'
        })
        .then(res => {
            socket.emit('EachRoleGetFirstRound', res.data)
        })
        .catch(err => console.log(err))
    }

    const getAllHypnotized = (roomid, socket) => {
        axios({
            method: 'get',
            url: serverUrl + 'in-game/actions/' + roomid + '/piper-charm'
        })
        .then((res => {
            socket.emit('GetListOfCharmed', res.data)
        }))
        .catch((err) => {
            console.log(err)
        })
    }
    
    const RequestToCloseGame = (data, socket) => {
        axios({
            method: 'post',
            url: serverUrl + 'in-game/' + data.roomid + '/player-close-game',
            data: data
        })
        .then(res => {
            socket.emit('PlayerCloseGame', res.data)
        })
        .catch(err => console.log(err))
    }

    inGameIO.on('connect', socket => {
        socket.on('GetGameInfo', data => {
            getGameInfo(data, socket)   
        })

        socket.on('JoinRoom', data => {
            socket.join(data)
        })

        socket.on('EachRoleRequestToGetFirstRound', (roomid) => {
            EachRoleRequestToGetFirstRound(roomid, socket)
        })

        socket.on('RequestToStartTheGame1stRound', (roomid) => {
            getTheFirstTurn(roomid)

        })

        socket.on("RequestToRetrieveCharmPlayers", data => {
            getAllHypnotized(data, socket)
        })

        socket.on('RequestToCloseGame', data => {
            RequestToCloseGame(data, socket)
        })
    })



    

    

    return router
}