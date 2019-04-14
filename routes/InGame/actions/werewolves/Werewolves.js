var express = require('express');
var router = express.Router();
const mongoose = require('mongoose')

var axios = require('axios')
var mongoUrl = 'mongodb://werewolf_minhchinh_01:Haigay1997@ds057000.mlab.com:57000/werewolf_01'

var roomSchema = require('../../../../mongoose-schema/roomSchema')

var Room = mongoose.model('Room', roomSchema)

var serverUrl = require('../../../../serverUrl')

//Push chosen target of each werewolve in to the database
router.post('/:roomid/werewolves-agree', (req, res, next) => {
    mongoose.connect(mongoUrl, { useNewUrlParser: true })

    var db = mongoose.connection

    db.on('error', console.error.bind(console, 'connection error: '))

    db.once('open', () => {
        Room.findOne({'roomid': req.params.roomid}, {'callingOrder': 1, '_id': 0}, (err, result) => {
            if(err) return console.log(err)

            if(result !== null){
                var callingOrder = result.callingOrder

                //Randomly chose one from the target pool
                callingOrder.every((order, index, callingOrder) => {
                    if(order.name === "Werewolves current target"){
                        callingOrder[index].player.push(req.body.choseTarget)

                        var chosenIndex = Math.floor(Math.random() * (callingOrder[index].player.length - 1))
                        var chosenTarget = callingOrder[index].player[chosenIndex]

                        callingOrder[index].chosen = chosenTarget

                        return false
                    }

                    return true
                })

                //Update the callingOrder which holds the name of the kill target of werewolves
                Room.updateOne({'roomid': req.params.roomid}, {$set: {'callingOrder': callingOrder}}, (err, result) => {
                    if(err) return console.log(err)

                    if(result !== null){
                        //change the boolean to true in Werewolves end vote's
                        Room.findOneAndUpdate({'roomid': req.params.roomid},
                                                {$set: {[`callingOrder.$[element].receiveEndVoteObject.${req.body.werewolf}`]: true}},
                                                {arrayFilters: [{'element.name': 'Werewolves end vote'}]}, 
                                                (err, result) => {
                            if(err) return console.log(err)

                            if(result !== null){
                                //Check whether all the werewolves have voted
                                Room.findOne({'roomid': req.params.roomid}, {'callingOrder': 1, '_id': 0}, (err, result) => {
                                    if(err) return console.log(err)

                                    if(result !== null){
                                        let callingOrder = result.callingOrder,
                                            allWerewolvesVoted = true

                                        callingOrder.every((order) => {
                                            if(order.name === 'Werewolves end vote'){
                                                receiveEndVoteObject = order.receiveEndVoteObject
                                                for(var key in order.receiveEndVoteObject){
                                                    if(order.receiveEndVoteObject.hasOwnProperty(key)){
                                                        if(!order.receiveEndVoteObject[key]){
                                                            allWerewolvesVoted = false
                                                            return false
                                                        }
                                                    }
                                                }
                                            }
                                            return true
                                        })

                                        if(allWerewolvesVoted){
                                            res.send('all werewolves voted')
                                        }

                                        else
                                            res.send('not all werewolves voted')
                                    }
                                })
                            }
                        })
                    }
                })
            }
        })
    })
})

//Get all the werewolves
router.get('/:roomid/werewolves-get', (req, res, next) => {
    mongoose.connect(mongoUrl, { useNewUrlParser: true })

    var db = mongoose.connection

    db.on('error', console.error.bind(console, 'connection error: '))

    db.once('open', () => {
        Room.findOne({"roomid": req.params.roomid}, {'callingOrder': 1, '_id': 0}, (err, result) => {
            if(err) return console.log(err)

            if(result !== null){
                result.callingOrder.every((order) => {
                    if(order.name === "Werewolves"){
                        res.send(order.player)
                        return false
                    }

                    return true
                })
            }
        })
    })
})

//Get number of false roles based on the number of werewolves
router.get('/:roomid/werewolves-get-false-roles', (req, res, next) => {
    mongoose.connect(mongoUrl, { useNewUrlParser: true })

    var db = mongoose.connection

    db.on('error', console.error.bind(console, 'connection error: '))

    db.once('open', () => {
        Room.findOne({"roomid": req.params.roomid}, {'unusedRoles': 1, '_id': 0, 'callingOrder': 1}, (err, result) => {
            if(err) return console.log(err)

            if(result !== null){
                let unusedRoles = result.unusedRoles,
                    callingOrder = result.callingOrder

                let unusedRoleName_arr = [],
                    numberOfWerewolves 

                unusedRoles.forEach((order) => {
                    unusedRoleName_arr.push(order.name)
                })

                //Get number of werewolves
                callingOrder.every((order) => {
                    if(order.name === "Werewolves" && order.player instanceof Array){
                        numberOfWerewolves = order.player.length
                        return false
                    }

                    return true
                })

                if(unusedRoleName_arr.length <= numberOfWerewolves){
                    res.send(unusedRoleName_arr)
                }

                else{
                    let sendingFalseRoles = []

                    for(var i = 0; i < numberOfWerewolves; i++){
                        let randomIndex = Math.floor(Math.random() * (unusedRoleName_arr.length - 1))

                        sendingFalseRoles.push(unusedRoleName_arr[randomIndex])
                        unusedRoleName_arr.splice(randomIndex, 1)
                    }

                    res.send(sendingFalseRoles)
                }
            }
        })
    })
})


router.post('/:roomid/werewolves-set-false-role', (req, res, next) => {
    mongoose.connect(mongoUrl, { useNewUrlParser: true })

    var db = mongoose.connection

    db.on('error', console.error.bind(console, 'connection error: '))

    db.once('open', () => {
        Room.findOneAndUpdate({'roomid': req.params.roomid},
                                {$push: {'unusedRoles.$[element].player': req.body.wolfName}},
                                {arrayFilters: [{'element.name': req.body.falseRole}]},
                                (err, result) => {
            if(err) return console.log(err)

            if(result !== null){
                res.send(req.body)
            }
        })
    })
})

router.get('/:roomid/werewolves-get-other-false-role', (req, res, next) => {
    mongoose.connect(mongoUrl, { useNewUrlParser: true })

    var db = mongoose.connection

    db.on('error', console.error.bind(console, 'connection error: '))

    db.once('open', () => {
        Room.findOne({'roomid': req.params.roomid}, {'unusedRoles': 1, '_id': 0}, (err, result) => {
            if(err) return console.log(err)

            if(result !== null){
                let unusedRoles = result.unusedRoles,
                    sendingData = []

                unusedRoles.forEach((role) => {
                    if(role.player instanceof Array && role.player.length > 0){
                        sendingData.push({
                            falseRole: role.name,
                            wolfName: role.player[0] 
                        })
                    }
                })

                res.send(sendingData)
            }
        })
    })
})


router.post('/:roomid/werewolves-store-my-choice', (req, res, next) => {
    mongoose.connect(mongoUrl, { useNewUrlParser: true })

    var db = mongoose.connection

    db.on('error', console.error.bind(console, 'connection error: '))

    db.once('open', () => {
        Room.findOneAndUpdate({'roomid': req.params.roomid}, 
                                {$set: {[`callingOrder.$[element].werewolvesTargetObject.${req.body.wolfName}`] : req.body.choseTarget}},
                                {arrayFilters: [{'element.name': 'Werewolves vote target'}]}, (err, result) => {
            if(err) return console.log(err)

            if(result !== null){
                res.send('ok')
            }
        })
    })
})

router.get('/:roomid/werewolves-get-other-choice', (req, res, next) => {
    mongoose.connect(mongoUrl, { useNewUrlParser: true })

    var db = mongoose.connection

    db.on('error', console.error.bind(console, 'connection error: '))

    db.once('open', () => {
        Room.findOne({'roomid': req.params.roomid}, {'callingOrder': 1, '_id': 0}, (err, result) => {
            if(err) return console.log(err)

            if(result !== null){
                let callingOrder = result.callingOrder

                callingOrder.every((order) => {
                    if(order.name === "Werewolves vote target"){
                        res.send(order.werewolvesTargetObject)
                        return false
                    }
                    return true
                })
            }
        })
    })
})


router.post('/:roomid/werewolves-store-my-kill', (req, res, next) => {
    mongoose.connect(mongoUrl, { useNewUrlParser: true })

    var db = mongoose.connection

    db.on('error', console.error.bind(console, 'connection error: '))

    db.once('open', () => {
        Room.findOneAndUpdate({'roomid': req.params.roomid}, 
                                {$set: {[`callingOrder.$[element].agreeOnKillObject.${req.body.werewolf}`] : req.body.choseTarget}},
                                {arrayFilters: [{'element.name': 'Werewolves agree on kill'}]}, (err, result) => {
            if(err) return console.log(err)

            if(result !== null){
                res.send('ok')
            }
        })
    })
})

router.get('/:roomid/werewolves-get-other-kill-decisions', (req, res, next) => {
    mongoose.connect(mongoUrl, { useNewUrlParser: true })

    var db = mongoose.connection

    db.on('error', console.error.bind(console, 'connection error: '))

    db.once('open', () => { 
        Room.findOne({'roomid': req.params.roomid}, {'callingOrder': 1, '_id': 0}, (err, result) => {
            if(err) return console.log(err)

            if(result !== null){
                let callingOrder = result.callingOrder

                callingOrder.every((order) => {
                    if(order.name === "Werewolves agree on kill"){
                        res.send(order.agreeOnKillObject)
                        return false
                    }

                    return true
                })
            }
        })
    })
})

module.exports = (io) => {
    let wwIO = io.of('/werewolves')

    wwIO.setMaxListeners(Infinity)

    const RequestToAgree = (data, socket) => {
        axios({
            method: 'post',
            url: serverUrl + 'in-game/actions/' + data.roomid + '/werewolves-agree',
            data: data
        })
        .then((res) => {
            if(res.data === "all werewolves voted")
                wwIO.in(data.roomid).emit('ConfirmKillRespond', res.data)
        })
        .catch(err => {
            console.log(err)
        })
    }

    const GetOtherWerewolves = (roomid, socket) => {
        axios({
            method: 'get',
            url: serverUrl + 'in-game/actions/' + roomid + '/werewolves-get'
        })
        .then((res) => {
            socket.emit('GetOtherWerewolves', res.data)
        })
        .catch(err => {
            console.log(err)
        })
    }

    const GetFalseRoles = (data, socket) => {
        axios({
            method: 'get',
            url: serverUrl + 'in-game/actions/' + data.roomid + '/werewolves-get-false-roles'
        })
        .then(res => {
            socket.emit("FalseRoles", res.data)
        })
        .catch(err => console.log(err))
    }

    const RequestFalseRoleChoice = (data) => {
        axios({
            method: 'post',
            url: serverUrl + 'in-game/actions/' + data.roomid + '/werewolves-set-false-role',
            data: data
        })
        .then(res => {
            wwIO.in(data.roomid).emit('FalseRoleChoice', res.data)
        })
        .catch(err => console.log(err))
    }

    const RequestToGetOtherFalseRoles = (roomid, socket) => {
        axios({
            method: 'get',
            url: serverUrl + 'in-game/actions/' + roomid + '/werewolves-get-other-false-role'
        })
        .then(res => {
            socket.emit('OtherFalseRoles', res.data)
        })
        .catch(err => console.log(err))
    }

    const RequestToStoreMyChoice = (data) => {
        axios({
            method: 'post',
            url: serverUrl + 'in-game/actions/' + data.roomid + '/werewolves-store-my-choice',
            data: data
        })
        .then(res => {
            if(res.data === "ok"){
                wwIO.in(data.roomid).emit('OtherChoices', data)
            }
        })
        .catch(err => console.log(err))
    }

    const RequestToGetOtherChoices = (roomid, socket) => {
        axios({
            method: 'get',
            url: serverUrl + 'in-game/actions/' + roomid + '/werewolves-get-other-choice'
        })
        .then(res => {
            socket.emit('GetOtherChoices', res.data)
        })
        .catch(err => console.log(err))
    }

    const RequestToNotifyOther = (data) => {
        axios({
            method: 'post',
            url: serverUrl + 'in-game/actions/' + data.roomid + '/werewolves-store-my-kill',
            data: data
        })
        .then(res => {
            if(res.data === 'ok')
                wwIO.in(data.roomid).emit('OtherNotified', data)
        })
        .catch(err => console.log(err))
    }

    const RequestToGetOtherKillDecisions = (roomid, socket) => {
        axios({
            method: 'get',
            url: serverUrl + 'in-game/actions/' + roomid + '/werewolves-get-other-kill-decisions'
        })
        .then(res => {
            socket.emit('OtherKillDecisions', res.data)
        })
        .catch(err => console.log(err))
    }

    wwIO.on('connect', (socket) => {
        socket.on('JoinRoom', roomid => {
            socket.join(roomid)
        })
        
        socket.on('RequestToGetOtherWerewolves', data => {
            GetOtherWerewolves(data, socket)
        })

        socket.on('RequestToGetOtherChoices', roomid => {
            RequestToGetOtherChoices(roomid, socket)
        })

        socket.on('RequestMyChoice', data => {
            RequestToStoreMyChoice(data)
        })

        socket.on('RequestToAgreeKill', data => {
            RequestToAgree(data, socket)
        })

        socket.on('GetFalseRoles', data => {
            GetFalseRoles(data, socket)
        })

        socket.on('RequestFalseRoleChoice', data => {
            RequestFalseRoleChoice(data)
        })

        socket.on('RequestToGetOtherKillDecisions', roomid => {
            RequestToGetOtherKillDecisions(roomid, socket)
        })

        socket.on('RequestToNotifyOther', data => {
            RequestToNotifyOther(data)
        })

        socket.on('RequestToGetOtherFalseRoles', roomid => {
            RequestToGetOtherFalseRoles(roomid, socket)
        })
    })

    return router
}