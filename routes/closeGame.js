var express = require('express');
var router = express.Router();
const mongoose = require('mongoose')

var axios = require('axios')
var mongoUrl = 'mongodb://werewolf_minhchinh_01:Haigay1997@ds057000.mlab.com:57000/werewolf_01'

var roomSchema = require('../mongoose-schema/roomSchema')

var Room = mongoose.model('Room', roomSchema)

var playerSchema = require('../mongoose-schema/playerSchema')
var Player = mongoose.model('Player', playerSchema)

var serverUrl = require('../serverUrl')

//Handle when player exits the page (refreshing/closing/etc)
router.post('/', (req, res, next) => {
    mongoose.connect(mongoUrl, { useNewUrlParser: true })

    var db = mongoose.connection

    db.on('error', console.error.bind(console, 'connection error: '))

    db.once('open', () => {
        //delete from players collection
        Player.deleteOne({'username': req.body.username}, (err, result) => {
            if(err) return console.log()

            //If exit when in waiting room or in game 
            if(req.body.roomid){
                Room.findOne({'roomid': req.body.roomid}, {'callingOrder': 1, '_id': 0, 'unusedRoles': 1, 'players': 1, 'totalPlayers': 1}, (err, result) => {
                    if(err) return console.log(err)

                    if(result !== null){
                        let callingOrder = result.callingOrder,
                            unusedRoles = result.unusedRoles,
                            players = result.players,
                            totalPlayers = result.players
                        
                        unusedRoles.forEach((order, index, arr) => {
                            if(order.player instanceof Array){
                                order.player.every((player, i, playerArr) => {
                                    if(player === req.body.username){
                                        playerArr.splice(i, 1)
                                        return false
                                    }
                                    return true
                                })
                            }
                        })

                        callingOrder.forEach((order, index, arr) => {
                            if(order.player instanceof Array){
                                order.player.every((player, i, playerArr) => {
                                    if(player === req.body.username){
                                        playerArr.splice(i, 1)
                                        return false
                                    }
                                    return true
                                })
                            }
                    
                            if(order.name === "round end"){
                                let receivePressedVotePlayers = order.receivePressedVotePlayers
                    
                                if(receivePressedVotePlayers.hasOwnProperty(req.body.username)){
                                    delete receivePressedVotePlayers[req.body.username]
                                }
                    
                                arr[index].receivePressedVotePlayers = receivePressedVotePlayers
                    
                            }
                    
                            if(order.name === "end round action"){
                                let player = order.player
                    
                                if(player.hasOwnProperty(req.body.username)){
                                    delete player[req.body.username]
                                }
                    
                                arr[index].player = player
                            }
                    
                            if(order.name === "Werewolves end vote"){
                                let receiveEndVoteObject = order.receiveEndVoteObject
                    
                                if(receiveEndVoteObject.hasOwnProperty(req.body.username)){
                                    delete receiveEndVoteObject[req.body.username]
                                }
                    
                                arr[index].receiveEndVoteObject = receiveEndVoteObject
                            }
                    
                            if(order.name === "Werewolves end turn"){
                                let receiveEndTurnObject = order.receiveEndTurnObject
                    
                                if(receiveEndTurnObject.hasOwnProperty(req.body.username)){
                                    delete receiveEndTurnObject[req.body.username]
                                }
                    
                                arr[index].receiveEndTurnObject = receiveEndTurnObject
                            } 
                        })

                        players.every((player, index, arr) => {
                            if(player === req.body.username){
                                arr.splice(index, 1)
                                return false
                            }
                            return true
                        })

                        totalPlayers.every((player, index, arr) => {
                            if(player === req.body.username){
                                arr.splice(index, 1)
                                return false
                            }
                            return true
                        })

                        Room.updateOne({'roomid': req.body.roomid}, 
                                        {$set: {'callingOrder': callingOrder, 'players': players, 'totalPlayers': totalPlayers, 'unusedRoles': unusedRoles}},
                                        (err, result) => {
                            if(err) return console.log(err)

                            if(result !== null){
                                res.send('ok')
                            }
                        })
                    }
                })
            }
        })

    })
})

module.exports = (io) => {

    return router
}