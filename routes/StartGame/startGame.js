var express = require('express');
var router = express.Router();
const mongoose = require('mongoose')

var axios = require('axios')
var mongoUrl = 'mongodb://werewolf_minhchinh_01:Haigay1997@ds057000.mlab.com:57000/werewolf_01'

var roomSchema = require('../../mongoose-schema/roomSchema')

var Room = mongoose.model('Room', roomSchema)

var callingOrderConstructor = require('../../calling-order/callingOrder') //module.export will make the origin changed if it is changed anywhere else across the application

var serverUrl = require('../../serverUrl')

router.get('/:roomid', (req, res, next) => {
    
    mongoose.connect(mongoUrl, { useNewUrlParser: true })

    var db = mongoose.connection

    db.on('error', console.error.bind(console, 'connection error: '))

    db.once('open', () => {
        
        Room.findOne({'roomid': req.params.roomid}, {'players': 1, '_id': 0, 'currentRoles': 1, 'unusedRoles': 1}, (err, result) => {
            if(err) console.log(err)
            
            if(result !== null){
                let callingOrder = new callingOrderConstructor().GetCallingOrder(),
                    players = result.players.map(player => {return player}),
                    unusedRoles = result.unusedRoles

                
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

                // let numberOfPlayersIndex = result.players.length -1

                let werewolvesNameArr = []

                for(let i = 1; i <= numberOfWerewolves; i++){
                    //randomize the index based on the number of player -1 (index)
                    // chosenIndex[i] = Math.floor(Math.random() * numberOfPlayersIndex)


                    //below is the function to check if the current index is uniqe, if not, try again
                    //the function will end when it guarantees no chosen index is repeated
                    // checkIfEquals(chosenIndex, i, i-1, numberOfPlayersIndex)

                    let randomIndex = Math.floor(Math.random() * (players.length -1))

                    werewolvesNameArr.push(players[randomIndex])
                    players.splice(randomIndex, 1)

                }


                //then, assign werewolves according to the chosen index
                playerRoles.forEach((playerRole, index, arr) => {
                    werewolvesNameArr.every((werewolfName) => {
                        if(playerRole.name === werewolfName){
                            arr[index].role = "Werewolves"
                            return false
                        }
                        return true
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

                callingOrder.forEach((order, index, arr) => {
                    playerRoles.forEach((player, playerIndex) => {
                        
                        if(order.name === player.role){
                            arr[index].player.push(player.name)
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
                    if((result.currentRoles.hasOwnProperty(order.name) && result.currentRoles[order.name] > 0) || order.special)
                        newCallingOrder.push(order)
                })  

                //Get other unused roles from currentRoles and delete them from newCallingOrder
                let numberOfOrdinaryTownsfolkPlayers

                newCallingOrder.every((order) => {
                    if(order.name === "Ordinary Townsfolk"){
                        numberOfOrdinaryTownsfolkPlayers = order.player.length
                        return false
                    }
                    return true
                })

                newCallingOrder.forEach((order, index, arr) => {
                    if(!order.special && order.player instanceof Array && order.player.length === 0){
                        unusedRoles.push(order)
                        arr.splice(index, 1)
                    }
                })

                //In case the number of Ordinary Townsfolk is spare, we need to add them to unusedRoles
                if(result.currentRoles["Ordinary Townsfolk"] > numberOfOrdinaryTownsfolkPlayers){
                    let spareNumber = result.currentRoles["Ordinary Townsfolk"] - numberOfOrdinaryTownsfolkPlayers

                    //If unusedRoles already has one Ordinary Townsfolk field, then decrease spareNumber by 1
                    unusedRoles.every((role) => {
                        if(role.name === "Ordinary Townsfolk"){
                            spareNumber -= 1
                            return false
                        }
                        return true
                    })

                    for(var i = 0; i < spareNumber; i++){
                        unusedRoles.push({
                            'name': 'Ordinary Townsfolk',
                            'when': 18,
                            'player': [],
                            '1stNight': true
                        })
                    }
                }

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

                //Update round end's receivePressedVotePlayers and end round action's player

                newCallingOrder.forEach((order, index, arr) => {
                    if(order.name === "round end"){
                        if(result.players instanceof Array){
                            result.players.forEach(player => {
                                arr[index].receivePressedVotePlayers[player] = false
                            })
                        }
                    }

                    if(order.name === "end round action"){
                        if(result.players instanceof Array){
                            result.players.forEach(player => {
                                arr[index].player[player] = false
                            })
                        }
                    }
                })

                //Update newCallingOrder with werewolves's relevant fields
                let receiveEndTurnObject = {},
                    receiveEndVoteObject = {}
                    // werewolvesTargetObject = {},
                    // agreeOnKillObject = {}

                newCallingOrder.forEach((order) => {
                    if(order.name === "Werewolves"){
                        order.player.forEach((player) => {
                            receiveEndTurnObject[player] = false
                            receiveEndVoteObject[player] = false
                            // werewolvesTargetObject[player] = ''
                            // agreeOnKillObject[player] = ''
                        })
                        return false
                    }
                    return true
                })

                //Update Werewolves end vote & Werewolves end turn
                newCallingOrder.forEach((order, index, arr) => {
                    if(order.name === "Werewolves end vote"){
                        arr[index].receiveEndVoteObject = receiveEndVoteObject
                    }
                    if(order.name === "Werewolves end turn"){
                        arr[index].receiveEndTurnObject = receiveEndTurnObject
                    }
                    // if(order.name === "Werewolves vote target"){
                    //     arr[index].werewolvesTargetObject = werewolvesTargetObject
                    // }
                    // if(order.name === "Werewolves agree on kill"){
                    //     arr[index].agreeOnKillObject = agreeOnKillObject
                    // }
                })

                //Don't add Ordinary Townsfolk role
                newCallingOrder.every((order, index, arr) => {
                    if(order.name === "Ordinary Townsfolk"){
                        arr.splice(index, 1)
                        return false
                    }
                    return true
                })

                //update the relevant row in rooms collection
                Room.updateOne( {'roomid': req.params.roomid}, { $set: { 'callingOrder': newCallingOrder, 'unusedRoles': unusedRoles }}, (err, result) => {
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

module.exports = (io) => {
    let startGameIO = io.of('/start-game')

    startGameIO.setMaxListeners(Infinity)

    const startGame = (roomid) => {
        axios({
            method: 'get',
            url: serverUrl + 'start-game/' + roomid
        })
        .then(res => {
            let requests = []

            res.data.playerRoles.forEach((player) => {
                requests.push(
                    axios({
                        method: 'post',
                        url: serverUrl + 'players/' + player.name.toString().replace(' ', '-') + '/update-role',
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

    })

    
    return router
}