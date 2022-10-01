const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const placesRoutes = require('./routes/places-routes');
const userRoutes = require('./routes/users-routes');
const HttpError = require('./models/http-error');

const app = express();

app.use(bodyParser.json());

// app.use(bodyParser.urlencoded({ extended: false }));

//CORS issue: Allow frontend to communicate in different ports
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*'); //Open to any domain
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE');
    next();
});

app.use('/api/places', placesRoutes);
app.use('/api/users', userRoutes);

//Create our own error message when there is any error due to incorrect url
app.use((req, res, next) => {
    const error = new HttpError('Could not find this route', 404);
    throw error;
});

//When there are 4 params (error), express.js will treat it as error handle middleware function
app.use((error, req, res, next) => {
    if (res.headerSent) {
        return next(error);
    }
    res.status(error.code || 500);
    res.json({ message: error.message || 'An unknown error occurred!' });
});

const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;
const dbName = process.env.DB_NAME;

mongoose
    // .connect('mongodb://localhost:27017/places', { useNewUrlParser: true })
    .connect(
        'mongodb+srv://' + dbUser + ':' + dbPassword + '@cluster0.evqqz.mongodb.net/' + dbName + '?retryWrites=true&w=majority'
    )
    .then(() => {
        app.listen(process.env.PORT || 4000);
    })
    .catch(err => {
        console.log(err);
    });

