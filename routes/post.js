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

// make a new post
router.post('/', auth, async (req, res) => {
    const description = req.body.description_text
    const src = req.body.src;
    const u_name = req.username;
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

// delete a post
router.delete('/', auth, async (req, res) => {
    const id = req.query.id;
    const u_name = req.username;
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

// fetch a post referenced by id
router.get('/', auth, async (req, res) => {
    const id = req.query.id;
    // console.log(id);
    const post = await Post.findOne({id: id});
    if (!post) return res.status(404).send('Post Not Found');
    const formatted_post = await format_post(post);
    res.send(formatted_post);
});

// update a post
router.put('/', auth, async (req, res) => {
    const description = req.body.description_text
    const src = req.body.src;
    const id = req.query.id;
    if (!id) return res.status(400).send('Must supply a post id');
    if (!description && !src) return res.status(400).send("Expected at least 'description_text' or 'src'");
    const u_name = req.username;
    const post = await Post.findOne({id: id});
    if (!post) return res.status(404).send('Post Not Found');
    if (post.author !== u_name) return res.status(403).send('You Are Unauthorized To Edit That Post');
    let updated = {};
    if (description) updated.description = description;
    if (src) updated.src = src;
    await Post.updateOne({id: id}, {$set: updated});
    res.send({ message: 'success' });
});

// add a comment
router.put('/comment', auth, async (req, res) => {
    const comment = req.body.comment;
    const u_name = req.username;
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

router.put('/like', auth, async (req, res) => {
    const id = req.query.id;
    if (!id) return res.status(400).send('Must supply a post id');
    const u_name = req.username;
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

router.put('/unlike', auth, async (req, res) => {
    const id = req.query.id;
    if (!id) return res.status(400).send('Must supply a post id');
    const u_name = req.username;
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

module.exports = router;