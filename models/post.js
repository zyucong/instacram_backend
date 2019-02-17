// const Joi = require('joi');
const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    id: String,
    author: String,
    comments: String,
    description: String,
    likes: String,
    published: String,
    src: String,
    thumbnail: String
}, { versionKey: false });

const Post = mongoose.model('Post', postSchema);

exports.Post = Post;