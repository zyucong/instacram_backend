const express = require('express');
const Joi = require('joi');
const {User} = require('../models/user');
const {Post} = require('../models/post');
const {Comment} = require('../models/comment');
const { unpack } = require('../utils/globals');
const router = express.Router();
const mongoose = require('mongoose');

// const User = mongoose.model('User', new mongoose.Schema({
//     id: { 
//         type: String
//     },
//     username: String,
//     email: String,
//     name: String,
//     following: String,
//     followed_num: {type: String}
// }));

// const Post = mongoose.model('Post', new mongoose.Schema({
//     id: String,
//     author: String,
//     comments: String,
//     description: String,
//     likes: String,
//     published: String,
//     src: String,
//     thumbnail: String
// }));

// const Comment = mongoose.model("Comment", new mongoose.Schema({
//     id: String,
//     author: String,
//     comment: String,
//     published: String
// }));

router.get('/user', async (req, res) => {
    const username = req.query.username;
    const id = req.query.id;
    const {error} = validateUserId(req.query);
    if (error) return res.status(400).send({message: "Malformed Request"});
    let u_id;
    if (username || id) {
        const idcnt = await User.find({id: id}).countDocuments();
        const usernamecnt = await User.find({username: username}).countDocuments();
        if (idcnt === 0 && usernamecnt === 0) return res.status(404).send({message: "User Not Found"});
        const idfunc = async function(){
            if (idcnt) {
                return id;
            } else {
                const user = await User.find({username: username});
                return user[0].id;
            }
        }
        u_id = await idfunc();
    }
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
    });
    res.send();
});

router.put('/user', async (req, res) => {
    const email = req.body.email;
    const name = req.body.name;
    const password = req.body.password;
    const u_id = '1';   // for dummy endpoint
    const allowed_keys=['password','name','email'];
    const valid_keys = Array.from(Object.keys(req.body)).filter(k => allowed_keys.includes(k));
    if (valid_keys.length < 1) return res.status(400).send({message: "Expected at least one field to change"});
    if (valid_keys.includes('password') && req.body.password.trim() === '') {
        return res.status(400).send({message: "Password cannot be empty"});
    }
    let payload = {};
    valid_keys.forEach(k => payload[k] = req.body[k]);
    await User.updateOne({id: u_id}, {
        $set: payload
    });
    res.status(200).send("Success");
});

router.get('/user/feed', async (req, res) => {
    let p = req.query.p;
    let n = req.query.n;
    // if (typeof p == undefined || p == null) p = 0;
    // if (typeof n == undefined || n == null) n = 10;
    if (!p) p = 0;
    if (!n) n = 10;
    const u_id = "1";
    let following = await User.find({id: u_id});
    following = Array.from(string_to_set(following[0].following));
    const users = await User.find({id: {$in: following}});
    const usernames = [];
    users.forEach(user => usernames.push(user.username));
    const posts = await Post.find({author: {$in: usernames}}).select({src: 0, thumbnail: 0});
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
            // thumbnail: post.thumbnail,
            // src: post.src,
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

router.put('/user/follow', async (req, res) => {
    const to_follow_username = req.query.username;
    if (!to_follow_username) return res.status(400).send({message: "Expected 'username' query parameter"});
    let to_follow = await User.find({username: to_follow_username});
    to_follow = to_follow[0];
    if (!to_follow) return res.status(404).send({message: "User Not Found"});
    const u_id = '1';
    const to_follow_id = to_follow.id;
    if (to_follow_id === u_id) return res.status(400).send({message: "Sorry, you can't follow yourself."});
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
    await User.updateOne({id: u_id}, {
        $set: {
            following: set_to_string(follow_list)
        }
    });
    res.send("Success");
});

router.put('/user/unfollow', async (req, res) => {
    const to_unfollow_username = req.query.username;
    if (!to_unfollow_username) return res.status(400).send({message: "Expected 'username' query parameter"});
    let to_unfollow = await User.find({username: to_unfollow_username});
    to_unfollow = to_unfollow[0];
    if (!to_unfollow) return res.status(404).send({message: "User Not Found"});
    const to_unfollow_id = to_unfollow.id;
    const u_id = '1';
    if (to_unfollow_id === u_id) return res.status(400).send({message: "Sorry, you can't unfollow yourself."});
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

router.post('/post', async (req, res) => {
    const description = req.body.description_text
    const src = req.body.src;
    const u_name = 'Anon';
    const json = req.body;
    const not_found = ['description_text', 'src'];
    if (unpack(json, not_found)) {
        return res.status(400)
        .send({message: 'Expected request object to contain: ' + unpack(json, not_found)});
    }
    const posts = await Post.find().select({id: 1});
    let last_id = posts.sort((a, b) => {return b.id - a.id;})[0].id;
    last_id = (parseInt(last_id) + 1).toString();
    await Post.insertMany([{
        id: last_id,
        author: u_name,
        description: description,
        published: (new Date() / 1000).toString(),
        likes: '',
        src: src
    }]);
    res.send({
        post_id: last_id
    });
});

router.delete('/post', async (req, res) => {
    const id = req.query.id;
    const u_name = 'Anon';
    const post = await Post.findOne({id: id});
    if (!post) return res.status(404).send('Post Not Found');
    if (post.author !== u_name) return res.status(403).send('You Are Unauthorized To Make That Request');
    const comment_list = string_to_set(post.comments);
    comment_list.forEach(async (e) => {
        await Comment.deleteOne({id: e})
    });
    await Post.deleteOne({id: id});
    res.send({
        message: 'success'
    });
});

router.get('/post', async (req, res) => {
    const id = req.query.id;
    const post = await Post.findOne({id: id});
    if (!post) return res.status(404).send('Post Not Found');
    const formatted_post = await format_post(post);
    res.send(formatted_post);
});

router.put('/post', async (req, res) => {
    const description = req.body.description_text
    const src = req.body.src;
    const id = req.query.id;
    if (!id) return res.status(400).send('Must supply a post id');
    if (!description && !src) return res.status(400).send("Expected at least 'description_text' or 'src'");
    const u_name = 'Anon';
    const json = req.body;
    const post = await Post.findOne({id: id});
    if (!post) return res.status(404).send('Post Not Found');
    if (post.author !== u_name) return res.status(403).send('You Are Unauthorized To Edit That Post');
    let updated = {};
    if (description) updated.description = description;
    if (src) updated.src = src;
    await Post.updateOne({id: id}, {$set: updated});
    res.send({ message: 'success' });
});

router.put('/post/comment', async (req, res) => {
    const comment = req.body.comment;
    const u_name = 'Anon';
    const id = req.query.id;
    if (!comment) return res.status(400).send('Comment cannot be empty');
    const post = await Post.findOne({id: id});
    if (!post) return res.status(404).send('Post Not Found');
    const comments = await Comment.find().select({id: 1});
    let comment_id = comments.sort((a, b) => {return b.id - a.id;})[0].id;
    comment_id = (parseInt(comment_id) + 1).toString();
    await Comment.insertMany([{
        id: comment_id,
        comment: comment,
        author: u_name,
        published: (new Date() / 1000).toString()
    }]);
    let comment_list = string_to_set(post.comments);
    comment_list.add(comment_id);
    comment_list = set_to_string(comment_list);
    await Post.updateOne({id: id}, {$set: {
        comments: comment_list
    }});
    res.send({ message: 'success' });
});

router.put('/post/like', async (req, res) => {
    const id = req.query.id;
    if (!id) return res.status(400).send('Must supply a post id');
    const u_name = 'Anon';
    const post = await Post.findOne({id: id});
    if (!post) return res.status(404).send('Post Not Found');
    const user = await User.findOne({username: u_name});
    const u_id = user.id;
    let likes = string_to_set(post.likes);
    likes.add(u_id);
    likes = set_to_string(likes);
    await Post.updateOne({id: id}, {$set: {likes: likes}});
    res.send({ message: 'success' });
});

router.put('/post/unlike', async (req, res) => {
    const id = req.query.id;
    if (!id) return res.status(400).send('Must supply a post id');
    const u_name = 'Anon';
    const post = await Post.findOne({id: id});
    if (!post) return res.status(404).send('Post Not Found');
    const user = await User.findOne({username: u_name});
    const u_id = user.id;
    let likes = string_to_set(post.likes);
    likes.delete(u_id);
    likes = set_to_string(likes);
    await Post.updateOne({id: id}, {$set: {likes: likes}});  
    res.send({ message: 'success'} );
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

async function format_post(post) {
    const comments = [];
    const query = await Comment.find({id: {$in: post.comments.split(',')}});
    query.forEach(c => comments.push({
        author: c.author,
        published: c.published,
        comment: c.comment
    }));
    return {
        id: post.id,
        meta: {
            author: post.author,
            description_text: post.description,
            published: post.published,
            likes: Array.from(string_to_set(post.likes))
        },
        // thumbnail: post.thumbnail,
        // src: post.src,
        comments: comments
    }
}

module.exports = router;