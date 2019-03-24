var express = require('express');
var router = express.Router();
const mongoose = require('mongoose')

var axios = require('axios')
var mongoUrl = 'mongodb://werewolf_minhchinh_01:Haigay1997@ds057000.mlab.com:57000/werewolf_01'

var roomSchema = require('../../../../mongoose-schema/roomSchema')

var playerSchema = require('../../../../mongoose-schema/playerSchema')

var Room = mongoose.model('Room', roomSchema)

var Player = mongoose.model('Player', playerSchema)

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
            Player.updateOne({'username': req.body.protectTarget}, {
                $cond: { 
                    if: {$gt: ["$status.dead", 0]},  //only increment the status.dead value when its value is greater than 0 (meaning someone commited killing on the player)
                    then: {$inc: {'status.dead': -1}},
                    else: {$inc: {'status.dead': 0}}
                }
            }, (err, result) => {
                if(err) return reject(err)

                if(result !== null){
                    resolve(result)
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
    saviorIO = io.of('/savior')

    const RequestToProtectPlayer = (data, socket) => {
        axios({
            method:'post',
            url: 'http://localhost:3001/in-game/actions/' + data.roomid + '/savior-protect',
            data: data
        })
        .then(res => {
            socket.emit('ProtectedPlayer', res.data)
        })
        .catch(err => {
            console.log(err)
        })
    }

    saviorIO.on('connect', (socket) => {
        socket.on('RequestToProtectPlayer', data => {
            RequestToProtectPlayer(data, socket)
        })
    })
    return router
}