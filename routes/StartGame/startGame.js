var express = require('express');
var router = express.Router();
const mongoose = require('mongoose')

var axios = require('axios')
var mongoUrl = 'mongodb://werewolf_minhchinh_01:Haigay1997@ds057000.mlab.com:57000/werewolf_01'

var roomSchema = require('../../mongoose-schema/roomSchema')

var Room = mongoose.model('Room', roomSchema)

var callingOrderConstructor = require('../../calling-order/callingOrder')



router.get('/:roomid', (req, res, next) => {
    
    mongoose.connect(mongoUrl, { useNewUrlParser: true })

    var db = mongoose.connection

    db.on('error', console.error.bind(console, 'connection error: '))

    db.once('open', () => {
        
        Room.findOne({'roomid': req.params.roomid}, {'players': 1, '_id': 0, 'currentRoles': 1}, (err, result) => {
            if(err) console.log(err)
            
            if(result !== null){
                var callingOrder = new callingOrderConstructor().GetCallingOrder()
                
                let playerRoles = []
                
                //all the chosen roles that are not werewolves
                let no_wolf_roles = []

                //get all the chosen roles accept Werewolves because we will proceed with Werewolves first
                for(var key in result.currentRoles){
                    if(result.currentRoles.hasOwnProperty(key)){
                        if(result.currentRoles[key] > 0 && key !== 'Werewolves' && key !== '$init'){
                            for(let i = 0; i < result.currentRoles[key]; i++){
                                no_wolf_roles.push(key)
                            }
                        }
                    }
                }

                //initialize player roles
                result.players.forEach((name) => {
                    playerRoles.push({
                        name: name,
                        role: ''
                    })
                })

                //randomize the indexes in player array to assign related Werewolves

                let numberOfWerewolves = result.currentRoles['Werewolves']

                let numberOfPlayersIndex = result.players.length -1

                let chosenIndex = [numberOfWerewolves]

                for(let i = 0; i < numberOfWerewolves; i++){
                    //randomize the index based on the number of player -1 (index)
                    chosenIndex[i] = Math.floor(Math.random() * numberOfPlayersIndex)

                    //below is the function to check if the current index is uniqe, if not, try again
                    //the function will end when it guarantees no chosen index is repeated
                    checkIfEquals(chosenIndex, i, i-1, numberOfPlayersIndex)
                }


                //then, assign werewolves according to the chosen index
                result.players.forEach((name, index) => {
                    chosenIndex.forEach((chosenIndex) => {
                        if(index === chosenIndex)
                            playerRoles[index].role = 'Werewolves'
                    })
                })



                //1st randomization of no_wolf_roles (Fisher-Yates shuffle)

                let lengthOfNo_Wolf_Array = no_wolf_roles.length
                let replacementOfLastRole, currentIndex

                while(lengthOfNo_Wolf_Array){
                    //Pick a remaining element in the range [0, lengthOfNo_Wolf_Array-1]
                    currentIndex = Math.floor(Math.random() * lengthOfNo_Wolf_Array--)

                    //Swap it with the current element of the no_wolf_roles
                    replacementOfLastRole = no_wolf_roles[lengthOfNo_Wolf_Array]
                    no_wolf_roles[lengthOfNo_Wolf_Array] = no_wolf_roles[currentIndex]
                    no_wolf_roles[currentIndex] = replacementOfLastRole
                }

                //2nd randomization of no_wolf_roles (Fisher-Yates shuffle)

                lengthOfNo_Wolf_Array = no_wolf_roles.length

                while(lengthOfNo_Wolf_Array){
                    //Pick a remaining element in the range [0, lengthOfNo_Wolf_Array-1]
                    currentIndex = Math.floor(Math.random() * lengthOfNo_Wolf_Array--)

                    //Swap it with the current element of the no_wolf_roles
                    replacementOfLastRole = no_wolf_roles[lengthOfNo_Wolf_Array]
                    no_wolf_roles[lengthOfNo_Wolf_Array] = no_wolf_roles[currentIndex]
                    no_wolf_roles[currentIndex] = replacementOfLastRole
                }


                //final randomization of no_wolf_roles (Fisher-Yates shuffle)

                lengthOfNo_Wolf_Array = no_wolf_roles.length

                while(lengthOfNo_Wolf_Array){
                    //Pick a remaining element in the range [0, lengthOfNo_Wolf_Array-1]
                    currentIndex = Math.floor(Math.random() * lengthOfNo_Wolf_Array--)

                    //Swap it with the current element of the no_wolf_roles
                    replacementOfLastRole = no_wolf_roles[lengthOfNo_Wolf_Array]
                    no_wolf_roles[lengthOfNo_Wolf_Array] = no_wolf_roles[currentIndex]
                    no_wolf_roles[currentIndex] = replacementOfLastRole
                }

                //get all the players that are not werewolves
                let no_wolf_players = []

                for(let i = 0; i < playerRoles.length; i++){
                    if(playerRoles[i].role !== 'Werewolves'){
                        no_wolf_players.push(playerRoles[i])
                    }
                }

                //assign the according roles
                for(let i = 0; i < no_wolf_players.length; i++){
                    no_wolf_players[i].role = no_wolf_roles[i]
                }

                for(let i = 0; i < playerRoles.length; i++){
                    for(let j = 0; j < no_wolf_players.length; j++){
                        if(playerRoles[i].name === no_wolf_players[j].name){
                            playerRoles[i].role = no_wolf_players[j].role
                            break
                        }
                    }
                }

                //Arrange calling order
                let arrangedOrder = []

                callingOrder.forEach((order, index) => {
                    playerRoles.forEach((player, playerIndex) => {
                        
                        if(order.name === player.role){
                            console.log(player + ' ' + order.name)
                            // if(player.role !== 'Witch'){
                            //     arrangedOrder[index]({
                            //         'name': player.name,
                            //         'role': player.role,
                            //         'index': index,
                            //         '1stNight': order['1stNight']
                            //     })
                            // }
                            
                            // else{
                            //     arrangedOrder[index]({
                            //         'name': player.name,
                            //         'role': player.role,
                            //         'index': index,
                            //         '1stNight': order['1stNight'],
                            //         'useHeal': order.useHeal,
                            //         'useKill': order.useKill
                            //     })
                            // }
                            callingOrder[index].player.push(player.name)
                        }
                    })
                })

                //pack data to send
                let sentData = {
                    playerRoles: playerRoles
                }

                //Eliminate fields that are not selected and add special roles (special roles are not assigned to player)
                var newCallingOrder = []

                callingOrder.forEach((order, i) => {
                    if(order.special || order.player.length > 0){
                        newCallingOrder.push(order)
                    }
                })  

                //get the players that are werewolves
                let werewolfPlayers = newCallingOrder.map((order) => {
                    if(order.name === "Werewolves"){
                        return order.player
                    }
                })

                //Update werewolves end turn item
                newCallingOrder.every((order, index, arr) => {
                    if(order.name === "Werewolves end turn"){
                        werewolfPlayers.forEach(player => {
                            arr[index].receiveEndTurnObject.player = false
                        })

                        return false
                    }

                    return true
                })

                //Update round end item
                result.players.forEach((player) => {
                    newCallingOrder.every((order, index, arr) => {
                        if(order.name === "round end"){
                            arr[index].receivePressedVotePlayers[player] = false
                            return false
                        }

                        return true
                    })
                })

                //Update newCallingOrder with werewolves end turn's receiveEndTurnObject 
                let receiveEndTurnObject = {}
                newCallingOrder.every((order) => {
                    if(order.name === "Werewolves"){
                        order.player.forEach((player) => {
                            receiveEndTurnObject[player] = false
                        })
                        return false
                    }
                    return true
                })

                newCallingOrder.every((order, index, arr) => {
                    if(order.name === "Werewolves end turn"){
                        arr[index].receiveEndTurnObject = receiveEndTurnObject
                        return false
                    }
                    return true
                })

                //update the relevant row in rooms collection
                Room.updateOne( {'roomid': req.params.roomid}, { $set: { 'callingOrder': newCallingOrder }}, (err, result) => {
                    if(err) return console.log(err)

                    if(result !== null){
                        res.send(sentData)
                    }
                    else
                        res.send('not ok')
                })
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

    const startGame = (roomid) => {
        axios({
            method: 'get',
            url: 'http://localhost:3001/start-game/' + roomid
        })
        .then(res => {
            let requests = []

            res.data.playerRoles.forEach((player) => {
                requests.push(
                    axios({
                        method: 'post',
                        url: 'http://localhost:3001/players/' + player.name.toString().replace(' ', '-') + '/update-role',
                        data: {
                            role: player.role
                        }
                    })
                )
            })

            axios.all(requests).then((results) => {
                results.forEach(res => {
                })
                startGameIO.in(roomid).emit('RedirectToGameRoom', "ok")
            })
        })
        .catch(err => console.log(err))
    } 

    startGameIO.on('connect', socket => {
        socket.on('JoinRoom', data => {
            socket.join(data)
        })

        socket.on('start', data => {
            startGame(data)
        })

        startGameIO.on('disconnect', () => {
            console.log('start game user disconnected')
        })
    })

    
    return router
}