const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true

    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    mobile: {
        type: Number,
        required: true,
        unique: true
    },
    image: {
        type: String
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        default: 'User'
    },

})

module.exports = mongoose.model('user', userSchema);