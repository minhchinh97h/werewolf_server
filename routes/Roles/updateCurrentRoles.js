var express = require('express');
var router = express.Router();
const mongoose = require('mongoose')

var axios = require('axios')
var mongoUrl = 'mongodb://werewolf_minhchinh_01:Haigay1997@ds057000.mlab.com:57000/werewolf_01'

var roomSchema = require('../../mongoose-schema/roomSchema')

var Room = mongoose.model('Room', roomSchema)

var serverUrl = require('../../serverUrl')

router.post('/:roomid', (req, res, next) => {
    mongoose.connect(mongoUrl, { useNewUrlParser: true })

    var db = mongoose.connection

    db.on('error', console.error.bind(console, 'connection error: '))

    db.once('open', () => {
        Room.updateOne({'roomid': req.params.roomid}, { $set: {'currentRoles': req.body.currentRoles}}, (err, result) => {
            if(err) return console.log(err)

            if(result !== null)
                res.send('ok')
            else
                res.send('not ok')

        })
    })
})

router.get('/:roomid', (req, res, next) => {
    mongoose.connect(mongoUrl, { useNewUrlParser: true })

    var db = mongoose.connection

    db.on('error', console.error.bind(console, 'connection error: '))

    db.once('open', () => {
        Room.findOne({'roomid': req.params.roomid}, {'currentRoles': 1, '_id': 0}, (err, result) => {
            if(err) return console.log(err)

            res.send(result.currentRoles)

        })
    })
})

module.exports = (io) => {
    let submitCurrentRolesIO = io.of('/submit-selected-cards')
    let getCurrentRolesIO = io.of('/get-current-roles')

    submitCurrentRolesIO.setMaxListeners(Infinity)
    getCurrentRolesIO.setMaxListeners(Infinity)
    
    const updateCurrentRoles = async (data) => {
        await axios({
            method: 'post',
            url: serverUrl + 'update-current-roles/' + data.roomid,
            data: {
                currentRoles: data.currentRoles
            }
        })
        .then(res => {
            if(res.data === "ok"){
                getCurrentRoles(data.roomid)
            }
        })
        .catch(err => console.log(err))
    }

    const getCurrentRoles = async (roomid) => {
        await axios({
            method: 'get',
            url: serverUrl + 'update-current-roles/' + roomid
        })
        .then(res => {
            getCurrentRolesIO.in(roomid).emit('GetSelectedCards', res.data)
        })
        .catch(err => console.log(err))
    }

    submitCurrentRolesIO.on('connect', socket => {
        socket.on('JoinRoom', data => {
            socket.join(data.roomid)
            updateCurrentRoles(data)
        })
    })

    getCurrentRolesIO.on('connect', socket => {
        socket.on('JoinRoom', data => {
            socket.join(data)   
            getCurrentRoles(data)
        })
    })
    return router
}