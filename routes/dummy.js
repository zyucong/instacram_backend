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
    followed_num: {type: String}
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
    res.send();
});

router.put('/user', async (req, res) => {
    const email = req.body.email;
    const name = req.body.name;
    const password = req.body.password;
    const u_id = '1';   // for dummy endpoint
    const allowed_keys=['password','name','email'];
    const valid_keys = Array.from(Object.keys(req.body)).filter(k => allowed_keys.includes(k));
    if (valid_keys.length < 1) return res.status(400).send("Expected at least one field to change");
    if (valid_keys.includes('password') && req.body.password.trim() === '') {
        return res.status(400).send("Password cannot be empty");
    }
    let payload = {};
    valid_keys.forEach(k => payload[k] = req.body[k]);
    await User.updateOne({id: u_id}, {
        $set: payload
    });
    res.status(200).send("Success");
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

router.put('/user/follow', async (req, res) => {
    const to_follow_username = req.query.username;
    if (!to_follow_username) return res.status(400).send("Expected 'username' query parameter");
    let to_follow = await User.find({username: to_follow_username});
    to_follow = to_follow[0];
    if (!to_follow) return res.status(404).send("User Not Found");
    const u_id = '1';
    const to_follow_id = to_follow.id;
    if (to_follow_id === u_id) return res.status(400).send("Sorry, you can't follow yourself.");
    let sender = await User.find({id: u_id});
    sender = sender[0];
    const follow_list = string_to_set(sender.following);
    if (!follow_list.has(to_follow_id)) {
        let followed_num = parseInt(to_follow.followed_num) + 1;
        await User.updateOne({id: to_follow_id}, {
            // $inc: {followed_num: 1}
            $set: {followed_num: followed_num}
        });
    }
    follow_list.add(to_follow_id);
    // console.log(follow_list);
    // console.log(set_to_string(follow_list));
    await User.updateOne({id: u_id}, {
        $set: {
            following: set_to_string(follow_list)
        }
    })
    res.send("Success");
});

router.put('/user/unfollow', async (req, res) => {
    const to_unfollow_username = req.query.username;
    if (!to_unfollow_username) return res.status(400).send("Expected 'username' query parameter");
    let to_unfollow = await User.find({username: to_unfollow_username});
    to_unfollow = to_unfollow[0];
    if (!to_unfollow) return res.status(404).send("User Not Found");
    const to_unfollow_id = to_unfollow.id;
    const u_id = '1';
    if (to_unfollow_id === u_id) return res.status(400).send("Sorry, you can't follow yourself.");
    let sender = await User.find({id: u_id});
    sender = sender[0];
    const follow_list = string_to_set(sender.following);
    if (follow_list.has(to_unfollow_id)) {
        let followed_num = parseInt(to_unfollow.followed_num) - 1;
        await User.updateOne({id: to_unfollow_id}, {
            $set: {followed_num: followed_num}
        });
    }
    follow_list.delete(to_unfollow_id);
    await User.updateOne({id: u_id}, {
        $set: {
            following: set_to_string(follow_list)
        }
    })
    res.send("Success");
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

function set_to_string(set) {
    return Array.from(set).join(',');
}

module.exports = router;