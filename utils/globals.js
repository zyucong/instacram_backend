const Joi = require('joi');
const {Comment} = require('../models/comment');

function string_to_set(raw) {
    if (!raw) return new Set([]);
    return new Set(raw.split(','));
}

function set_to_string(set) {
    return Array.from(set).join(',');
}

function validateUserId(user) {
    const schema = {
        id: Joi.number().integer().min(0),
        username: Joi.string()
    }
    return Joi.validate(user, schema);
}

async function format_post(post) {
    const comments = [];
    const query = await Comment.find({id: {$in: post.comments}});
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

module.exports = {
    string_to_set,
    set_to_string,
    validateUserId,
    format_post
}