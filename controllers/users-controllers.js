// const express = require('express');
const { v4: uuid } = require('uuid');
const { validationResult } = require('express-validator');

const HttpError = require('../models/http-error');
const User = require('../models/user');

const DUMMY_USERS = [
    {
        id: 'u1',
        name: 'Max Awell',
        email: 'max@test.com',
        password: 'testers'
    }
];


const getUsers = async (req, res, next) => {
    // res.json({ users: DUMMY_USERS });
    let users;

    try {
        users = await User.find({}, '-password'); //-password: Get all except password
    } catch (err) {
        const error = new HttpError('Fetching users failed, please try again later.', 500);
        return next(error);
    }
    res.json({ users: users.map(user => user.toObject({ getters: true })) }); //since find returns an array, so cannot convert to object

};

const signUp = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(errors);
        return next(
            new HttpError('Invalid inputs passed, please check your data.', 422)
        );
    }

    const { name, email, password } = req.body;

    // const hasUser = DUMMY_USERS.find(u => u.email === email);
    // if (hasUser) {
    //     throw new HttpError('Could not create user, email already exists', 422);
    // }

    let existingUser;

    try {
        existingUser = await User.findOne({ email: email });
    } catch (err) {
        const error = new HttpError('Signing up failed, Please try again later.', 500);
        return next(error);
    }

    if (existingUser) {
        const error = new HttpError('User exists already, please login instead', 422);
        return next(error);
    }

    // const createdUser = {
    //     id: uuid,
    //     name,
    //     email,
    //     password
    // };

    // DUMMY_USERS.push(createdUser);

    const createdUser = new User({
        name,
        email,
        image: 'https://assets.nst.com.my/images/articles/exchangtr_1656388298.jpg',
        password,
        places: []
    });

    try {
        await createdUser.save();
    } catch (err) {
        const error = new HttpError('Signing up failed, please try again', 500)
        return next(error);
    }

    res.status(201).json({ user: createdUser.toObject({ getters: true }) }); //getters: let us to easy access to "_id"
};

const login = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(errors);
        return next(new HttpError('Invalid inputs passed, please check your data.', 422));
    }

    const { email, password } = req.body;

    // const identifiedUser = DUMMY_USERS.find(u => u.email === email);
    // if (!identifiedUser || identifiedUser.password !== password) {
    //     throw new HttpError('Could not identify user, credentials seem to be wrong', 401);
    // }

    let existingUser;

    try {
        existingUser = await User.findOne({ email: email });
    } catch (err) {
        const error = new HttpError('Logging in failed, please try again later.', 500);
        return next(error);
    }

    if (!existingUser || existingUser.password !== password) {
        const error = new HttpError('Invalid credentials, could not log you in.', 401);
        return next(error);
    }

    res.json({ message: 'Logged in!', user: existingUser.toObject({ getters: true }) });
};

exports.getUsers = getUsers;
exports.signUp = signUp;
exports.login = login;