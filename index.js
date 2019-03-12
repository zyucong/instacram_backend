const mongoose = require('mongoose');
const express = require('express');
const app = express();
const cors = require('cors');
const config = require('config');
const dummy = require('./routes/dummy');
const auth = require('./routes/auth');
const user = require('./routes/user');
const post = require('./routes/post');

mongoose.connect(config.get('db'), { useNewUrlParser: true })
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('Could not connect to MongoDB', err));

app.use(express.json());
app.use(cors());
app.use('/dummy', dummy);
app.use('/auth', auth);
app.use('/user', user);
app.use('/post', post);

const port = process.env.PORT || 5050;
app.listen(port, () => console.log(`Listening on port ${port}...`));