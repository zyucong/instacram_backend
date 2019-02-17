const jwt = require('jsonwebtoken');
const Joi = require('joi');
const {User} = require('../models/user');
const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();

// console.log(User);
router.post('/signup', async (req, res) => {
    const json = req.body;
    const not_found = ['username','password','email','name'];
    if (unpack(json, not_found)) {
        return res.status(400)
        .send({message: 'Expected request object to contain: ' + unpack(json, not_found)});
    }
    if (!json.username || !json.password) {
        return res.status(400).status({message: 'username and password cannot be empty'});
    }
    const check = await User.findOne({username: json.username});
    if (check) return res.status(409).send({message: 'Username Taken'});
    const token = jwt.sign({
        username: json.username,
        name: json.name,
        email: json.email
    }, 'testSecret');
    let users = await User.find().select({id: 1});
    let last_id = users.sort((a, b) => {return b.id - a.id;})[0].id;
    last_id = parseInt(last_id) + 1;
    await User.insertMany([{
        curr_token: token,
        id: last_id.toString(),
        email: json.email,
        username: json.username,
        name: json.name,
        password: json.password
    }]);
    res.send({token: token});
});

router.post('/login', async (req, res) => {
    const json = req.body;
    const not_found = ['username', 'password']
    if (unpack(json, not_found)) {
        return res.status(400)
        .send({message: 'Expected request object to contain: ' + unpack(json, not_found)});
    }
    if (!json.username || !json.password) {
        return res.status(400).status({message: 'username and password cannot be empty'});
    }
    const check = await User.findOne({username: json.username, password: json.password});
    // if (!check) return res.status(403).send('Invalid Username/Password');
    if (!check) return res.status(403).send({message: 'Invalid Username/Password'});

    const token = jwt.sign({
        username: json.username,
        id: check.id
    }, 'testSecret');
    await User.updateOne({username: json.username}, {
        $set: {
            curr_token: token
        }
    });
    res.send({token: token});
});

function unpack(json, not_found) {
    const result = not_found.filter(e => !json[e]);
    if (result.length > 0) {
        return result.join(',');
    }
    return false;
}

module.exports = router;