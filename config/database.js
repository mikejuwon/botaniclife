import mongoose from 'mongoose';

// connect to database from the .env file
mongoose.botaniclife = mongoose.createConnection(process.env.PROD_DATABASE_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

    mongoose.botaniclife.on('error', console.error.bind(console, 'connection error:'));
    mongoose.botaniclife.once('open', () => {
        console.log("🚀 Connection to the Main Site Database is successful!");
    });

mongoose.botanicAdmin = mongoose.createConnection(process.env.PROD_DATABASE_URI_ADMIN, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

    mongoose.botanicAdmin.on('error', console.error.bind(console, 'connection error:'));
    mongoose.botanicAdmin.once('open', () => {
        console.log("🚀 Connection to the Admin Database is successful!");
    });


module.exports = mongoose;