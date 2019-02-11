const express = require('express');
const router = express.Router();

router.get('/user', (req, res) => {
    const username = req.query.username;
    const id = req.query.id;
    console.log('get /dummy/user');
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
    if (typeof p == undefined || p == null) p = 0;
    if (typeof n == undefined || n == null) n = 10;
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

module.exports = router;