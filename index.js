const express = require('express');
require('dotenv').config();
const app = express();

const connectdb = require('./db');
const { configDotenv } = require('dotenv');
connectdb();


app.use(express.json());

app.use(require('./routes/auth'));
//console.log(process.env.secret);


app.listen(process.env.port, () => {
    console.log(`server is running on port ${process.env.port}`);

})