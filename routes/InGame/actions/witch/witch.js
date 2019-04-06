var express = require('express');
var router = express.Router();
const mongoose = require('mongoose')

var axios = require('axios')
var mongoUrl = 'mongodb://werewolf_minhchinh_01:Haigay1997@ds057000.mlab.com:57000/werewolf_01'

var roomSchema = require('../../../../mongoose-schema/roomSchema')

var Room = mongoose.model('Room', roomSchema)

var playerSchema = require('../../../../mongoose-schema/playerSchema')

var Player = mongoose.model('Player', playerSchema)

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
                //Update the player's status in 'Player' collection
                    Player.updateOne({'roomid': req.params.roomid, 'username': req.body.target_kill}, {
                        $inc: {'status.dead': 1}
                    }, (err, result) => {
                        if(err) return reject(err)

                        if(result !== null){
                            res.send('ok')
                        }

                        else
                            res.send('No document found')
                    })
            }

            else
                res.send(result)
        })
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
                Player.findOne({'username': req.body.target_protect}, {'status': 0, '_id': 0}, (err, result) => {
                    if(err) return reject(err)

                    if(result !== null){
                        let status = result.status

                        if(status["dead"] > 0){
                            status["dead"] -= 1
                        }

                        Player.updateOne({'username': req.body.target_protect}, {$set: {'status': status}}, (err, result) => {
                            if(err) return reje(err)

                            if(result !== null){
                                console.log(result)
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

    const RequestToKillPlayer = (data, socket) => {
        axios({
            method: 'post',
            url: 'http://localhost:3001/in-game/actions/' + data.roomid + '/witch-kill',
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
            url: 'http://localhost:3001/in-game/actions/' + data.roomid + '/witch-protect',
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
            url: 'http://localhost:3001/in-game/actions/' + roomid + '/witch-left-abilities'
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