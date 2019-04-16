var express = require('express');
var router = express.Router();
const mongoose = require('mongoose')

var axios = require('axios')
var mongoUrl = 'mongodb://werewolf_minhchinh_01:Haigay1997@ds057000.mlab.com:57000/werewolf_01'

var roomSchema = require('../../../mongoose-schema/roomSchema')

var Room = mongoose.model('Room', roomSchema)

var playerSchema = require('../../../mongoose-schema/playerSchema')
var Player = mongoose.model('Player', playerSchema)

var serverUrl = require('../../../serverUrl')

//retrieve next turn
router.post('/:roomid/retrieve-next-turn', (req, res, next) => {
    mongoose.connect(mongoUrl, { useNewUrlParser: true })

    var db = mongoose.connection

    db.on('error', console.error.bind(console, 'connection error: '))

    db.once('open', () => { 
        Room.findOne({'roomid': req.params.roomid}, {'callingOrder': 1, '_id': 0}, (err, result) => {
            if(err) return console.log(err)

            if(result !== null){
                let callingOrder = result.callingOrder

                //Sort out not special roles
                let notSpecialRole = callingOrder.filter((order) => {return !order.special})
                
                notSpecialRole.every((order, index) => {
                    if(req.body.role === order.name){
                        if(index < (notSpecialRole.length - 1)){
                            for(let i = index + 1; i < notSpecialRole.length; i++){

                                if(i === notSpecialRole.length - 1) {
                                    if(notSpecialRole[i].player instanceof Array && notSpecialRole[i].player.length === 0){
                                        res.send("round ends")
                                        break
                                    }
                                    else if(notSpecialRole[i].player instanceof Array && notSpecialRole[i].player.length > 0){
                                        //Update current called role
                                        Room.updateOne({'roomid': req.params.roomid},
                                        {$set: {"callingOrder.$[element].role": notSpecialRole[i].name}},
                                        {arrayFilters: [{"element.name": "current called role"}]}, (err, result) => {
                                            if(err) return console.log(err)

                                            if(result !== null){

                                                //Roles that not Werewolves can only be called once per player
                                                if(notSpecialRole[i].name !== "Werewolves"){
                                                    res.send(notSpecialRole[i].player[0])
                                                }
                                                
                                                //For Werewolves, we call all the players at one time
                                                else{
                                                    res.send(notSpecialRole[i].player)
                                                }
                                            }
                                        })

                                        break
                                    }
                                }

                                else{
                                    if(notSpecialRole[i].player instanceof Array && notSpecialRole[i].player.length > 0){
                                        //Update current called role
                                        Room.updateOne({'roomid': req.params.roomid},
                                                        {$set: {"callingOrder.$[element].role": notSpecialRole[i].name}},
                                                        {arrayFilters: [{"element.name": "current called role"}]}, (err, result) => {
                                            if(err) return console.log(err)
    
                                            if(result !== null){
    
                                                //Roles that not Werewolves can only be called once per player
                                                if(notSpecialRole[i].name !== "Werewolves"){
                                                    res.send(notSpecialRole[i].player[0])
                                                }
                                                
                                                //For Werewolves, we call all the players at one time
                                                else{
                                                    res.send(notSpecialRole[i].player)
                                                }
                                            }
                                        })
    
                                        break
                                    }

                                    else{
                                        continue
                                    }
                                }
                            }
                        }
                        
                        else{
                            res.send("round ends")
                        }

                        return false
                    }

                    return true
                })
            }
        })
    })
})

//Make sure all the werewolves pressed end turn button before calling the next turn
router.post('/:roomid/retrieve-next-turn-for-werewolves', (req, res, next) => {
    mongoose.connect(mongoUrl, { useNewUrlParser: true })

    var db = mongoose.connection

    db.on('error', console.error.bind(console, 'connection error: '))

    db.once('open', () => { 
        //Update the werewolves end turn field, change its player property to true
        Room.findOneAndUpdate({'roomid': req.params.roomid}, 
                                {$set: {[`callingOrder.$[element].receiveEndTurnObject.${req.body.player}`]: true}},
                                {arrayFilters: [{"element.name": "Werewolves end turn"}]},
                                (err, result) => {
            if(err) return console.log(err)

            if(result !== null){
                Room.findOne({"roomid": req.params.roomid}, {'callingOrder': 1, '_id': 0}, (err, result) => {
                    if(err) return console.log(err)
        
                    if(result !== null){
                        let callingOrder = result.callingOrder,
                            werewolvesEndTurnObj
                        
                        //Get the werewolves end turn field's receiveEndTurnObject obj to check if all werewolves pressed end turn button
                        callingOrder.every((order, index, arr) => {
                            if(order.name === "Werewolves end turn"){
                                werewolvesEndTurnObj = order.receiveEndTurnObject
                                return false
                            }
        
                            return true
                        })
        
                        let allWerewolvesPressed = true
        
                        for(var player in werewolvesEndTurnObj){
                            if(werewolvesEndTurnObj.hasOwnProperty(player)){
                                if(!werewolvesEndTurnObj[player])
                                    allWerewolvesPressed = false
                            }
                        }
        
                        //Update the new callingOrder with new werewolves end turn 
                        Room.updateOne({"roomid": req.params.roomid}, {$set: {"callingOrder": callingOrder}}, (err, result) => {
                            if(err) return console.log(err)
        
                            if(result !== null){
                                if(allWerewolvesPressed){
                                    res.send('all werewolves pressed')
                                }
                
                                else{
                                    res.send('not all werewolves pressed')
                                }
                            }
                        })
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
                let callingOrder = result.callingOrder,
                    chosenTarget, //chosenTarget from round end target of callingOrder
                    lovers = [],  //array holding players in case chosenTarget is in love with someone else
                    isInLove = false //to determine whether the chosenTarget is in love


                //Get chosenTarget from callingOrder
                callingOrder.every((order, i) => {
                    if(order.name === 'Werewolves current target'){
                        chosenTarget = order.chosen
                        return false
                    }
                    return true
                })

                //Check whether the hanged player is in love with anyone else
                callingOrder.every((order, index) => {
                    if(order.name === "The Lovers"){
                        if(order.player instanceof Array && order.player.includes(chosenTarget)){
                            lovers = order.player.map((p) => {return p})
                            isInLove = true
                        }
                        return false
                    }
                    return true
                })

                if(isInLove){
                    let promises = []

                    lovers.forEach((player, index) => {
                        if(player === chosenTarget)
                            promises.push(
                                new Promise((resolve, reject) => {
                                    //Update the chosenTarget's status in 'Players' collection
                                    Player.findOne({'username': player, 'roomid': req.params.roomid}, {'status': 1, 'killedByWerewolves': 1, '_id': 0}, (err, result) => {
                                        if(err) reject(err)

                                        if(result !== null){
                                            let status = result.status,
                                                killedByWerewolves = result.killedByWerewolves
                                            
                                            if(status["dead"] < 1){
                                                status["dead"] += 1
                                                killedByWerewolves = true
                                            }

                                            Player.updateOne({'username': player, 'roomid': req.params.roomid}, {$set: {'status': status, 'killedByWerewolves': killedByWerewolves}}, (err, result) => {
                                                if(err) reject(err)

                                                if(result !== null){
                                                    resolve(result)
                                                }
                                            })
                                        }
                                    })
                                })
                            )
                        else
                            promises.push(
                                new Promise((resolve, reject) => {
                                    //Update the lover's status in 'Players' collection
                                    Player.findOne({'username': player, 'roomid': req.params.roomid}, {'status': 1, 'killedByWerewolves': 1, '_id': 0}, (err, result) => {
                                        if(err) reject(err)

                                        if(result !== null){
                                            let status = result.status,
                                                killedByWerewolves = result.killedByWerewolves
                                            
                                            if(status["dead"] < 1){
                                                status["dead"] += 1
                                                killedByWerewolves = false
                                            }

                                            Player.updateOne({'username': player, 'roomid': req.params.roomid}, {$set: {'status': status, 'killedByWerewolves': killedByWerewolves}}, (err, result) => {
                                                if(err) reject(err)

                                                if(result !== null){
                                                    resolve(result)
                                                }
                                            })
                                        }
                                    })
                                })
                            )
                    })

                    Promise.all(promises).then((values) => {
                        res.send(chosenTarget)
                    })
                    .catch(err => {
                        console.log(err)
                    })
                }

                //If only the player is killed, not in love with anyone else, then update its status in Players collection
                else{
                    //Update the player's status in 'Players' collection
                    Player.updateOne({'roomid': req.params.roomid, 'username': chosenTarget}, {$set: {'killedByWerewolves': true, 'status.dead': 1}}, (err, result) => {
                        if(err) console.log(err)

                        if(result !== null){
                            res.send(chosenTarget)
                            return false
                        }
                    })
                }
            }
        })
    })
})


module.exports = (io) => {

    let rntIO = io.of('/retrieve-next-turn'),
        wwIO = io.of('/werewolves'),
        rreIO = io.of('/retrieve-round-ends'),
        igIO = io.of('/in-game')

    rntIO.setMaxListeners(Infinity)
    wwIO.setMaxListeners(Infinity)
    rreIO.setMaxListeners(Infinity)
    igIO.setMaxListeners(Infinity)
    
    const getNextTurn = (data) => {
        axios({
            method: 'post',
            url: serverUrl + 'in-game/actions/' + data.roomid + '/retrieve-next-turn',
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
                    url: serverUrl + 'in-game/actions/' + data.roomid + '/retrieve-round-ends'
                })
                .then(res => {
                    if(res.data === "Human won"){
                        igIO.in(data.roomid).emit('GameEnds', res.data)
                    }

                    else if (res.data === "Werewolves won"){
                        igIO.in(data.roomid).emit('GameEnds', res.data)
                    }

                    else if (res.data === "Piper won"){
                        igIO.in(data.roomid).emit('GameEnds', res.data)
                    }

                    else if (res.data === "Lovers won"){
                        igIO.in(data.roomid).emit('GameEnds', res.data)
                    }

                    else{
                        //res.data of GET request is from RetrieveRoundEnds.js and also the joinning room action of reIO
                        rreIO.in(data.roomid).emit('RoundEnds', res.data)
                    }
                })
        })
        .catch(err => console.log(err))
    }

    //For controlling the end turn button, check whether all the werewolves end the turn so can proceed next turn
    const getWerewolfEndTurn = (data) => {
        axios({
            method: 'post',
            url: serverUrl + 'in-game/actions/' + data.roomid + '/retrieve-next-turn-for-werewolves',
            data: data
        })
        .then(res => {
            if(res.data === "all werewolves pressed"){
                getNextTurn(data)
            }
        })
        .catch(err => console.log(err))
    }

    const getFinalKill = (data) => {
        axios({
            method: 'post',
            url: serverUrl + 'in-game/actions/' + data.roomid + '/werewolves-final-kill',
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
                getWerewolfEndTurn(data)
            }
            else{
                getNextTurn(data)
            }
        })
    })

    return router
}