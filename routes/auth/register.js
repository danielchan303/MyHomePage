const express = require('express');
const router = express.Router();

// sendgrid setup
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const msg = {
    from: 'no-reply <no-reply@daniel.com>',
};

// form validation
const validate = require('validate.js');
var registerConstraint = {
    email: {email: true, presence: {allowEmpty: false}},
    confirmEmail: {equality: "email", presence: {allowEmpty: false}},
    password: {length: {minimum: 8}, presence: {allowEmpty: false}},
    confirmPassword: {equality: "password", presence: {allowEmpty: false}},
    displayName: {presence: {allowEmpty: false}}
}

// create hash
const createToken = require('../../helperFunction/createToken');
const createPasswordHash = require('../../helperFunction/createPasswordHash');

// send verification email
const sendVerificationEmail = (to, token) => {
    sgMail.send({
        ...msg,
        to: to,
        templateId: 'd-01bbb4d5d20549d282e0422c3f9c764b',
        dynamic_template_data: { token: token }
    });
}

const needAuth = require('../../middlewares/needAuth');
const recaptcha = require('../../middlewares/recaptcha');

const User = require('../../models/User');

router.get('/register', (req, res) => {
    // if already login, redirect
    if (req.user) { return res.redirect('/blog'); }
    // set it as active route
    res.locals.active = 'register';
    // send back the form data to user
    const formData = req.flash('formData');
    // render the register page
    res.render('auth/register', { title: "Register - Daniel's Homepage", formData: formData[0] });
});

router.post('/register', recaptcha, async (req, res) => {
    // if already login, redirect
    if (req.user) { return res.redirect('/blog'); }
    // check the input
    const errors = validate(req.body, registerConstraint);
    if (errors) {
        let displayMessage = [];
        for (let error of Object.values(errors)) {
            displayMessage.push(error[0]);
        }
        displayMessage = displayMessage.join('<br>');

        req.flash('formData', req.body);
        req.flash('error', displayMessage);
        return res.redirect('back');
    }
    // create user
    const { token, hash } = createToken();
    User.create({
        email: req.body.email,
        password: await createPasswordHash(req.body.password),
        emailVerificationToken: hash,
        displayName: req.body.displayName
    }).then(user => {
        // send verification email        
        sendVerificationEmail(req.body.email, token);
        // flash success msg
        req.flash('success', 'Verification email has been sent to your mail box');
        // login the user
        req.login(user, err => { if (err) { return next(error); } });
        // redirect the user
        res.redirect('/blog');
    }).catch(err => {
        if (err.code === 11000) {
            // email already registered
            req.flash('error', 'Email has already been registered.');
            req.flash('formData', req.body);
            res.redirect('back');
        } else {
            // database error
            next(new Error('Some errors have occured, please try again later'));
        }
    });
});

router.get('/email-verification', async (req, res, next) => {
    // email verification
    try {
        let response;
        if (req.query.token) {
            const hashedToken = hash(req.query.token);
            response = await User.updateOne({ emailVerificationToken: hashedToken }, { '$unset': { emailVerificationToken: "" } });
        }
        res.render('auth/emailVerification', { title: "Email Verification - Daniel's Homepage", isValid: response.nModified });
    } catch (error) {
        return next(error);
    }
});

router.post('/resend-email-verification', needAuth, async (req, res) => {
    // redirect if email is already verified
    if (res.locals.isEmailVerified) { return res.redirect('/blog'); }
    try {
        const { token, hash } = createToken();
        const response = await User.updateOne({ _id: req.user._id }, { emailVerificationToken: hash });
        if (response.nModified) {
            sendVerificationEmail(req.user, token);
            req.flash('success', 'Verification email have been sent!');
            res.redirect('/blog');
        } else {
            return next(new Error('Something wrong has occured, please try again later'));
        }
    } catch (error) {
        return next(new Error('Something wrong has occured, please try again later'));
    }
});

module.exports = router;