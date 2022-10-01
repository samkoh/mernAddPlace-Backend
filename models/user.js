const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const Schema = mongoose.Schema;

const userSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true }, //unique: create index for email to speed up the query process time. 
    password: { type: String, required: true, minlength: 6 },
    image: { type: String, required: true },
    // places: { type: String, required: true }
    places: [{ type: mongoose.Types.ObjectId, required: true, ref: 'Place' }]
});

userSchema.plugin(uniqueValidator);

module.exports = mongoose.model('User', userSchema);