var express = require('express');
var router = express.Router();
const mongoose = require('mongoose')

var axios = require('axios')
var mongoUrl = 'mongodb://werewolf_minhchinh_01:Haigay1997@ds057000.mlab.com:57000/werewolf_01'


var roomSchema = require('../../../../mongoose-schema/roomSchema')

var Room = mongoose.model('Room', roomSchema)

//If a player pressed Vote button, update the vote to round end item to check whether should proceed end voting when all the players voted
router.post('/:roomid/request-hang-player', (req, res, next) => {
    mongoose.connect(mongoUrl, { useNewUrlParser: true })

    var db = mongoose.connection

    db.on('error', console.error.bind(console, 'connection error: '))

    db.once('open', () => { 
        Room.findOne({"roomid": req.params.roomid}, {"callingOrder": 1, "_id": 0}, (err, result) => {
            if(err) return console.log(err)

            if(result !== null){
                let callingOrder = result.callingOrder,
                    receivePressedVotePlayers,
                    allPlayersVoted = true

                callingOrder.every((order, index, arr) => {
                    if(order.name === "round end"){
                        arr[index].receivePressedVotePlayers[req.body.player]
                        return false
                    }
                    return true
                })

                callingOrder.every((order, index, arr) => {
                    if(order.name === "round end"){
                        receivePressedVotePlayers = order.receivePressedVotePlayers
                        return false
                    }
                    return true
                })

                for(var player in receivePressedVotePlayers){
                    if(receivePressedVotePlayers.hasOwnProperty(player)){
                        if(!receivePressedVotePlayers[player])
                            allPlayersVoted = false
                    }
                }


                //Add chosen target into targets property of round end target
                callingOrder.every((order, index, arr) => {
                    if(order.name === 'round end target'){
                        arr[index].targets.push(req.body.chosenPlayer)
                        return false
                    }

                    return true
                })

                //If all players have voted, then we proceed to pick a player from voted players to execute based on their votes
                if(allPlayersVoted){
                    let targets_obj = {}, //to store voted players with their number of votes
                        targets = [] //to store voted players

                    //Get targets_obj and targets
                    callingOrder.every((order, index, arr) => {
                        if(order.name === 'round end target'){
                            targets = order.targets

                            order.targets.forEach((target, index) => {
                                if(targets_obj[target])
                                    targets_obj[target] += 1
                                else
                                targets_obj[target] = 0
                            })

                            return false
                        }
                        return true
                    })

                    let chosenTarget, //chosenTarget is the target with the largest votes, otherwise if all targets have equal number of votes, then we randomly pick one.
                        largestVotes = 0, //The largest number of votes that one has
                        allVotesEqual = false //To determine whether all the voted players has equal votes
                    
                    for(var target in targets_obj){
                        if(targets_obj.hasOwnProperty(target)){
                            //Find the largest number of votes
                            if(targets_obj[target] > largestVotes){
                                largestVotes = targets_obj[target]
                                allVotesEqual = false 
                                chosenTarget = target
                            }

                            //Find if all the numbers of votes are equal
                            else if(targets_obj[target] === largestVotes){
                                allVotesEqual = true
                            }
                        }
                    }

                    //pick randomly from targets array which holds all the chosen players
                    if(allVotesEqual){
                        chosenTarget = targets[Math.floor(Math.random() * (targets.length -1))]
                    }

                    //Update the chosenTarget into round end target of callingOrder
                    callingOrder.every((order, index, arr) => {
                        if(order.name === 'round end target'){
                            arr[index].chosenTarget = chosenTarget
                            return false
                        }
                        return true
                    })

                    
                    //Update callingOrder into Rooms collection
                    Room.updateOne({"roomid": req.params.roomid}, {$set: {"callingOrder": callingOrder}}, (err, result) => {
                        if(err) return console.log(err)

                        if(result !== null){
                            res.send("all players voted")
                        }
                    })
                }

                else{
                    //Update callingOrder into Rooms collection
                    Room.updateOne({"roomid": req.params.roomid}, {$set: {"callingOrder": callingOrder}}, (err, result) => {
                        if(err) return console.log(err)

                        if(result !== null){
                            res.send("not all players voted")
                        }
                    })
                }
            }
        })
    })
})

router.get('/:roomid/request-to-get-hang-player', (req, res, next) => {
    mongoose.connect(mongoUrl, { useNewUrlParser: true })

    var db = mongoose.connection

    db.on('error', console.error.bind(console, 'connection error: '))

    db.once('open', () => { 
        Room.findOne({"roomid": req.params.roomid}, {"callingOrder": 1, "_id": 0}, (err, result) => {
            if(err) return console.log(err)

            if(result !== null){
                let callingOrder = result.callingOrder,
                    chosenTarget, //chosenTarget from round end target of callingOrder
                    lovers = [],  //array holding players in case chosenTarget is in love with someone else
                    isInLove = false, //to determine whether the chosenTarget is in love
                    dead = [] //An array contains all the dead players

                //Get chosenTarget
                callingOrder.every((order, index) => {
                    if(order.name === "round end target"){
                        chosenTarget = order.chosenTarget
                        return false
                    }
                    return true
                })

                //Check whether the hanged player is in love with anyone else
                callingOrder.every((order, index) => {
                    if(order.name === "The Lovers"){
                        if(order.player instanceof Array && order.player.includes(chosenTarget)){
                            lovers = order.player
                            isInLove = true
                        }
                        return false
                    }
                    return true
                })

                if(isInLove){
                    //Eliminate the hanged player and the related lover from callingOrder and update callingOrder
                    lovers.forEach((player) => {
                        EliminateTheHangedPlayerFromCallingInTurn(player)
                    })
                }

                else{
                    //Eliminate the hanged player from callingOrder and update callingOrder
                    EliminateTheHangedPlayerFromCallingInTurn(chosenTarget)
                }

                //Update the callingOrder to Rooms collection
                Room.updateOne({"roomid": req.params.roomid}, {$set: {"callingOrder": callingOrder}}, (err, result) => {
                    if(err) return console.log(err)

                    if(result !== null){
                        res.send(dead)
                    }
                })
            }
        })
    })
})

function EliminateTheHangedPlayerFromCallingInTurn(chosenTarget){
    dead.push(chosenTarget)
    callingOrder.forEach((order, index) => {
        if(!order.special && order.player instanceof Array){
            order.player.forEach((player, i, playerArr) => {
                if(player === chosenTarget)
                    playerArr.splice(i, 1)
            })
        }
    })
}

module.exports = (io) => {

    let reIO = io.of('/round-end')

    reIO.setMaxListeners(Infinity)

    //inside requestToHangPlayer, we calculate the chosenTarget which is the final hanged player and update to the database
    const requestToHangPlayer = (data) => {
        axios({
            method: 'post',
            url: 'http://localhost:3001/in-game/actions/' + data.roomid + '/request-hang-player',
            data: data
        })
        .then(res => {
            //Make axios call to get the executed player and also make calculation to eliminate the player (and also related lover) from callingOrder
            if(res.data ===  "all players voted"){
                axios({
                    method: 'get',
                    url: 'http://localhost:3001/in-game/actions/' + data.roomid + '/request-to-get-hang-player',
                })
                .then(res => {
                    //Returning an array of dead players
                    reIO.in(data.roomid).emit("BroadcastREDeadPlayers", res.data)
                })
            }
        })
        .catch(err => console.log(err))
    }

    reIO.on('connect', socket => {
        socket.on('JoinRoom', roomid => {
            socket.join(roomid)
        })

        socket.on('BroadCastMyChoice', data => {
            reIO.in(data.roomid).emit('GetOtherChoices', data)
        })

        socket.on('RequestToHangPlayer', data => {
            requestToHangPlayer(data)
        })
    })

    return router
}