var express = require('express');
var router = express.Router();
const mongoose = require('mongoose')

var axios = require('axios')
var mongoUrl = 'mongodb://werewolf_minhchinh_01:Haigay1997@ds057000.mlab.com:57000/werewolf_01'

var roomSchema = require('../../mongoose-schema/roomSchema')

var Room = mongoose.model('Room', roomSchema)

router.post('/:roomid', (req, res, next) => {
    mongoose.connect(mongoUrl, { useNewUrlParser: true })

    var db = mongoose.connection

    db.on('error', console.error.bind(console, 'connection error: '))

    db.once('open', () => {
        Room.updateOne({'roomid': req.params.roomid}, { $set: { 'recommendedRoles': req.body.rolesLimit } }, (err, result) => {
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
        Room.findOne( {'roomid': req.params.roomid}, {'recommendedRoles': 1, '_id': 0}, (err, result) => {
            if(err) return console.log(err)

            res.send(result)

        } )
    })
})


module.exports = (io) => {
    let updateRolesLimitIO = io.of('/update-roles-limit')

    updateRolesLimitIO.setMaxListeners(Infinity)
    
    const updateRolesLimit = (data) => {
        axios({
            method: 'post',
            url: 'http://localhost:3001/update-roles-limit/' + data.roomid,
            data: {
                rolesLimit: data.rolesLimit
            }
        })
        .then(res => {

            if(res.data === "ok"){
                return axios({
                    method: 'get',
                    url: 'http://localhost:3001/update-roles-limit/' + data.roomid,
                })
            }
            
        })
        .then(res => {
            updateRolesLimitIO.in(data.roomid).emit('UpdateRolesLimitAt', res.data)
        })
        .catch(err => console.log(err))
    }


    updateRolesLimitIO.on('connect', socket => {

        socket.on('JoinRoom', data => {
            socket.join(data.roomid)
            updateRolesLimit(data)
        })

    })

    return router
}