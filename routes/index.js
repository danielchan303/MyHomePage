const express = require('express');
const router = express.Router();

const argon2 = require('argon2');
const User = require('../models/User');

const hash = require('../helperFunction/hash');
const needAuth = require('../middlewares/needAuth');

// sendgrid setup
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const msg = {
  from: 'no-reply <no-reply@daniel.com>',
};

router.get('/', (req, res) => {
  // show the homepage
  res.locals.active = 'home';
  res.render('index', { title: "Daniel's Homepage" });
});

router.get('/about-me', (req, res) => {
  // show the homepage
  res.locals.active = 'aboutMe';
  res.render('aboutMe');
});

router.get('/change-password', needAuth, (req, res) => {
  // allow user to change password
  res.render('auth/changePassword', {title: "Reset Password - Daniel's Homepage"});
});

router.post('/change-password', needAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id, {password: 1});
    const passwordValid = await argon2.verify(user.password, req.body.oldPassword);

    if (passwordValid) {
      user.password = await argon2.hash(req.body.newPassword);
      await user.save();
      req.flash('success', 'Password changed successfully');
      res.redirect('back');
    } else {
      req.flash('error', 'Password is wrong');
      res.redirect('back');
    }
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
