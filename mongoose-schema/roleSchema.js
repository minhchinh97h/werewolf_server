const mongoose = require('mongoose')

var roleSchema = new mongoose.Schema({
    name: String,
    description: String
})

module.exports = roleSchema