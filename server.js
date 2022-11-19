require('dotenv').config();
const express = require('express');
const session = require('express-session');
const readdirSync = require('fs').readdirSync;
const bodyParser = require('body-parser');
const cors = require('cors');
// import logger from 'morgan';
const ejs = require('ejs');
const path = require('path');
const flash = require('connect-flash');
// import MongoStore for session storage in MongoDB and initialize it with the connection to the database
const MongoStore = require('connect-mongo');
const cookieParser = require('cookie-parser');
// import { fileURLToPath } from 'url';
// import { dirname } from 'path';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// import dotenv config and use it to load the environment variables from the .env file
// import dotenv from 'dotenv';
// dotenv.config();

const app = express();

// database connection
require('./config/database');
// import './config/database.js';


// set cookie parser with 7 days expiration
app.use(cookieParser());

// session
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ 
        mongoUrl: process.env.LOCAL_DATABASE_URI, 
        // ttl: 604800000, // = 7 days. Default
        // autoRemove: 'native' // Default
    }),
    cookie: { secure: false, maxAge: 604800000 } // 7 days in milliseconds 
}));


//flash
app.use(flash());
// Global Flash Messages
app.use(function(req, res, next) {
    res.locals.successMsg = req.flash("success_msg");
    res.locals.errorMsg = req.flash("error_msg");
    res.locals.authMsg = req.flash("auth_msg");
    res.locals.msg = req.flash("msg");
    next();
});

//middlewares
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({extended: true}));
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(cors());
// app.use(logger('combined'));


//template engine
app.engine('ejs', ejs.renderFile);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

//routes using readdir to read all the files in the routes folder and import them
readdirSync('./routes').map((r) => app.use('/', require('./routes/' + r)));


const port = process.env.PORT || 8000;
app.listen(port, () => {
    console.log(`🚀 Server is up and running on port ${port}.`)
})