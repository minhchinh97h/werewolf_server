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

                        callingOrder.every((order, index, callingOrder) => {
                            if(order.name === 'Witch kill target' && order.useKill === false){
                                callingOrder.player = req.body.target_kill
                                callingOrder.useKill = true
                                canKill = true
                                return false
                            }
        
                            return true
        
                        })
                        
                        if(canKill){
                            Room.updateOne({'roomid': req.params.roomid}, {$set: {'callingOrder': callingOrder}}, (err, result) => {
                                if(err) return console.log(err)
            
                                if(result !== null){
                                    resolve(result)
                                }
    
                                else
                                    reject('No such document')
                            })
                        }

                        else
                            reject('No Kill Potion Left!')
                        
                    }

                    else
                        reject('No such document')
                    
            })  
        })   
        
        //Update the player's status in 'Player' collection
        var updatePlayerKill = new Promise((resolve, reject) => {
            Player.updateOne({'roomid': req.params.roomid, 'username': req.body.target_kill}, {$inc: {'status.dead': 1}}, (err, result) => {
                if(err) return reject(err)

                if(result !== null){
                    resolve(result)
                }
                else
                    reject('No such document')
            })
        })

        Promise.all([updateRoomKill, updatePlayerKill]).then((values) => {
            // var receiveAll = true

            // values.every((value, i) => {
            //     if(value === null){
            //         receiveAll = false
            //         return false
            //     }
            //     return true
            // })
            

            // if(receiveAll)
            //     res.send('ok')
            // else

            res.send('ok')
        })
        .catch((err) => {
            res.send('not ok')
            console.log(err)
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

                    callingOrder.every((order, index, callingOrder) => {
                        if(order.name === 'Witch protect target' && order.useHeal === false){
                            callingOrder.player = req.body.target_protect
                            callingOrder.useHeal = true
                            canProtect = true

                            return false
                        }
    
                        return true
    
                    })
                    
                    if(canProtect){
                        Room.updateOne({'roomid': req.params.roomid}, {$set: {'callingOrder': callingOrder}}, (err, result) => {
                            if(err) return console.log(err)
        
                            if(result !== null){
                                resolve(result)
                            }
                            
                            else
                                reject("No such document")
                        })
                    }
                    
                    else
                        reject("No Heal Potion Left!")
                    
                }

                else
                    reject("No such document")
                
            })
        })
        
        //Update the player's status in 'Player' collection
        var updatePlayerProtect = new Promise((resolve, reject) => {
            Player.updateOne({'roomid': req.params.roomid, 'username': req.body.target_protect}, {$inc: {'status.dead': -1}}, (err, result) => {
                if(err) return reject(err)

                if(result !== null){
                    resolve(result)
                }

                else
                    reject('No such document')
            })
        })

        Promise.all([updateRoomProtect, updatePlayerProtect]).then((values) => {
            res.send('ok')
        })
        .catch(err => {
            res.send('err')
            console.log(err)
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

    witchIO.on('connect', (socket) => {
        socket.on('RequestToKillPlayer', data => {
            RequestToKillPlayer(data, socket)
        })

        socket.on('RequestToProtectPlayer', data => {
            RequestToProtectPlayer(data, socket)
        })
    })

    return router
}