const { v4: uuid } = require('uuid');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

const HttpError = require('../models/http-error');
const getCoordsForAddress = require('../util/location');
const Place = require('../models/place');
const User = require('../models/user');
const user = require('../models/user');

// let DUMMY_PLACES = [
//     {
//         id: 'p1',
//         title: 'TRX Exchange',
//         description: 'Once of the high sky scappers in the world!',
//         imageUrl: 'https://assets.nst.com.my/images/articles/exchangtr_1656388298.jpg',
//         address: 'Unit M-02, Level 2, TREC Multi Level Building, 438, Jln Tun Razak, Tun Razak Exchange, 50400 Kuala Lumpur',
//         location: {
//             lat: 3.1392666,
//             lng: 101.721416
//         },
//         creator: 'u1'
//     },

//     {
//         id: 'p2',
//         title: 'PNB 118',
//         description: 'Second tallest building in the world!',
//         imageUrl: 'https://www.moment-solutions.com/wp-content/uploads/2018/02/KL118-118-Floors.jpg',
//         address: 'Cangkat Stadium, City Centre, 50150 Kuala Lumpur, Wilayah Persekutuan Kuala Lumpur',
//         location: {
//             lat: 3.1392666,
//             lng: 101.721416
//         },
//         creator: 'u2'
//     }
// ];

// const getPlaces = async (req, res, next) => {

//     const place = await Place.find();
//     res.json({ place });
// }

const getPlaceById = async (req, res, next) => {
    const placeId = req.params.pid;  //{ pid : 'p1'}

    let place;
    // //Dummy Data Function Calling Method
    // const place = DUMMY_PLACES.find(p => {
    //     return p.id === placeId;
    // });

    try {
        place = await Place.findById(placeId);
    } catch (err) {
        const error = new HttpError('Something went wrong, could not find a place', 500);

        return next(error);
    }

    if (!place) {
        // //'return' means that the code will not proceed to next line of code once it has been executed
        // // return res.status(404).json({ message: 'Could not find a place for the provided id' });
        // const error = new Error('Could not find a place for the provided id.');
        // error.code = 404;
        // throw error;

        const error = new HttpError('Could not find a place for the provided id.', 404);
        return next(error);
    }

    // res.json({ message: 'Hello World' });
    //Use toObject is to convert from mongo javascript to normal javascript so that the _id becomes id
    res.json({ place: place.toObject({ getters: true }) });
};

const getPlacesByUserId = async (req, res, next) => {
    const userId = req.params.uid;
    // let places;
    let userWithPlaces;

    // //Dummy Data Function Calling Method
    // const places = DUMMY_PLACES.filter(p => {
    //     return p.creator === userId;
    // });

    try {
        // places = await Place.find({ creator: userId });
        userWithPlaces = await User.findById(userId).populate('places');
    } catch (err) {
        const error = new HttpError('Fetching places failed, please try again later', 500);
        return next(error);
    }

    if (!userWithPlaces || userWithPlaces.places.length === 0) {
        // const error = new Error('Could not find a place for the provided user id.');
        // error.code = 404;
        // return next(error);
        return next(new HttpError('Could not find a place for the provided user id.', 404));
    }

    //Use map + toObject is to convert from mongo javascript to normal javascript so that the _id becomes id
    res.json({ places: userWithPlaces.places.map(place => place.toObject({ getters: true })) });
};

//make the function to async so that we can use await
const createPlace = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        // console.log(errors);
        return next(new HttpError('Invalid inputs passed, please check your data.', 422));
    }

    const { title, description, address, creator } = req.body;
    //const title = req.body.title;

    let coordinates;
    try {
        coordinates = await getCoordsForAddress(address);
    } catch (error) {
        return next(error);
    }


    // const createdPlace = {
    //     id: uuid(),
    //     title,
    //     description,
    //     location: coordinates,
    //     address,
    //     creator
    // };

    const createdPlace = new Place({
        title,
        description,
        address,
        location: coordinates,
        image: 'https://assets.nst.com.my/images/articles/exchangtr_1656388298.jpg',
        creator
    });

    // DUMMY_PLACES.push(createdPlace);

    //Check existance of user 
    let user;

    try {
        user = await User.findById(creator);
    } catch (err) {
        const error = new HttpError('Creating place failed, please try again', 500);
        return next(error);
    }

    if (!user) {
        const error = new HttpError('Could not find user for provided id', 404);
        return next(error);
    }

    console.log(user);
    const sess = await mongoose.startSession();
    try {
        // await createdPlace.save();

        sess.startTransaction();
        await createdPlace.save({ session: sess });
        user.places.push(createdPlace);
        await user.save({ session: sess });
        await sess.commitTransaction();

    } catch (err) {
        console.log(err);
        const error = new HttpError('Creating SESSIOn failed, please try again.', 500);
        await sess.abortTransaction();
        //stop the program to proceed when there is an error occurred
        return next(error);
    }
    sess.endSession();


    res.status(201).json({ place: createdPlace });
};

const updatePlaceById = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(
            new HttpError('Invalid inputs passed, please check your data.', 422)
        );
    }

    const { title, description } = req.body;
    const placeId = req.params.pid;

    let place;
    try {
        place = await Place.findById(placeId);
    } catch (err) {
        const error = new HttpError(
            'Something went wrong, could not update place.',
            500
        );
        return next(error);
    }

    place.title = title;
    place.description = description;

    try {
        await place.save();
    } catch (err) {
        const error = new HttpError(
            'Something went wrong, could not update place.',
            500
        );
        return next(error);
    }

    res.status(200).json({ place: place.toObject({ getters: true }) });

};

const deletePlaceById = async (req, res, next) => {
    const placeId = req.params.pid;
    // if (!DUMMY_PLACES.find(p => p.id === placeId)) {
    //     throw new HttpError('Could not find a place for that id', 404);
    // };
    // DUMMY_PLACES = DUMMY_PLACES.filter(p => p.id !== placeId);

    let place;

    try {
        //populate: is method to get access to that particular attr stored in the entire documents of mongodb
        place = await Place.findById(placeId).populate('creator');
    } catch (err) {
        const error = new HttpError('Something went wrong, could not delete place', 500);
        return next(error);
    }

    if (!place) {
        const error = new HttpError('Could not find place for that id', 404);
        return next(error);
    }

    const sess = await mongoose.startSession();
    try {
        // await place.remove();
        sess.startTransaction();
        await place.remove({ session: sess });
        place.creator.places.pull(place) //push: remove the id
        await place.creator.save({ session: sess });
        await sess.commitTransaction();
    } catch (err) {
        const error = new HttpError('Something went wrong, could not update place', 500);
        await sess.abortTransaction();
        return next(error);
    }
    sess.endSession();


    res.status(200).json({ message: 'Deleted Place' });
};

// exports.getPlaces = getPlaces;
exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlaceById = updatePlaceById;
exports.deletePlaceById = deletePlaceById;