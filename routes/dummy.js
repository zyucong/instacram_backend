const express = require('express');
const Joi = require('joi');
const router = express.Router();

const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/instacram', { useNewUrlParser: true })
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('Could not connect to MongoDB', err));

const User = mongoose.model('User', new mongoose.Schema({
    id: { 
        type: String
    },
    username: String,
    email: String,
    name: String,
    following: String,
    followed_num: {type: Number, min: 0}
}));

const Post = mongoose.model('Post', new mongoose.Schema({
    id: String,
    author: String,
    comments: String,
    description: String,
    likes: String,
    published: String,
    src: String,
    thumbnail: String
}));

router.get('/user', async (req, res) => {
    const username = req.query.username;
    const id = req.query.id;
    const {error} = validateUserId(req.query);
    if (error) return res.status(400).send("Malformed Request");
    if (username || id) {
        const idcnt = await User.find({id: id}).countDocuments();
        const usernamecnt = await User.find({username: username}).countDocuments();
        if (idcnt === 0 && usernamecnt === 0) return res.status(404).send("User Not Found");
        const idfunc = async function(){
            if (idcnt) {
                return id;
            } else {
                const user = await User.find({username: username});
                return user[0].id;
            }
        }
        const u_id = await idfunc();
        let user = await User.find({id: u_id});
        user = user[0];
        const u_username = user.username;
        const posts = await Post.find({author: u_username}).select({id: 1});
        let post_array = [];
        posts.forEach((e) => post_array.push(parseInt(e.id)));
        const follow_list = string_to_set(user.following);
        let follow_array = [];
        follow_list.forEach(v => follow_array.push(parseInt(v)));
        // [...follow_list]
        console.log(user.followed_num);
        res.send({
            'username': u_username,
            'name': user.name,
            'id'  : parseInt(u_id),
            'email': user.email,
            // 'following': [...follow_list],
            'following': follow_array,
            // 'followed_num': parseInt(user.followed_num),
            'followed_num': user.followed_num,
            'posts':post_array
        })
    }
    // console.log('get /dummy/user');
    res.send();
});

router.put('/user', (req, res) => {
    const email = req.body.email;
    const name = req.body.name;
    const password = req.body.password;
    console.log('put /dummy/user');
    res.send();
});

router.get('/user/feed', (req, res) => {
    let p = req.query.p;
    let n = req.query.n;
    // if (typeof p == undefined || p == null) p = 0;
    // if (typeof n == undefined || n == null) n = 10;
    if (!p) p = 0;
    if (!n) n = 10;
    res.send([p, n]);
});

router.put('/user/follow', (req, res) => {
    const username = req.query.username;
    res.send();
});

router.put('/user/unfollow', (req, res) => {
    const username = req.query.username;
    res.send();
});

router.post('/post', (req, res) => {
    const description = req.body.description_text
    const src = req.body.src;
    res.send();
});

router.delete('/post', (req, res) => {
    const id = req.query.id;
    res.send();
});

router.get('/post', (req, res) => {
    const id = req.query.id;
    res.send();
});

router.put('/post', (req, res) => {
    const description = req.body.description_text
    const src = req.body.src;
    res.send();
});

router.put('/post/comment', (req, res) => {
    const author = req.body.author;
    const time = req.body.published;
    const comment = req.body.comment;
    res.send();
});

router.put('/post/like', (req, res) => {
    const id = req.query.id;
    res.send();
});

router.put('/post/unlike', (req, res) => {
    const id = req.query.id;
    res.send();
});

function validateUserId(user) {
    const schema = {
        id: Joi.number().integer().min(0),
        username: Joi.string()
    }
    return Joi.validate(user, schema);
}

function string_to_set(raw) {
    if (!raw) return new Set([]);
    return new Set(raw.split(','));
}

module.exports = router;