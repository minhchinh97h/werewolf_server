const mongoose = require('mongoose')

var activitySchema = new mongoose.Schema({
    roomid: String,
    activityLog: [String]
})