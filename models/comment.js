const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    id: String,
    author: String,
    comment: String,
    published: String
}, { versionKey: false });

const Comment = new mongoose.model('Comment', commentSchema);

exports.Comment = Comment;