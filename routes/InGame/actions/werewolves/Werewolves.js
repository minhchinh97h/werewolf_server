var express = require('express');
var router = express.Router();
const mongoose = require('mongoose')

var axios = require('axios')
var mongoUrl = 'mongodb://werewolf_minhchinh_01:Haigay1997@ds057000.mlab.com:57000/werewolf_01'

var roomSchema = require('../../../../mongoose-schema/roomSchema')

var playerSchema = require('../../../../mongoose-schema/playerSchema')

var Room = mongoose.model('Room', roomSchema)

var Player = mongoose.model('Player', playerSchema)

//Push chosen target of each werewolve in to the database
router.post(':roomid/werewolves-agree', (req, res, next) => {
    mongoose.connect(mongoUrl, { useNewUrlParser: true })

    var db = mongoose.connection

    db.on('error', console.error.bind(console, 'connection error: '))

    db.once('open', () => { 
        Room.find({'roomid': req.params.roomid}, {'callingOrder': 1, '_id': 0}, (err, result) => {
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



module.exports = (io) => {
    let wwIO = io.of('/werewolves')

    const RequestToAgree = async (data) => {
        await axios({
            method: 'post',
            url: 'http://localhost:3001/in-game/actions/' + data.roomid + '/werewolves-agree',
            data: data
        })
        .then((res) => {
            wwIO.in(data.roomid).emit('ConfirmKillRespond', res.data)
        })
    }

    wwIO.on('connect', (socket) => {
        socket.on('JoinRoom', roomid => {
            socket.join(roomid)
        })
        
        socket.on('RequestMyChoice', data => {
            wwIO.in(data.roomid).emit('OtherChoices', data)
        })

        socket.on('RequestToAgreeKill', data => {
            RequestToAgree(data)
        })
    })

    return router
}