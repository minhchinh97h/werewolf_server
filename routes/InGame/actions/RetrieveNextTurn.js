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
        Room.findOne({'roomid': req.params.roomid}, {'callingOrder': 1, '_id': 0}, (err, result) => {
            if(err) return console.log(err)

            if(result !== null){
                let callingOrder = result.callingOrder

                //Sort out not special roles
                let notSpecialRole = callingOrder.filter((order) => {return !order.special || order.name === "current called role"})
                
                notSpecialRole.forEach((order, index) => {
                    if(req.body.role === order.name){
                        if(index < (notSpecialRole.length - 1)){
                            for(let i = index + 1; i < notSpecialRole.length; i++){

                                //Don't get special roles
                                if(notSpecialRole[i].player.length > 0){
                                    
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

//Make sure all the werewolves pressed end turn button before calling the next turn
router.post('/:roomid/retrieve-next-turn-for-werewolves', (req, res, next) => {
    mongoose.connect(mongoUrl, { useNewUrlParser: true })

    var db = mongoose.connection

    db.on('error', console.error.bind(console, 'connection error: '))

    db.once('open', () => { 
        Room.findOne({"roomid": req.params.roomid}, {'callingOrder': 1, '_id': 0}, (err, result) => {
            if(err) return console.log(err)

            if(result !== null){
                let callingOrder = result.callingOrder,
                    werewolvesEndTurnObj

                //Update the werewolves end turn field, change its player property to true
                callingOrder.every((order, index, arr) => {
                    if(order.name === "Werewolves end turn"){
                        arr[index].receiveEndTurnObject[req.body.player] = true
                        return false
                    }

                    return true
                })

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
        rreIO = io.of('/retrieve-round-ends')

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
                    rreIO.in(data.roomid).emit('RoundEnds', res.data)
                })
        })
        .catch(err => console.log(err))
    }

    const getWerewolfEndTurn = (data) => {
        axios({
            method: 'post',
            url: 'http://localhost:3001/in-game/actions/' + data.roomid + '/retrieve-next-turn-for-werewolves',
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
                getWerewolfEndTurn(data)
            }
            else{
                getNextTurn(data)
            }
        })
    })

    return router
}