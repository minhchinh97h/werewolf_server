var express = require('express');
var router = express.Router();
const mongoose = require('mongoose')

var axios = require('axios')
var mongoUrl = 'mongodb://werewolf_minhchinh_01:Haigay1997@ds057000.mlab.com:57000/werewolf_01'

var roomSchema = require('../../../../mongoose-schema/roomSchema')

var Room = mongoose.model('Room', roomSchema)

var serverUrl = require('../../../../serverUrl')

router.post('/:roomid/the-fox-scent', (req, res, next) => {
    mongoose.connect(mongoUrl, { useNewUrlParser: true })

    var db = mongoose.connection

    db.on('error', console.error.bind(console, 'connection error: '))

    db.once('open', () => { 
        Room.findOne( {'roomid': req.params.roomid}, {'callingOrder': 1, '_id': 0 }, (err, result) => {
            if(err) return console.log(err)

            if(result !== null){
                let found = false
                req.body.players.every(name => {
                    result.callingOrder.every(order => {
                        if(order.name === 'Werewolves' || order.name === 'The dog wolf'){
                            order.player.every((player) => {
                                if(player === name){
                                    found = true
                                }

                                if(found)
                                    return false
                                else
                                    return true
                            })
                        }
                        
                        if(found)
                            return false
                        else
                            return true
                    })
                    
                    if(found)
                        return false
                    else
                        return true
                })

                if(found){
                    res.send(true)
                }

                //The fox loses the ability
                else{
                    Room.updateOne({'roomid': req.params.roomid}, {$set: {'callingOrder.$[element].canUseAbility': false}}, {arrayFilters: [{'element.name': 'The fox'}]}, (err, result) => {
                        if(err) return console.log(err)

                        if(result !== null){
                        res.send(false)

                        }
                    })
                }
            }
        })
    })
})

router.get('/:roomid/the-fox-can-use-ability', (req, res, next) => {
    mongoose.connect(mongoUrl, { useNewUrlParser: true })

    var db = mongoose.connection

    db.on('error', console.error.bind(console, 'connection error: '))

    db.once('open', () => { 
        Room.findOne({'roomid': req.params.roomid}, {'callingOrder': 1, '_id': 0}, (err, result) => {
            if(err) return console.log(err)

            if(result !== null){
                let callingOrder = result.callingOrder
                
                callingOrder.every((order) => {
                    if(order.name === "The fox"){
                        res.send(order.canUseAbility)
                        return false
                    }
                    return true
                })
            }
        })
    })
})

module.exports = (io) => {
    let foxIO = io.of('/the-fox')

    foxIO.setMaxListeners(Infinity)

    const requestFoxScent = (data, socket) => {
        axios({
            method: 'post',
            url: serverUrl + 'in-game/actions/' + data.roomid + '/the-fox-scent',
            data: {
                players: data.players
            }
        })
        .then(res => {
            socket.emit('GetScentPlayers', res.data)
        })
        .catch(err => console.log(err))
    }

    const GetCanUseAbility = (roomid, socket) => {
        axios({
            method: 'get',
            url: serverUrl + 'in-game/actions/' + roomid + '/the-fox-can-use-ability'
        })
        .then(res => {
            socket.emit('CanUseAbility', res.data)
        })
        .catch(err => console.log(err))
    }

    foxIO.on('connect', (socket) => {

        socket.on('RequestToScent', data => {
            requestFoxScent(data, socket)
        })

        socket.on('GetCanUseAbility', roomid => {
            GetCanUseAbility(roomid, socket)
        })
    })

    return router
}