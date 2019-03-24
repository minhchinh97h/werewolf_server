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
            //find and update the deaths so that callingOrder only contains alive players in a local variable
            return new Promise((resolve, reject) => {
                Room.findOne({'roomid': req.params.roomid}, {'callingOrder': 1, '_id': 0}, (err, result) => {
                    if(err) return reject(err)
        
                    if(result !== null){
                        let callingOrder = result.callingOrder,
                            sendingData2
        
                        callingOrder.forEach((order, i) => {
                            if(order.player instanceof Array)
                                order.player.forEach((player, index, playerArr) => {
                                    if(sendingData.dead.includes(player) && sendingData.dead instanceof Array)
                                        playerArr.splice(index, 1)
                                })
                        })

                        //sending includes the deaths and silences from the first db call and the updated callingOrder from this db call
                        sendingData2 = {
                            sendingData: sendingData,
                            callingOrder: callingOrder
                        }
                        resolve(sendingData2)
                    }

                    else
                        reject("no such document")
                })
            })
        })
        .then((sendingData2) => {
            //update the local variable callingOrder into Room collection
            return new Promise ((resolve, reject) => {
                Room.updateOne({'roomid': req.params.roomid}, {$set: {'callingOrder': sendingData2.callingOrder}}, (err, result) => {
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
            res.send(response)
        })
        .catch((err) => {
            //err from rejection
            console.log(err)
        })
        
    })
})

module.exports = (io) => {

    let rreIO = io.of('/retrieve-round-ends')

    rreIO.on('connect', (socket) => {
        socket.on('JoinRoom', roomid => {
            socket.join(roomid)
        })
    })

    return router
}