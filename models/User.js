const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ImageSchema = new Schema({
    _id: {type: String, required: true},
    url: {type: String, required: true}
});

const TokenSchema = new Schema({
    _id: {type: String, required: true},
    expireAt: {type: Date, required: true}
});

const UserSchema = new Schema({
    email: {type: String, required: true, unique: true},
    password: {type: String, required: true, select: false},
    emailVerificationToken: {type: String, select: true},
    passwordResetToken: TokenSchema,
    displayName: {type: String, required: true},
    profileImage: ImageSchema,
    isAdmin: Boolean
}, { timestamps: { createdAt: 'createdAt' } });

module.exports = mongoose.model('User', UserSchema);