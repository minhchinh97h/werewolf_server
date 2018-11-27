var express = require('express');
var router = express.Router();
const mongoose = require('mongoose')
const MongoClient = require('mongodb').MongoClient

var mongoUrl = 'mongodb://werewolf_minhchinh_01:Haigay1997@ds057000.mlab.com:57000/werewolf_01'

var playerSchema = require('../mongoose-schema/playerSchema')





//to create a new user info or to update the existing one (when player wants to change username) if newUserBttn clicked
router.post('/create-or-update/:username', (req, res, next) => {
    mongoose.connect(mongoUrl, { useNewUrlParser: true })

    var db = mongoose.connection

    db.on('error', console.error.bind(console, 'connection error: '))

    db.once('open', () => {
        var Player = mongoose.model('Player', playerSchema)

        //to verify that the req.body.username does not exist in the players collection
        Player.findOne({ 'username': req.body.username }, (err, result) => {
            if(err) return console.log(err)


            //if does not exist, proceed
            if(result === null){
                var player = new Player({
                    username: req.body.username,
                    roomid: req.body.roomid,
                    timeCreated: req.body.timeCreated,
                    status: req.body.status
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
                return
            }
        })
    })
})



//return the response
router.get('/:username', (req, res, next) => {
    MongoClient.connect(mongoUrl, (err, db) => {
        if(err) console.log(err)

        var username = req.params.username.toString().replace('-', ' ')

        //to verify that the request's username is valid
        db.collection('Players').findOne({username: username}, (err, doc) => {
            if(err) console.log(err)
            
            if(doc !== null)
                res.send("ok")
            else
                res.send("not found")
            
            db.close()
        })

    })
})


//update the current user info if joinBttn clicked
router.post('/:username/update', (req, res, next) => {
    MongoClient.connect(mongoUrl, (err, db) => {
        if(err) console.log(err)

        var username = req.params.username.toString().replace('-', ' ')

        //update roomid field, other fields are fine
        db.collection('Players').update({username: username}, {$set: { roomid: req.body.roomid }}, (err, result) => {
            if(err) console.log(err)

            if(result !== null)
                res.send("ok")

            else
                res.send("not ok")

            db.close()
        })
    })
})

module.exports = router;