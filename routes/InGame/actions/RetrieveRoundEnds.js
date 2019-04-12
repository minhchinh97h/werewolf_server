var express = require('express');
var router = express.Router();
const mongoose = require('mongoose')

var axios = require('axios')
var mongoUrl = 'mongodb://werewolf_minhchinh_01:Haigay1997@ds057000.mlab.com:57000/werewolf_01'

var roomSchema = require('../../../mongoose-schema/roomSchema')

var Room = mongoose.model('Room', roomSchema)

var playerSchema = require('../../../mongoose-schema/playerSchema')

var Player = mongoose.model('Player', playerSchema)

router.get('/:roomid/retrieve-round-ends', (req, res, next) => {
    mongoose.connect(mongoUrl, { useNewUrlParser: true })

    var db = mongoose.connection

    db.on('error', console.error.bind(console, 'connection error: '))

    db.once('open', () => {
        //Announce the deaths and silences
        let getThedeathsAndSilences = new Promise((resolve, reject) => {
            Player.find({'roomid': req.params.roomid}, (err, result) => {
                if(err) return reject(err)
    
                if(result !== null){
    
                    var sendingData = {
                        dead: [],
                        silence: ''
                    }
    
                    result.forEach((data, i) => {
                        if(data.status.dead > 0)
                            sendingData.dead.push(data.username)
                        else
                            if(data.status.silence > 0)
                                sendingData.silence = data.username
                    })
                    resolve(sendingData)
                }

                else
                    reject("no such document")
            })
        })

        getThedeathsAndSilences
        .then((sendingData) => {
            //find and update the deaths so that callingOrder, players only contains alive players
            return new Promise((resolve, reject) => {
                Room.findOne({'roomid': req.params.roomid}, {'callingOrder': 1, '_id': 0, 'players': 1}, (err, result) => {
                    if(err) return reject(err)
        
                    if(result !== null){
                        let callingOrder = result.callingOrder,
                            players = result.players,
                            sendingData2
                        
                        //Eliminiate dead players from callingOrder field
                        callingOrder.forEach((order, i, arr) => {
                            if(order.player instanceof Array && order.name !== "The hypnotized")
                                order.player.forEach((player, index, playerArr) => {
                                    if(sendingData.dead.includes(player) && sendingData.dead instanceof Array)
                                        playerArr.splice(index, 1)
                                })
                            
                            if(order.name === "round end"){
                                let receivePressedVotePlayers = order.receivePressedVotePlayers

                                sendingData.dead.forEach((d) => {
                                    if(receivePressedVotePlayers.hasOwnProperty(d)){
                                        delete receivePressedVotePlayers[d]
                                    }
                                })

                                arr[i].receivePressedVotePlayers = receivePressedVotePlayers
                            }

                            if(order.name === "end round action"){
                                let player = order.player

                                sendingData.dead.forEach((d) => {
                                    if(player.hasOwnProperty(d)){
                                        delete player[d]
                                    }
                                })

                                arr[i].player = player
                            }

                            if(order.name === "Werewolves end vote"){
                                let receiveEndVoteObject = order.receiveEndVoteObject
                                
                                sendingData.dead.forEach((d) => {
                                    if(receiveEndVoteObject.hasOwnProperty(d)){
                                        delete receiveEndVoteObject[d]
                                    }
                                })
                                
                    
                                arr[i].receiveEndVoteObject = receiveEndVoteObject
                            }
                    
                            if(order.name === "Werewolves end turn"){
                                let receiveEndTurnObject = order.receiveEndTurnObject
                                
                                sendingData.dead.forEach((d) => {
                                    if(receiveEndTurnObject.hasOwnProperty(d)){
                                        delete receiveEndTurnObject[d]
                                    }
                                })
                                
                    
                                arr[i].receiveEndTurnObject = receiveEndTurnObject
                            } 
                        })

                        //Eliminate dead players from players field
                        sendingData.dead.forEach((deadPlayer) => {
                            players.every((player, index, arr) => {
                                if(player === deadPlayer){
                                    arr.splice(index, 1)
                                    return false
                                }
                                return true
                            })
                        })

                        //sending includes the deaths and silences from the first db call and the updated callingOrder, players from this db call
                        sendingData2 = {
                            sendingData: sendingData,
                            callingOrder: callingOrder,
                            players: players
                        }
                        resolve(sendingData2)
                    }

                    else
                        reject("no such document")
                })
            })
        })
        .then((sendingData2) => {
            //update the callingOrder and players in Rooms collection
            return new Promise ((resolve, reject) => {
                Room.updateOne({'roomid': req.params.roomid}, 
                {$set: {'callingOrder': sendingData2.callingOrder, 'players': sendingData2.players}}, 
                (err, result) => {
                    if(err) return reject(err)

                    if(result !== null){
                        resolve(sendingData2.sendingData)
                    }

                    else
                        reject("no such document")
                })
            })
        })
        .then((response) => {
            //Check if the game is closed by any side has won the game (Human, Werewolves, Piper, Lover if there is a couple of human and werewolf)
            Room.findOne({'roomid': req.params.roomid}, {'callingOrder': 1, 'players': 1, 'totalPlayers': 1, '_id': 0}, (err, result) => {
                if(err) return console.log(err)

                if(result !== null){
                    let callingOrder = result.callingOrder,
                        players = result.players,
                        totalPlayers = result.totalPlayers,
                        humanWon = false,
                        werewolvesWon = false,
                        loversWon = false,
                        piperWon = false

                    //check if the human side wins, only when all werewolves are eliminated
                    callingOrder.every((order, index , arr) => {
                        if(order.name === "Werewolves" && order.player instanceof Array && order.player.length === 0){
                            humanWon = true
                            return false
                        }
                        return true
                    })

                    if(humanWon){
                        res.send('Human won')
                    }

                    //check if werewolves side wins, only when the number of human equals to the number of werewolves, other meaning is when the number
                    //of werewolves is half or more half of the total players
                    else{
                        callingOrder.every((order, index, arr) => {
                            if(order.name === "Werewolves" && order.player instanceof Array && order.player.length >= (Math.ceil(players.length/2))){
                                werewolvesWon = true
                                return false
                            }
                            return true
                        })

                        if(werewolvesWon){
                            res.send('Werewolves won')
                        }

                        //check if piper side wins, only when all the players except the piper get charmed
                        else{
                            //to see if the pied piper is still alive
                            callingOrder.every((order) => {
                                if(order.name === "The pied piper"){
                                    if(order.player instanceof Array && order.player > 0){
                                        //If he does then proceed checking
                                        callingOrder.every((order, index, arr) => {
                                            if(order.name === "The hypnotized" && order.player instanceof Array && order.player.length === (totalPlayers.length-1)){
                                                piperWon = true
                                                return false
                                            }
                                            return true
                                        })
                                    }
                                    return false
                                }
                                return true
                            })

                            if(piperWon){
                                res.send('Piper won')
                            }

                            //check if lover side wins, only when all the players excepts the lovers are eliminated
                            else{
                                if(players instanceof Array && players.length === 2){
                                    callingOrder.every((order, index, arr) => {
                                        if(order.name === "The Lovers" && order.player instanceof Array && order.newSide){
                                            if(players.includes(order.player[0]) && players.includes(order.player[1]))
                                                loversWon = true
        
                                            return false
                                        }
                                        return true
                                    })
                                }

                                if(loversWon){
                                    res.send('Lovers won')
                                }

                                //If not any side has won the game yet, then proceed the round end (morning stage)
                                else{
                                    res.send(response)
                                }
                            }
                        }
                    }
                }
            })
        })
        .catch((err) => {
            //err from rejection
            console.log(err)
        })
    })
})

module.exports = (io) => {

    let rreIO = io.of('/retrieve-round-ends')

    rreIO.setMaxListeners(Infinity)

    rreIO.on('connect', (socket) => {
        socket.on('JoinRoom', roomid => {
            socket.join(roomid)
        })
    })

    return router
}