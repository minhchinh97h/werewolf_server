var express = require('express');
var router = express.Router();
const mongoose = require('mongoose')

var axios = require('axios')
var mongoUrl = 'mongodb://werewolf_minhchinh_01:Haigay1997@ds057000.mlab.com:57000/werewolf_01'

var roomSchema = require('../../../../mongoose-schema/roomSchema')

var Room = mongoose.model('Room', roomSchema)

var playerSchema = require('../../../../mongoose-schema/playerSchema')

var Player = mongoose.model('Player', playerSchema)

var serverUrl = require('../../../../serverUrl')

//Kill target
router.post('/:roomid/witch-kill', (req, res, next) => {
    mongoose.connect(mongoUrl, { useNewUrlParser: true })

    var db = mongoose.connection

    db.on('error', console.error.bind(console, 'connection error: '))

    db.once('open', () => { 

        //Update the Room's calling order
        var updateRoomKill = new Promise((resolve, reject) => {
                Room.findOne({'roomid': req.params.roomid}, {'callingOrder': 1, '_id': 0}, (err, result) => {
                    if(err) return reject(err)
        
                    if(result !== null){
                        var callingOrder = result.callingOrder
                        var canKill = false

                        //If the Witch hasn't used Kill potion yet she can kill
                        callingOrder.every((order, index, callingOrder) => {
                            if(order.name === "Witch"){
                                if(!order.useKill){
                                    callingOrder[index].useKill = true //update the useKill to true because she will kill one
                                    canKill = true
                                }

                                return false
                            }

                            return true
                        })

                        if(canKill){
                            //Update the Witch kill target's player
                            callingOrder.every((order, index, callingOrder) => {
                                if(order.name === 'Witch kill target'){
                                    callingOrder[index].player = req.body.target_kill
                                    return false
                                }
            
                                return true
                            })

                            //Update the callingOrder in Rooms collection
                            Room.updateOne({'roomid': req.params.roomid}, {$set: {'callingOrder': callingOrder}}, (err, result) => {
                                if(err) return console.log(err)
            
                                if(result !== null){
                                    resolve("Used Kill Potion")
                                }
    
                                else
                                    reject('No such document')
                            })
                        }

                        else{
                            resolve('No Kill Potion Left')
                        }
                    }

                    else
                        reject('No such document')
                    
            })  
        })   
        
        updateRoomKill.then(result => {
            if(result === "Used Kill Potion"){
                //Check if the player is in love with someone else
                Room.findOne({'roomid': req.params.roomid}, {'callingOrder': 1, '_id': 0}, (err, result) => {
                    if(err) console.log(err)

                    if(result !== null){
                        let callingOrder = result.callingOrder,
                            lovers = []
                        
                        callingOrder.every((order, index) => {
                            if(order.name === "The Lovers"){
                                if(order.player instanceof Array && order.player.includes(req.body.target_kill)){
        
                                    // lovers = order.player // ----> WARNING: CANNOT USE THIS EXPRESSION BECAUSE WHEN ORDER.PLAYER GETS CHANGED, LOVERS WILL GET CHANGED
        
                                    lovers = order.player.map(p => {return p}) // ----> TO INITIALIZE A NEW ARRAY FROM EXISTING ARRAY, USE MAP
                                    isInLove = true
                                }
                                return false
                            }
                            return true
                        })


                        if(lovers.length > 0){ //meaning there is a couple
                            //Update the first lover's status
                            Player.updateOne({'username': lovers[0], 'roomid': req.params.roomid}, {$inc: {'status.dead': 1}}, (err, result) => {
                                if(err) return console.log(err)

                                if(result !== null){
                                    //Update the second lover's status
                                    Player.updateOne({'username': lovers[1], 'roomid': req.params.roomid}, {$inc: {'status.dead': 1}}, (err, result) => {
                                        if(err) return console.log(err)

                                        if(result !== null){
                                            res.send("ok")
                                        }
                                    })
                                }
                            })
                        }

                        else{
                            //Update the player's status
                            Player.updateOne({'username': req.body.target_kill, 'roomid': req.params.roomid}, {$inc: {'status.dead': 1}}, (err, result) => {
                                if(err) return console.log(err)

                                if(result !== null){
                                    res.send("ok")
                                }
                            })
                        }
                    }
                })

                
            }

            else
                res.send(result)
        })
        .catch(err => console.log(err))
    })
})


//Protect target
router.post('/:roomid/witch-protect', (req, res, next) => {
    mongoose.connect(mongoUrl, { useNewUrlParser: true })

    var db = mongoose.connection

    db.on('error', console.error.bind(console, 'connection error: '))

    db.once('open', () => { 
        //Update the Room's calling order
        var updateRoomProtect = new Promise((resolve, reject) => {
            Room.findOne({'roomid': req.params.roomid}, {'callingOrder': 1, '_id': 0}, (err, result) => {
                if(err) return reject(err)
    
                if(result !== null){
                    var callingOrder = result.callingOrder
                    var canProtect = false

                     //If the Witch hasn't used Protect potion yet she can protect
                     callingOrder.every((order, index, callingOrder) => {
                        if(order.name === "Witch"){
                            if(!order.useHeal){
                                callingOrder[index].useHeal = true //update the useKill to true because she will kill one
                                canProtect = true
                            }
                            return false
                        }
                        return true
                    })

                    
                    
                    if(canProtect){
                        callingOrder.every((order, index, callingOrder) => {
                            if(order.name === 'Witch protect target'){
                                callingOrder[index].player = req.body.target_protect
                                return false
                            }
                            return true
                        })

                        Room.updateOne({'roomid': req.params.roomid}, {$set: {'callingOrder': callingOrder}}, (err, result) => {
                            if(err) return console.log(err)
        
                            if(result !== null){
                                resolve("Used Heal Potion")
                            }
                            
                            else
                                reject("No such document")
                        })
                    }
                    
                    else
                        resolve("No Heal Potion Left")
                    
                }

                else
                    reject("No such document")
                
            })
        })
        
        updateRoomProtect.then(result => {
            if(result === 'Used Heal Potion'){
                //Only protect the player with dead > 0
                //Update the player's status in 'Player' collection
                Player.findOne({'username': req.body.target_protect, 'roomid': req.params.roomid}, {'status': 1, '_id': 0, 'killedByWerewolves': 1}, (err, result) => {
                    if(err) return console.log(err)

                    if(result !== null){
                        let status = result.status,
                            killedByWerewolves = result.killedByWerewolves
                        
                        if(status["dead"] > 0){
                            status["dead"] -= 1
                            killedByWerewolves = false
                        }

                        //Proceed healing for chosen player
                        Player.updateOne({'username': req.body.target_protect, 'roomid': req.params.roomid}, {$set: {'status': status, 'killedByWerewolves': killedByWerewolves}}, (err, result) => {
                            if(err) return console.log(err)

                            if(result !== null){
                                //Find out whether the healed player is in love with anyone else then the lover should be protected as well
                                Room.findOne({'roomid': req.params.roomid}, {'callingOrder': 1, '_id': 0}, (err, result) => {
                                    if(err) return console.log(err)

                                    if(result !== null){
                                        let callingOrder = result.callingOrder,
                                            lover = ''

                                        callingOrder.every((order) => {
                                            if(order.name === "The Lovers"){
                                                if(order.player instanceof Array && order.player.includes(req.body.target_protect)){
                                                    order.player.every((player) => {
                                                        if(player !== req.body.target_protect){
                                                            lover = player
                                                            return false
                                                        }
                                                        return true
                                                    })
                                                }
                                                return false
                                            }
                                            return true
                                        })
                                        
                                        //If there is a lover that is connected to the protected player then proceed salvation
                                        if(lover.length > 0){
                                            Player.findOneAndUpdate({'roomid': req.params.roomid, 'username': lover, 'status.dead': {$gt: 0}}, {$inc : {'status.dead': -1}, $set: {'killedByWerewolves': false}}, (err, result) => {
                                                if(err) return reject(err)

                                                if(result !== null){
                                                    res.send('ok')
                                                }
                                            })
                                        }

                                        else
                                            res.send('ok')
                                    }

                                    else
                                        res.send('No document found')
                                })
                            }

                            else
                                res.send('No document found')
                        })
                    }

                    else
                        res.send('No document found')
                })
            }

            else
                res.send(result)
        })
        .catch(err => console.log(err))
    })
})

router.get('/:roomid/witch-left-abilities', (req, res, next) => {
    mongoose.connect(mongoUrl, { useNewUrlParser: true })

    var db = mongoose.connection

    db.on('error', console.error.bind(console, 'connection error: '))

    db.once('open', () => { 
        Room.findOne({'roomid': req.params.roomid}, {'callingOrder': 1, '_id': 0}, (err, result) => {
            if(err) return console.log(err)

            if(result !== null){
                let callingOrder = result.callingOrder

                callingOrder.every((order, index, arr) => {
                    if(order.name === 'Witch'){
                        res.send(order)
                        return false
                    }
                    return true
                })
            }
        })
    })
})

module.exports = (io) => {
    let witchIO = io.of('/witch')

    witchIO.setMaxListeners(Infinity)

    const RequestToKillPlayer = (data, socket) => {
        axios({
            method: 'post',
            url: serverUrl + 'in-game/actions/' + data.roomid + '/witch-kill',
            data: data
        })
        .then((res) => {
            socket.emit('KillPlayer', res.data)
        })
        .catch(err => console.log(err))
    }

    const RequestToProtectPlayer = (data, socket) => {
        axios({
            method: 'post',
            url: serverUrl + 'in-game/actions/' + data.roomid + '/witch-protect',
            data: data
        })
        .then((res) => {
            socket.emit('ProtectPlayer', res.data)
        })
        .catch(err => console.log(err))
    }

    const RequestToRetrieveLeftAbilities = (roomid, socket) => {
        axios({
            method: 'get',
            url: serverUrl + 'in-game/actions/' + roomid + '/witch-left-abilities'
        })
        .then(res => {
            socket.emit('LeftAbilities', res.data)
        })
        .catch(err => console.log(err))
    }

    witchIO.on('connect', (socket) => {
        socket.on('RequestToKillPlayer', data => {
            RequestToKillPlayer(data, socket)
        })

        socket.on('RequestToProtectPlayer', data => {
            RequestToProtectPlayer(data, socket)
        })

        socket.on('RequestToRetrieveLeftAbilities', roomid => {
            RequestToRetrieveLeftAbilities(roomid, socket)
        })
    })

    return router
}