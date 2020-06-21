const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const MongoStore = require('connect-mongo')(session);

const app = express();

const sess = {
    secret: process.env.SECRET,
    name: 'sessionId',
    proxy: true,
    store: new MongoStore({ mongooseConnection: mongoose.connection }),
    cookie: {
        httpOnly: true
    },
    resave: false,
    saveUninitialized: true
}

app.set('trust proxy', 1) // trust first proxy

if (app.get('env') === 'production') {
    app.set('trust proxy', true) // trust first proxy
}

module.exports = session(sess);