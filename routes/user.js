const express = require('express');
const Joi = require('joi');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const {User} = require('../models/user');
const {Post} = require('../models/post');
const {Comment} = require('../models/comment');
const router = express.Router();
const mongoose = require('mongoose');
const {string_to_set, set_to_string, validateUserId, format_post} = require('../utils/globals');

router.get('/', auth, async (req, res) => {
    const username = req.query.username;
    const id = req.query.id;
    const {error} = validateUserId(req.query);
    if (error) return res.status(400).send({message: "Malformed Request"});
    // let u_id;
    let u_name = req.username;
    if (username || id) {
        const idcnt = await User.find({id: id}).countDocuments();
        const usernamecnt = await User.find({username: username}).countDocuments();
        if (idcnt === 0 && usernamecnt === 0) return res.status(404).send({message: "User Not Found"});
        const idfunc = async function(){
            if (idcnt) {
                // return id;
                const user = await User.find({id: id});
                return user[0].username;
            } else {
                return username
                // const user = await User.find({username: username});
                // return user[0].id;
            }
        }
        u_name = await idfunc();
    }
    // let user = await User.find({id: u_id});
    let user = await User.find({username: u_name});
    user = user[0];
    // const u_username = user.username;
    const posts = await Post.find({author: u_name}).select({id: 1});
    let post_array = [];
    posts.forEach((e) => post_array.push(parseInt(e.id)));
    const follow_list = string_to_set(user.following);
    let follow_array = [];
    follow_list.forEach(v => follow_array.push(parseInt(v)));
    // [...follow_list]
    // console.log(user.followed_num);
    res.send({
        'username': u_name,
        'name': user.name,
        'id'  : parseInt(user.id),
        'email': user.email,
        // 'following': [...follow_list],
        'following': follow_array,
        // 'followed_num': parseInt(user.followed_num),
        'followed_num': user.followed_num,
        'posts':post_array
    });
});

router.put('/', auth, async (req, res) => {
    const u_name = req.username;
    const allowed_keys=['password','name','email'];
    const valid_keys = Array.from(Object.keys(req.body)).filter(k => allowed_keys.includes(k));
    if (valid_keys.length < 1) return res.status(400).send({message: "Expected at least one field to change"});
    if (valid_keys.includes('password') && req.body.password.trim() === '') {
        return res.status(400).send({message: "Password cannot be empty"});
    }
    let payload = {};
    valid_keys.forEach(k => payload[k] = req.body[k]);
    await User.updateOne({username: u_name}, {
        $set: payload
    });
    res.status(200).send("Success");
});

router.get('/feed', auth, async (req, res) => {
    let p = req.query.p;
    let n = req.query.n;
    if (!p) p = 0;
    if (!n) n = 10;
    const u_name = req.username;
    // let following = await User.find({id: u_id});
    let following = await User.find({username: u_name});
    following = Array.from(string_to_set(following[0].following));
    const users = await User.find({id: {$in: following}});
    const usernames = [];
    users.forEach(user => usernames.push(user.username));
    const posts = await Post.find({author: {$in: usernames}});
    let formatted_posts = []
    for (const post of posts) {
        const comments = [];
        const query = await Comment.find({id: {$in: post.comments}});
        // console.log(query);
        query.forEach(c => comments.push({
            author: c.author,
            published: c.published,
            comment: c.comment
        }));
        formatted_posts.push(    
        {
            id: post.id,
            meta: {
                author: post.author,
                description_text: post.description,
                published: post.published,
                likes: Array.from(string_to_set(post.likes))
                .map(l => parseInt(l))
            },
            thumbnail: post.thumbnail,
            src: post.src,
            comments: comments
        });
    };
    formatted_posts.sort((a, b) => {
        return parseFloat(b.meta.published) - parseFloat(a.meta.published);
    });
    if (p > formatted_posts.length - 1) {
        formatted_posts = [];
    } else {
        formatted_posts = formatted_posts.slice(p, n);
    }
    return res.send({
        posts: formatted_posts
    });
});

router.put('/follow', auth, async (req, res) => {
    const to_follow_username = req.query.username;
    if (!to_follow_username) return res.status(400).send({message: "Expected 'username' query parameter"});
    let to_follow = await User.find({username: to_follow_username});
    to_follow = to_follow[0];
    if (!to_follow) return res.status(404).send({message: "User Not Found"});
    const u_name = req.username;
    const to_follow_id = to_follow.id;
    if (to_follow_username === u_name) return res.status(400).send({message: "Sorry, you can't follow yourself."});
    let sender = await User.find({username: u_name});
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
    await User.updateOne({username: u_name}, {
        $set: {
            following: set_to_string(follow_list)
        }
    });
    res.send("Success");
});

router.put('/unfollow', auth, async (req, res) => {
    const to_unfollow_username = req.query.username;
    if (!to_unfollow_username) return res.status(400).send({message: "Expected 'username' query parameter"});
    let to_unfollow = await User.find({username: to_unfollow_username});
    to_unfollow = to_unfollow[0];
    if (!to_unfollow) return res.status(404).send({message: "User Not Found"});
    const u_name = req.username;
    const to_unfollow_id = to_unfollow.id;
    if (to_unfollow_username === u_name) return res.status(400).send({message: "Sorry, you can't unfollow yourself."});
    let sender = await User.find({username: u_name});
    sender = sender[0];
    const follow_list = string_to_set(sender.following);
    if (follow_list.has(to_unfollow_id)) {
        let followed_num = parseInt(to_unfollow.followed_num) - 1;
        await User.updateOne({id: to_unfollow_id}, {
            $set: {followed_num: followed_num}
        });
    }
    follow_list.delete(to_unfollow_id);
    await User.updateOne({username: u_name}, {
        $set: {
            following: set_to_string(follow_list)
        }
    })
    res.send("Success");
});

module.exports = router;