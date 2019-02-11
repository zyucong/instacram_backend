const express = require('express');
const app = express();
const dummy = require('./routes/dummy');

app.use(express.json());
app.use('/dummy', dummy);

app.listen(5050, () => console.log('Backend is on'));