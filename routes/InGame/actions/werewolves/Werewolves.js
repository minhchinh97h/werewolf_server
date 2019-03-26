var express = require('express');
var router = express.Router();
const mongoose = require('mongoose')

var axios = require('axios')
var mongoUrl = 'mongodb://werewolf_minhchinh_01:Haigay1997@ds057000.mlab.com:57000/werewolf_01'

var roomSchema = require('../../../../mongoose-schema/roomSchema')

var Room = mongoose.model('Room', roomSchema)

//Push chosen target of each werewolve in to the database
router.post('/:roomid/werewolves-agree', (req, res, next) => {
    mongoose.connect(mongoUrl, { useNewUrlParser: true })

    var db = mongoose.connection

    db.on('error', console.error.bind(console, 'connection error: '))

    db.once('open', () => {
        Room.findOne({'roomid': req.params.roomid}, {'callingOrder': 1, '_id': 0}, (err, result) => {
            if(err) return console.log(err)

            if(result !== null){
                var callingOrder = result.callingOrder

                //Randomly chose one from the target pool
                callingOrder.every((order, index, callingOrder) => {
                    if(order.name === "Werewolves current target"){
                        callingOrder[index].player.push(req.body.choseTarget)

                        var chosenIndex = Math.floor(Math.random() * (callingOrder[index].player.length - 1))
                        var chosenTarget = callingOrder[index].player[chosenIndex]

                        callingOrder[index].chosen = chosenTarget

                        return false
                    }

                    return true
                })

                //Update the callingOrder which holds the name of the kill target of werewolves
                Room.updateOne({'roomid': req.params.roomid}, {$set: {'callingOrder': callingOrder}}, (err, result) => {
                    if(err) return console.log(err)

                    if(result !== null){
                        res.send('ok')
                    }
                })
            }
        })
    })
})

//Get all the werewolves
router.get('/:roomid/werewolves-get', (req, res, next) => {
    mongoose.connect(mongoUrl, { useNewUrlParser: true })

    var db = mongoose.connection

    db.on('error', console.error.bind(console, 'connection error: '))

    db.once('open', () => {
        Room.findOne({"roomid": req.params.roomid}, {'callingOrder': 1, '_id': 0}, (err, result) => {
            if(err) return console.log(err)

            if(result !== null){
                result.callingOrder.every((order) => {
                    if(order.name === "Werewolves"){
                        res.send(order.player)
                        return false
                    }

                    return true
                })
            }
        })
    })
})


module.exports = (io) => {
    let wwIO = io.of('/werewolves')

    wwIO.setMaxListeners(Infinity)

    const RequestToAgree = (data, socket) => {
        axios({
            method: 'post',
            url: 'http://localhost:3001/in-game/actions/' + data.roomid + '/werewolves-agree',
            data: data
        })
        .then((res) => {
            socket.emit('ConfirmKillRespond', res.data)
        })
        .catch(err => {
            console.log(err)
        })
    }

    const GetOtherWerewolves = (roomid, socket) => {
        axios({
            method: 'get',
            url: 'http://localhost:3001/in-game/actions/' + roomid + '/werewolves-get'
        })
        .then((res) => {
            socket.emit('GetOtherWerewolves', res.data)
        })
        .catch(err => {
            console.log(err)
        })
    }

    wwIO.on('connect', (socket) => {
        socket.on('JoinRoom', roomid => {
            socket.join(roomid)
        })
        
        socket.on('RequestToGetOtherWerewolves', data => {
            GetOtherWerewolves(data, socket)
        })

        socket.on('RequestMyChoice', data => {
            wwIO.in(data.roomid).emit('OtherChoices', data)
        })

        socket.on('RequestToAgreeKill', data => {
            RequestToAgree(data, socket)
        })
    })

    return router
}