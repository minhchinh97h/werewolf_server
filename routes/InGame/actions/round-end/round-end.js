var express = require('express');
var router = express.Router();
const mongoose = require('mongoose')

var axios = require('axios')
var mongoUrl = 'mongodb://werewolf_minhchinh_01:Haigay1997@ds057000.mlab.com:57000/werewolf_01'


var roomSchema = require('../../../../mongoose-schema/roomSchema')

var Room = mongoose.model('Room', roomSchema)

var serverUrl = require('../../../../serverUrl')

//If a player pressed Vote button, update the vote to round end item to check whether should proceed end voting when all the players voted
router.post('/:roomid/request-hang-player', (req, res, next) => {
    
    mongoose.connect(mongoUrl, { useNewUrlParser: true })

    var db = mongoose.connection

    db.on('error', console.error.bind(console, 'connection error: '))

    db.once('open', () => { 
        //Update receivePressedVotePlayers's according player to true because the player has voted
        Room.findOneAndUpdate({"roomid": req.params.roomid}, 
                                {$set: {[`callingOrder.$[element].receivePressedVotePlayers.${req.body.player}`]: true}},
                                {arrayFilters: [{"element.name": "round end"}]}, (err, result) => {
            
            if(err) return console.log(err)

            if(result !== null){
                //Add chosen target into targets property of round end target
                Room.findOneAndUpdate({"roomid": req.params.roomid}, 
                                        {$push: {"callingOrder.$[element].targets" : req.body.chosenPlayer}},
                                        {arrayFilters: [{"element.name": "round end target"}]}, (err, result) => {


                    if(err) return console.log(err)

                    if(result !== null){
                        Room.findOne({"roomid": req.params.roomid}, {"callingOrder": 1, "_id": 0}, (err, result) => {
                            if(err) return console.log(err)

                            if(result !== null){
                                let callingOrder = result.callingOrder,
                                    receivePressedVotePlayers,
                                    allPlayersVoted = true

                                //Retrieve receivePressedVotePlayers to see whether all players have voted
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
                
                                //If all players have voted, then we proceed to pick a player from voted players to execute based on their votes
                                if(allPlayersVoted){
                                    let targets_obj = {}, //to store voted players with their number of votes
                                        targets = [] //to store voted players
                
                                    //Get targets_obj and targets
                                    callingOrder.every((order, index, arr) => {
                                        if(order.name === 'round end target'){
                                            targets = order.targets
                
                                            order.targets.forEach((target, index) => {
                                                if(targets_obj.hasOwnProperty(target))
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
                                    Room.findOneAndUpdate({"roomid": req.params.roomid}, 
                                                            {$set: {"callingOrder.$[element].chosenTarget": chosenTarget}},
                                                            {arrayFilters: [{"element.name": "round end target"}]}, (err, result) => {
                                        if(err) return console.log(err)

                                        if(result !== null){
                                            res.send("all players voted")
                                        }
                                    })
                                }
                
                                else{
                                    res.send("not all players voted")
                                }
                            }
                        })
                    }
                })
            }   
        })
    })
})

router.get('/:roomid/request-to-get-hang-player', (req, res, next) => {
    mongoose.connect(mongoUrl, { useNewUrlParser: true })

    var db = mongoose.connection

    db.on('error', console.error.bind(console, 'connection error: '))

    db.once('open', () => { 
        Room.findOne({"roomid": req.params.roomid}, {"callingOrder": 1, "_id": 0, "players": 1}, (err, result) => {
            if(err) return console.log(err)

            if(result !== null){
                let callingOrder = result.callingOrder,
                    chosenTarget, //chosenTarget from round end target of callingOrder
                    lovers = [],  //array holding players in case chosenTarget is in love with someone else
                    isInLove = false, //to determine whether the chosenTarget is in love
                    dead = [], //An array contains all the dead players,
                    players = result.players //An array contains all current players
                
                //Get chosenTarget
                callingOrder.every((order, index) => {
                    if(order.name === "round end target"){
                        chosenTarget = order.chosenTarget
                        return false
                    }
                    return true
                })

                //If there is an actual chosen target meaning someone has voted
                if(chosenTarget.length > 0){

                }
                //Meaning the voting round is ended without any attempts from players to vote, then we randomly pick one player from the player pool.
                else{
                    chosenTarget = players[Math.floor(Math.random() * (players.length -1))]
                }

                //Check whether the hanged player is in love with anyone else
                callingOrder.every((order, index) => {
                    if(order.name === "The Lovers"){
                        if(order.player instanceof Array && order.player.includes(chosenTarget)){

                            // lovers = order.player // ----> WARNING: CANNOT USE THIS EXPRESSION BECAUSE WHEN ORDER.PLAYER GETS CHANGED, LOVERS WILL GET CHANGED

                            lovers = order.player.map(p => {return p}) // ----> TO INITIALIZE A NEW ARRAY FROM EXISTING ARRAY, USE MAP
                            isInLove = true
                        }
                        return false
                    }
                    return true
                })

                if(isInLove){
                    //Eliminate the hanged player and the related lover from callingOrder, players and update callingOrder, players
                    dead = lovers

                    callingOrder = EliminateTheHangedPlayerFromCallingInTurn(lovers[0], callingOrder)
                    players = EliminateTheHangedPlayerFromPlayers(lovers[0], players, lovers)

                    callingOrder = EliminateTheHangedPlayerFromCallingInTurn(lovers[1], callingOrder)
                    players = EliminateTheHangedPlayerFromPlayers(lovers[1], players)

                }

                else{
                    //Eliminate the hanged player and the related lover from callingOrder, players and update callingOrder, players
                    dead.push(chosenTarget)
                    callingOrder = EliminateTheHangedPlayerFromCallingInTurn(chosenTarget, callingOrder)
                    players = EliminateTheHangedPlayerFromPlayers(chosenTarget, players)
                }

                //Update the callingOrder to Rooms collection
                Room.updateOne({"roomid": req.params.roomid}, {$set: {"callingOrder": callingOrder, "players": players}}, (err, result) => {
                    if(err) return console.log(err)

                    if(result !== null){
                        res.send(dead)
                    }
                })
            }
        })
    })
})

function EliminateTheHangedPlayerFromCallingInTurn(chosenTarget, callingOrder){
    callingOrder.forEach((order, index, arr) => {
        if(order.player instanceof Array && order.name !== "The hypnotized"){
            order.player.every((player, i, playerArr) => {
                if(player === chosenTarget){
                    playerArr.splice(i, 1)
                    return false
                }
                return true
            })
        }

        if(order.name === "round end"){
            let receivePressedVotePlayers = order.receivePressedVotePlayers

            if(receivePressedVotePlayers.hasOwnProperty(chosenTarget)){
                delete receivePressedVotePlayers[chosenTarget]
            }

            arr[index].receivePressedVotePlayers = receivePressedVotePlayers

        }

        if(order.name === "end round action"){
            let player = order.player

            if(player.hasOwnProperty(chosenTarget)){
                delete player[chosenTarget]
            }

            arr[index].player = player
        }

        if(order.name === "Werewolves end vote"){
            let receiveEndVoteObject = order.receiveEndVoteObject

            if(receiveEndVoteObject.hasOwnProperty(chosenTarget)){
                delete receiveEndVoteObject[chosenTarget]
            }

            arr[index].receiveEndVoteObject = receiveEndVoteObject
        }

        if(order.name === "Werewolves end turn"){
            let receiveEndTurnObject = order.receiveEndTurnObject

            if(receiveEndTurnObject.hasOwnProperty(chosenTarget)){
                delete receiveEndTurnObject[chosenTarget]
            }

            arr[index].receiveEndTurnObject = receiveEndTurnObject
        } 
    })

    return callingOrder
}


function EliminateTheHangedPlayerFromPlayers(chosenPlayer, players){
    players.every((player, index, arr) => {
        if(player === chosenPlayer){
            arr.splice(index, 1)
            return false
        }
        return true
    })

    return players
}

router.post('/:roomid/request-to-end-round', (req, res, next) => {

    mongoose.connect(mongoUrl, { useNewUrlParser: true })

    var db = mongoose.connection

    db.on('error', console.error.bind(console, 'connection error: '))

    db.once('open', () => { 
        //Update the player in end round action's player obj to true indicating that the player has pressed the end round button
        Room.findOneAndUpdate({'roomid': req.params.roomid},
                                {$set: {[`callingOrder.$[element].player.${req.body.player}`]: true}},
                                {arrayFilters: [{'element.name': 'end round action'}]},
                                (err, result) => {
            if(err) return console.log(err)

            if(result !== null){
                Room.findOne({'roomid': req.params.roomid}, {'callingOrder': 1, '_id': 0, 'players': 1, 'totalPlayers': 1}, (err, result) => {
                    if (err) return console.log(err)

                    if(result !== null){
                        let callingOrder = result.callingOrder,
                            players = result.players,
                            totalPlayers = result.totalPlayers
                            allPlayersPressedEndRoundButton = true

                        //To check whether all the players have pressed the end round button in order to proceed next round 
                        callingOrder.every((order) => {
                            if(order.name === "end round action"){
                                for(var key in order.player){
                                    if(order.player.hasOwnProperty(key)){
                                        if(!order.player[key]){
                                            allPlayersPressedEndRoundButton = false
                                            return false
                                        }
                                    }
                                }
                            }
                            return true
                        })

                        //If all players have pressed, then check if the game is closed or not
                        if(allPlayersPressedEndRoundButton){
                            let humanWon = false,
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

                                        //If not any side has won the game yet, reset round end's, round end target's, end round action's, Werewolves current target's,
                                        //Werewolves end turn's, Werewolves end vote's, etc
                                        else{
                                            callingOrder.forEach((order, index, arr) => {
                                                if(order.name === "round end"){
                                                    let receivePressedVotePlayers = order.receivePressedVotePlayers
                                                    for(var key in receivePressedVotePlayers){
                                                        if(receivePressedVotePlayers.hasOwnProperty(key)){
                                                            receivePressedVotePlayers[key] = false
                                                        }
                                                    }
                                                    arr[index].receivePressedVotePlayers = receivePressedVotePlayers
                                                }

                                                else if(order.name === "round end kill decisions"){
                                                    arr[index].killDecisionsObject = {}
                                                }

                                                else if(order.name === "round end target"){
                                                    arr[index].targets.length = 0
                                                    arr[index].chosenTarget = ''
                                                }

                                                else if(order.name === "end round action"){
                                                    let player = order.player

                                                    for(var key in player){
                                                        if(player.hasOwnProperty(key)){
                                                            player[key] = false
                                                        }
                                                    }

                                                    arr[index].player = player
                                                }

                                                else if (order.name === "Werewolves end vote"){
                                                    let receiveEndVoteObject = order.receiveEndVoteObject
                                                    for(var key in receiveEndVoteObject){
                                                        if(receiveEndVoteObject.hasOwnProperty(key)){
                                                            receiveEndVoteObject[key] = false
                                                        }
                                                    }
                                                    arr[index].receiveEndVoteObject = receiveEndVoteObject
                                                }

                                                else if(order.name === "Werewolves end turn"){
                                                    let receiveEndTurnObject = order.receiveEndTurnObject
                                                    for(var key in receiveEndTurnObject){
                                                        if(receiveEndTurnObject.hasOwnProperty(key)){
                                                            receiveEndTurnObject[key] = false
                                                        }
                                                    }
                                                    arr[index].receiveEndTurnObject = receiveEndTurnObject
                                                }
                                                
                                                else if(order.name === "Werewolves current target"){
                                                    arr[index].player.length = 0
                                                    arr[index].chosen = ''
                                                }

                                                else if (order.name === "Werewolves vote target"){
                                                    arr[index].werewolvesTargetObject = {}
                                                }

                                                else if (order.name === "Werewolves agree on kill"){
                                                    arr[index].agreeOnKillObject = {}
                                                }
                                            })

                                            Room.updateOne({'roomid': req.params.roomid}, {$set: {'callingOrder': callingOrder}}, (err, result) => {
                                                if(err) return console.log(err)

                                                if(result !== null){
                                                    res.send('Start new round')
                                                }
                                            })
                                        }
                                    }
                                }
                            }
                        }

                        else{
                            res.send('Not all players end round')
                        }
                    }
                })
            }
        })
    })
})



router.post('/:roomid/round-end-store-my-choice', (req, res, next) => {
    mongoose.connect(mongoUrl, { useNewUrlParser: true })

    var db = mongoose.connection

    db.on('error', console.error.bind(console, 'connection error: '))

    db.once('open', () => { 
        Room.findOneAndUpdate({'roomid': req.params.roomid},
                                {$set: {[`callingOrder.$[element].killDecisionsObject.${req.body.player}`] : req.body.chosenPlayer}},
                                {arrayFilters: [{'element.name': 'round end kill decisions'}]}, (err, result) => {
            if(err) return console.log(err)

            if(result !== null){
                res.send('ok')
            }
        })
    })
})

router.get('/:roomid/round-end-get-other-choices', (req, res, next) => {
    mongoose.connect(mongoUrl, { useNewUrlParser: true })

    var db = mongoose.connection

    db.on('error', console.error.bind(console, 'connection error: '))

    db.once('open', () => { 
        Room.findOne({'roomid': req.params.roomid}, {'callingOrder': 1, '_id': 0}, (err, result) => {
            if(err) return console.log(err)

            if(result !== null){
                let callingOrder = result.callingOrder

                callingOrder.every((order) => {
                    if(order.name === "round end kill decisions"){
                        res.send(order.killDecisionsObject)
                        return false
                    } 
                    return true
                })
            }
        })
    })
})

module.exports = (io) => {

    let reIO = io.of('/round-end'),
        igIO = io.of('/in-game')

    reIO.setMaxListeners(Infinity)
    igIO.setMaxListeners(Infinity)
    
    //inside requestToHangPlayer, we calculate the chosenTarget which is the final hanged player and update to the database
    const requestToHangPlayer = (data) => {
        axios({
            method: 'post',
            url: serverUrl + 'in-game/actions/' + data.roomid + '/request-hang-player',
            data: data
        })
        .then(res => {
            //Make axios call to get the executed player and also make calculation to eliminate the player (and also related lover) from callingOrder
            if(res.data ===  "all players voted"){
                axios({
                    method: 'get',
                    url: serverUrl + 'in-game/actions/' + data.roomid + '/request-to-get-hang-player',
                })
                .then(res => {
                    //Returning an array of dead players
                    reIO.in(data.roomid).emit("BroadcastREDeadPlayers", res.data)
                })
            }
        })
        .catch(err => console.log(err))
    }

    const RequestToEndRound = (data) => {
        axios({
            method: 'post',
            url: serverUrl + 'in-game/actions/' + data.roomid + '/request-to-end-round',
            data: data
        })
        .then(res => {
            if(res.data === "Start new round"){
                igIO.in(data.roomid).emit('StartNewRound', res.data)
            }

            else if(res.data !== "Start new round" && res.data !== "Not all players end round"){
                igIO.in(data.roomid).emit('GameEnds', res.data)
            }
        })
        .catch(err => console.log(err))
    }

    const RequestToStoreMyChoice = (data) => {
        axios({
            method: 'post',
            url: serverUrl + 'in-game/actions/' + data.roomid + '/round-end-store-my-choice',
            data: data
        })
        .then(res => {
            if(res.data === 'ok')
                reIO.in(data.roomid).emit('GetOtherChoices', data)

        })
        .catch(err => console.log(err))
    }

    const RequestToGetOtherChoices = (roomid, socket) => {
        axios({
            method: 'get',
            url: serverUrl + 'in-game/actions/' + roomid + '/round-end-get-other-choices'
        })
        .then(res => {
            socket.emit('OtherKillDecisions', res.data)
        })
        .catch(err => console.log(err))
    }   

    reIO.on('connect', socket => {
        socket.on('JoinRoom', roomid => {
            socket.join(roomid)
        })

        socket.on('BroadCastMyChoice', data => {
            RequestToStoreMyChoice(data)
        })

        socket.on('RequestToGetOtherChoices', roomid => {
            RequestToGetOtherChoices(roomid, socket)
        })

        socket.on('RequestToHangPlayer', data => {
            requestToHangPlayer(data)
        })

        socket.on('RequestToEndRound', data => {
            RequestToEndRound(data)
        })

    })

    return router
}