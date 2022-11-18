import express from 'express';
import session from 'express-session';
import {readdirSync} from 'fs';
import bodyParser from 'body-parser';
import cors from 'cors';
// import logger from 'morgan';
import ejs from 'ejs';
import path from 'path';
import flash from 'connect-flash';
// import MongoStore for session storage in MongoDB and initialize it with the connection to the database
import MongoStore from 'connect-mongo';
import cookieParser from 'cookie-parser';
import { truncateSync } from 'fs';


require('dotenv').config();

const app = express();

// database connection
require('./config/database');

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

//autoload routes
readdirSync('./routes').map((r) => app.use('/', require(`./routes/${r}`)))


const port = process.env.PORT || 8000;
app.listen(port, () => {
    console.log(`🚀 Server is up and running on port ${port}.`)
})