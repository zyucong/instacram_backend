const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
    let token = req.headers.authorization;
    if (!token) return res.status(403).send('Unsupplied Authorization Token');
    try {
        token = token.split(' ')[1];
    } catch(ex) {
        res.status(400).send("Authorization Token must start with 'Token'");
    }
    try {
        const decoded = jwt.verify(token, 'testSecret');
        req.username = decoded.username;
        next();
    } catch (ex) {
        res.status(403).send('Invalid Authorization Token');
    }
}