var express = require('express');
var router = express.Router();
const mongoose = require('mongoose')

var axios = require('axios')
var mongoUrl = 'mongodb://werewolf_minhchinh_01:Haigay1997@ds057000.mlab.com:57000/werewolf_01'

var roomSchema = require('../../mongoose-schema/roomSchema')

var Room = mongoose.model('Room', roomSchema)

router.get('/:roomid', (req, res, next) => {
    mongoose.connect(mongoUrl, { useNewUrlParser: true })

    var db = mongoose.connection

    db.on('error', console.error.bind(console, 'connection error: '))

    db.once('open', () => {
        Room.findOne({'roomid': req.params.roomid}, {'players': 1, '_id': 0, 'currentRoles': 1}, (err, result) => {
            if(err) console.log(err)

            
            if(result !== null){

                //assign werewolves first
                let numberOfWerewolves = result.currentRoles['Werewolves']

                let numberOfPlayersIndex = result.players.length -1

                let chosenIndex = [numberOfWerewolves]

                for(let i = 0; i < numberOfWerewolves; i++){
                    chosenIndex[i] = Math.floor(Math.random() * numberOfPlayersIndex)
                    checkIfEquals(chosenIndex, i, i-1, numberOfPlayersIndex)
                }

                let roles = []

                let assignedPlayerRoles 

                result.players.forEach((name, index) => {
                    chosenIndex.forEach((data) => {
                        if(index === data)
                            roles.push({
                                name: 'Werewolves'
                            })
                    })
                })

                for(var key in result.currentRoles){
                    if(result.currentRoles.hasOwnProperty(key)){
                        if(result.currentRoles[key] > 0 && key !== 'Werewolves'){

                        }
                    }
                }
                res.send(chosenIndex)
            }
        })
    })
})

function checkIfEquals(chosenIndex, currentIndex, compareIndex, numberOfPlayersIndex){
    
    //base case
    if(compareIndex < 0)
        return

    //if current index is not equal to the compare index, then keep comparing to the lower index
    if(chosenIndex[currentIndex] !== chosenIndex[compareIndex]){
        checkIfEquals(chosenIndex, currentIndex, compareIndex -1, numberOfPlayersIndex)
    }
    //if current index is equal to the compare index, then re-calculating from the currentIndex point and compare again
    else{
        chosenIndex[currentIndex] = Math.floor(Math.random() * numberOfPlayersIndex)
        checkIfEquals(chosenIndex, currentIndex, currentIndex -1, numberOfPlayersIndex)
    }
}

module.exports = (io) => {
    let startGameIO = io.of('/start-game')

    startGameIO.setMaxListeners(Infinity)

    const startGame = async (roomid) => {
        await axios({
            method: 'get',
            url: 'http://192.168.1.3:3001/start-game/' + roomid
        })
        .then(res => {
            startGameIO.in(roomid).emit('DisplayRoleAssigned', res.data)
        })
        .catch(err => console.log(err))
    } 


    startGameIO.on('connect', socket => {

        socket.on('StartGame', data => {
            socket.join(data)
            
        })

        socket.on('GetRoleAssigned', data => {
            startGame(data)
        })


        startGameIO.on('disconnect', () => {
            console.log('user disconnected')
        })
    })

    
    return router
}