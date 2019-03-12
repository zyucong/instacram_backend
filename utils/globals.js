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
    const comment_ids = string_to_set(post.comments);
    const query = await Comment.find({id: {$in: Array.from(comment_ids)}});
    query.forEach(c => comments.push({
        author: c.author,
        published: c.published,
        comment: c.comment
    }));
    return {
        id: parseInt(post.id),
        meta: {
            author: post.author,
            description_text: post.description,
            published: post.published,
            likes: Array.from(string_to_set(post.likes)).map(l => parseInt(l))
        },
        thumbnail: post.thumbnail,
        src: post.src,
        comments: comments
    }
}

function unpack(json, not_found) {
    const result = not_found.filter(e => !json[e]);
    if (result.length > 0) {
        return result.join(',');
    }
    return false;
}

module.exports = {
    string_to_set,
    set_to_string,
    validateUserId,
    format_post,
    unpack
}