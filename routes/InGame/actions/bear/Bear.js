var express = require('express');
var router = express.Router();
const mongoose = require('mongoose')

var axios = require('axios')
var mongoUrl = 'mongodb://werewolf_minhchinh_01:Haigay1997@ds057000.mlab.com:57000/werewolf_01'

var roomSchema = require('../../../../mongoose-schema/roomSchema')

var Room = mongoose.model('Room', roomSchema)

router.post('/:roomid/bear-scent', (req, res, next) => {
    mongoose.connect(mongoUrl, { useNewUrlParser: true })

    var db = mongoose.connection

    db.on('error', console.error.bind(console, 'connection error: '))

    db.once('open', () => { 
        Room.findOne({'roomid': req.params.roomid}, {'callingOrder': 1, '_id': 0}, (err, result) => {
            if(err) return console.log(err)

            if(result !== null){
                let found = false;

                result.callingOrder.forEach((order, index) => {
                    if(order.name === req.body.player){
                        //find the nearest left player
                        for(let i = index - 1; i >= 0; i--){
                            if(result.callingOrder[i].player.length > 0){
                                if(result.callingOrder[i].name === 'Werewolves'
                                    || result.callingOrder[i].name === 'The dog wolf'
                                    || result.callingOrder[i].name === 'The wild child')
                                {
                                    found = true
                                    break
                                }
                            }
                        }

                        if(found){
                            res.send(true)
                        }

                        else{
                            //find the nearest right player if the current chosen player is not the last player
                            if(index < (result.callingOrder.length - 1)){
                                for(let i = index + 1; i > result.callingOrder; i++){
                                    if(result.callingOrder[i].name === 'Werewolves'
                                        || result.callingOrder[i].name === 'The dog wolf'
                                        || result.callingOrder[i].name === 'The wild child')
                                    {
                                        found = true
                                        break
                                    }
                                }
                            }

                            if(found){
                                res.send(true)
                            }

                            else{
                                res.send(false)
                            }
                        }
                    }
                })
            }
        })
    })
})


module.exports = (io) => {

    let bearIO = io.of(bearIO)

    let ScentPlayer = async (data) => {
        await axios({
            method: 'post',
            url: 'http://localhost:3001/in-game/actions/' + data.roomid + '/bear-scent',
            data: {
                player: data.player
            }
        })
        .then(res => {
            bearIO.emit('ScentPlayer', res.data)
        })
        .catch(err => console.log(err))
    }

    bearIO.on('connect', (socket) => {
        socket.on('RequestToScentPlayer', data => {
            ScentPlayer(data)
        })
    })

    return router
}