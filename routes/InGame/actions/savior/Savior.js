var express = require('express');
var router = express.Router();
const mongoose = require('mongoose')

var axios = require('axios')
var mongoUrl = 'mongodb://werewolf_minhchinh_01:Haigay1997@ds057000.mlab.com:57000/werewolf_01'

var roomSchema = require('../../../../mongoose-schema/roomSchema')

var playerSchema = require('../../../../mongoose-schema/playerSchema')

var Room = mongoose.model('Room', roomSchema)

var Player = mongoose.model('Player', playerSchema)

var serverUrl = require('../../../../serverUrl')

router.get('/:roomid/savior-get-last-protected', (req, res, next) => {
    mongoose.connect(mongoUrl, { useNewUrlParser: true })

    var db = mongoose.connection

    db.on('error', console.error.bind(console, 'connection error: '))

    db.once('open', () => {
        //Get the last protected player
        Room.findOne({'roomid': req.params.roomid}, {'callingOrder': 1, '_id': 0}, (err, result) => {
            if(err) return console.log(err)

            if(result !== null){
                let callingOrder = result.callingOrder,
                    lastProtectedPlayer = ''
                
                callingOrder.every((order, index, arr) => {
                    if(order.name === "Savior protect target"){
                        lastProtectedPlayer = order.player
                        return false
                    }
                    return true
                })

                res.send(lastProtectedPlayer)
            }
        })
    })
})

router.post('/:roomid/savior-protect', (req, res, next) => {
    mongoose.connect(mongoUrl, { useNewUrlParser: true })

    var db = mongoose.connection

    db.on('error', console.error.bind(console, 'connection error: '))

    db.once('open', () => {
        //Update Rooms collection's callingOrder with protected player
        var updateRoomProtect = new Promise((resolve, reject) => {
            Room.findOneAndUpdate({'roomid': req.params.roomid}, 
                                    {$set: {"callingOrder.$[element].player": req.body.protectTarget}}, 
                                    {arrayFilters: [{"element.name": 'Savior protect target'}]}, (err, result) => {
                if(err) return reject(err)
                
                if(result !== null){
                    resolve(result)
                }

                else
                    reject('No such result')
            })
        })

        //Update Players collection's status
        var updatePlayerProtect = new Promise((resolve, reject) => {
            //only protect the player with status.dead > 0 and killed by werewolves
            Player.findOne({'username': req.body.protectTarget, 'roomid': req.params.roomid}, {'status': 1, '_id': 0, 'killedByWerewolves': 1},  (err, result) => {
                if(err) return reject(err)

                if(result !== null){
                    let status = result.status,
                        killedByWerewolves = result.killedByWerewolves

                    if(status["dead"] > 0 && killedByWerewolves){
                        status["dead"] -= 1
                        killedByWerewolves = false
                    }

                    //Proceed salvation for the chosen player
                    Player.updateOne({'username': req.body.protectTarget, 'roomid': req.params.roomid}, {$set: {'status': status, 'killedByWerewolves': killedByWerewolves}}, (err, result) => {
                        if(err) return reject (err)

                        if(result !== null){
                            //Find out whether the protected player is in love with anyone else then the lover should be protected as well
                            Room.findOne({'roomid': req.params.roomid}, {'callingOrder': 1, '_id': 0}, (err, result) => {
                                if(err) return reject(err)

                                if(result !== null){
                                    let callingOrder = result.callingOrder,
                                        lover = ''
                                    callingOrder.every((order) => {
                                        if(order.name === "The Lovers"){
                                            if(order.player instanceof Array && order.player.includes(req.body.protectTarget)){
                                                order.player.every((player) => {
                                                    if(player !== req.body.protectTarget){
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
                                        Player.findOneAndUpdate({'roomid': req.params.roomid, 'username': lover, 'status.dead': {$gt: 0}}, {$inc : {'status.dead': -1}}, (err, result) => {
                                            if(err) return reject(err)

                                            if(result !== null){
                                                resolve(result)
                                            }

                                            else
                                                reject('No such result')
                                        })
                                    }

                                    //If not then resolve promise
                                    else
                                        resolve(result)
                                }

                                else
                                    reject('No such result')
                            })
                        }

                        else
                            reject('No such result')
                    })
                }

                else
                    reject('No such result')
            })
        })

        Promise.all([updateRoomProtect, updatePlayerProtect]).then((values) => {
            res.send('ok')
        })
        .catch(err => {
            res.send(err)
            console.log(err)
        })
    })
})

module.exports = (io) => {
    let saviorIO = io.of('/savior')

    saviorIO.setMaxListeners(Infinity)

    const RequestToProtectPlayer = (data, socket) => {
        axios({
            method:'post',
            url: serverUrl + 'in-game/actions/' + data.roomid + '/savior-protect',
            data: data
        })
        .then(res => {
            socket.emit('ProtectedPlayer', res.data)
        })
        .catch(err => {
            console.log(err)
        })
    }
    
    const RequestToGetLastProtectedPlayer = (roomid, socket) => {
        axios({
            method: 'get',
            url: serverUrl + 'in-game/actions/' + roomid + '/savior-get-last-protected'
        })
        .then(res => {
            socket.emit('LastProtectedPlayer', res.data)
        })
        .catch(err => {
            console.log(err)
        })
    }

    saviorIO.on('connect', (socket) => {
        socket.on('RequestToGetLastProtectedPlayer', roomid => {
            RequestToGetLastProtectedPlayer(roomid, socket)
        })
        socket.on('RequestToProtectPlayer', data => {
            RequestToProtectPlayer(data, socket)
        })
    })
    return router
}