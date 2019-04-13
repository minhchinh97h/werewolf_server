var express = require('express');
var router = express.Router();
const mongoose = require('mongoose')

var mongoUrl = 'mongodb://werewolf_minhchinh_01:Haigay1997@ds057000.mlab.com:57000/werewolf_01'

var playerSchema = require('../mongoose-schema/playerSchema')


var Player = mongoose.model('Player', playerSchema)

//to create a new user info if newUserBttn clicked
router.post('/create/:username', (req, res, next) => {
    mongoose.connect(mongoUrl, { useNewUrlParser: true})

    var db = mongoose.connection

    db.on('error', console.error.bind(console, 'connection error: '))

    db.once('open', () => {

        //to verify that the req.body.username does not exist in the players collection
        Player.findOne({ 'username': req.body.username}, (err, result) => {
            if(err) return console.log(err)

            //if does not exist, proceed
            if(result === null){
                var player = new Player({
                    username: req.body.username,
                    roomid: req.body.roomid,
                    timeCreated: req.body.timeCreated,
                    status: req.body.status,
                    killedByWerewolves: req.body.killedByWerewolves,
                    role: req.body.role
                })
        
                player.save((err, result) => {
                    if(err) return console.log(err)
        
                    if(result !== null)
                        res.send('ok')
        
                    else 
                        res.send('not ok')

                })

            }

            //if exists, return
            else{
                res.send('not ok')
            }
        })
    })
})


//return the response
router.get('/:username', (req, res, next) => {

    var username = req.params.username.toString().replace('-', ' ')

    mongoose.connect(mongoUrl, { useNewUrlParser: true })

    var db = mongoose.connection

    db.on('error', console.error.bind(console, 'connection error: '))

    db.once('open', () => {
        Player.findOne({'username': username}, (err, result) => {
            if(err) return console.log(err)

            if(result !== null)
                res.send("ok")
            else
                res.send("not found")

        })
    })
})


//update the current user info if joinBttn clicked
router.post('/:username/update', (req, res, next) => {

    var username = req.params.username.toString().replace('-', ' ')

    mongoose.connect(mongoUrl, { useNewUrlParser: true })

    var db = mongoose.connection

    db.on('error', console.error.bind(console, 'connection error: '))

    db.once('open', () => {
        Player.updateOne( {'username': username}, {$set: { 'roomid': req.body.roomid }}, (err, result) => {
            if(err) return console.log(err)

            if(result !== null)
                res.send("ok")
            else
                res.send("not ok")

        } )
    })
})

//update user's role
router.post('/:username/update-role', (req, res, next) => {
    var username = req.params.username.toString().replace('-', ' ')

    mongoose.connect(mongoUrl, { useNewUrlParser: true })

    var db = mongoose.connection

    db.on('error', console.error.bind(console, 'connection error: '))

    db.once('open', () => {
        Player.updateOne({'username': username}, {$set: {'role': req.body.role}}, (err, result) => {
            if(err) return console.log(err)

            if(result !== null)
                res.send("ok")
            else
                res.send("not ok")
            
        })
    })
})
module.exports = router;