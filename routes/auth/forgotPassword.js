const express = require('express')
const router = express.Router();

const moment = require('moment');
const validate = require('validate.js');

// hash function
const hash = require('../../helperFunction/hash');
const createToken = require('../../helperFunction/createToken');
const createPasswordHash = require('../../helperFunction/createPasswordHash');

// sendgrid setup
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const msg = {
    from: 'no-reply <no-reply@daniel.com>',
};

const User = require('../../models/User');

router.get('/forgot-password', (req, res) => {
    // redirect if login already
    if (req.user) {
      return res.redirect('/blog');
    }
    // show forgot password form
    res.render('auth/forgotPassword', {title: "Forgot Password - Daniel's Homepage"});
});

router.post('/forgot-password', async (req, res, next) => {
    const constraint = {email: {email: true, presence: true}};
    const errors = validate(req.body, constraint);
    if (errors) {
        req.flash('error', 'The email you typed is not correct');
        return res.redirect('back');
    }

    const {token, hash} = createToken();
    const expireAt = moment().add(15, 'm');
    const user = await User.findOneAndUpdate({email: req.body.email}, 
      {passwordResetToken: {_id: hash, expireAt: expireAt}});
    if (user) {
      sgMail.send({
        ...msg,
        to: req.body.email,
        templateId: 'd-f5a78f2cb5904882934295468c384482',
        dynamic_template_data: {_id: user._id, token: token}
      });
    }
    req.flash('success', 'Reset password email has been sent.')
    res.redirect('back');
});

router.get('/reset-password', async (req, res, next) => {
    try {
        let valid = false;
        if (req.query._id && req.query.token) {
            let hashedToken = hash(req.query.token);
            valid = await User.exists({_id: req.query._id, 'passwordResetToken._id': hashedToken, 'passwordResetToken.expireAt': {$gte: new Date}});
        }
        res.render('auth/resetPassword', {title: "Reset Password - Daniel's Homepage", valid: valid, _id: req.query._id , token: req.query.token });
    } catch (error) {
        return next(error);
    }
});

router.post('/reset-password', async (req, res, next) => {
    try {
        if (req.body._id && req.body.token) {
            const hashedToken = hash(req.body.token);
            const passwordHash = await createPasswordHash(req.body.newPassword);
            response = await User.updateOne({_id: req.body._id, 'passwordResetToken._id': hashedToken, 'passwordResetToken.expireAt': {$gte: new Date}},
                {$set: {password: passwordHash}, $unset: {passwordResetToken: 1}});
            if (response.nModified) {
                req.flash('success', 'New password is set successfully');
                res.redirect('/login');
            } else {
                req.flash('error', 'Token invalid or expired');
                res.redirect('/forgot-password');
            }
        }
    } catch (error) {
        return next(error);
    }
});

module.exports = router;