const Joi = require('joi');
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    id: { 
        type: String
    },
    username: {
        type: String,
        required: true
    },
    email: String,
    name: String,
    curr_token: String,
    password: {
        type: String,
        required: true
    },
    following: {
        type: String,
        default: ''
    },
    followed_num: {type: String, default: '0'},
}, { versionKey: false });

const User = mongoose.model('User', userSchema);

function validateUser(user) {
    const schema = {
        id: Joi.number().integer().min(0),
        username: Joi.string().required(),
        password: Joi.string().required()
    };
    Joi.validate(user, schema);
}

exports.User = User;
exports.validate = validateUser;