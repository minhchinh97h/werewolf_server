var express = require('express');
var router = express.Router();
const mongoose = require('mongoose')

var axios = require('axios')
var mongoUrl = 'mongodb://werewolf_minhchinh_01:Haigay1997@ds057000.mlab.com:57000/werewolf_01'

var roomSchema = require('../../../mongoose-schema/roomSchema')

var Room = mongoose.model('Room', roomSchema)

var playerSchema = require('../../../mongoose-schema/playerSchema')
var Player = mongoose.model('Player', playerSchema)

//retrieve next turn
router.post('/:roomid/retrieve-next-turn', (req, res, next) => {
    mongoose.connect(mongoUrl, { useNewUrlParser: true })

    var db = mongoose.connection

    db.on('error', console.error.bind(console, 'connection error: '))

    db.once('open', () => { 
        Room.findOne( {'roomid': req.params.roomid}, {'callingOrder': 1, '_id': 0}, (err, result) => {
            if(err) return console.log(err)

            if(result !== null){
                var callingOrder = result.callingOrder

                callingOrder.forEach((order, index) => {
                    if(req.body.role === order.name){
                        if(index < (callingOrder.length - 1)){
                            for(let i = index + 1; i < callingOrder.length; i++){

                                //Don't get special roles
                                if(callingOrder[i].player.length > 0 && !callingOrder[i].special){
                                    //Roles that not Werewolves can only be called once per player
                                    if(callingOrder[i].name !== "Werewolves"){
                                        res.send(callingOrder[i].player[0])
                                        break
                                    }
                                    
                                    //For Werewolves, we call all the players at one time
                                    else{
                                        res.send(callingOrder[i].player)
                                        break
                                    }
                                }

                            }
                        }
                        
                        else{
                            res.send("round ends")
                        }
                    }
                })
            }
        })
    })
})

//Announce the final kill target to werewolves
router.post('/:roomid/werewolves-final-kill', (req, res, next) => {
    mongoose.connect(mongoUrl, { useNewUrlParser: true })

    var db = mongoose.connection

    db.on('error', console.error.bind(console, 'connection error: '))

    db.once('open', () => { 
        Room.findOne({'roomid': req.params.roomid}, {'callingOrder': 1, '_id': 0}, (err, result) => {
            if(err) return console.log(err)

            if(result !== null){
                result.callingOrder.every((order, i) => {
                    if(order.name === 'Werewolves current target'){

                        //Update the player's status in 'Player' collection
                        Player.updateOne({'roomid': req.params.roomid, 'username': req.body.choseTarget}, {$inc: {'status.dead': 1}}, (err, result) => {
                            if(err) console.log(err)

                            if(result !== null){
                                res.send(order.chosen)
                                return false
                            }
                        })

                    }

                    return true
                })
            }
        })
    })
})


module.exports = (io) => {

    let rntIO = io.of('/retrieve-next-turn'),
        wwIO = io.of('/werewolves'),
        reIO = io.of('/retrieve-round-ends')

    const getNextTurn = (data) => {
        
        axios({
            method: 'post',
            url: 'http://localhost:3001/in-game/actions/' + data.roomid + '/retrieve-next-turn',
            data: {
                roomid: data.roomid,
                role: data.role
            }
        })
        .then(res => {
            if(res.data !== "round ends"){
                rntIO.in(data.roomid).emit('getNextTurn', res.data)
            }
            else
                axios({
                    method: 'get',
                    url: 'http://localhost:3001/in-game/actions/' + data.roomid + '/retrieve-round-ends'
                })
                .then(res => {
                    //res.data of GET request is from RetrieveRoundEnds.js and also the joinning room action of reIO
                    reIO.in(data.roomid).emit('RoundEnds', res.data)
                })
        })
        .catch(err => console.log(err))
    }

    const getFinalKill = async (data) => {
        await axios({
            method: 'post',
            url: 'http://localhost:3001/in-game/actions/' + data.roomid + '/werewolves-final-kill',
            data: data
        })
        .then(res => {
            wwIO.in(data.roomid).emit('ReceiveTheFinalTarget', res.data)
        })
        .catch(err => {
            console.log(err)
        })
    }

    rntIO.on('connect', socket => {
        socket.on('JoinRoom', data => {
            socket.join(data)
        })

        socket.on('RequestToGetNextTurn', (data) => {
            if(data.role === 'Werewolves'){
                getFinalKill(data)
            }
            getNextTurn(data)
        })
    })

    return router
}