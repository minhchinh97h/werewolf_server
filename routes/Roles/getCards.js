var express = require('express');
var router = express.Router();
const mongoose = require('mongoose')

var axios = require('axios')
var mongoUrl = 'mongodb://werewolf_minhchinh_01:Haigay1997@ds057000.mlab.com:57000/werewolf_01'

var roleSchema = require('../../mongoose-schema/roleSchema')

var Role = mongoose.model('Role', roleSchema)

var serverUrl = require('../../serverUrl')

router.get('/', (req, res, next) => {
    roomid = req.params.roomid

    mongoose.connect(mongoUrl, { useNewUrlParser: true })

    var db = mongoose.connection

    db.on('error', console.error.bind(console, 'connection error: '))

    db.once('open', () => {

        Role.find({}, {'name': 1, 'description': 1, '_id': 0}, (err, result) => {
            if(err) return console.log(err)

            res.send(result)

            db.close()
        })

    })
})

module.exports = (io) => {
    io.of('get-cards').setMaxListeners(Infinity)
    
    const getCards = (socket) => {
        axios({
            method: 'get',
            url: serverUrl + 'get-roles'
        })
        .then(res => {
            socket.emit('GetCards', res.data)
        })
        .catch(err => console.log(err))
    }


    io.of('get-cards').on('connect', socket => {
        getCards(socket)
    })

    return router
}