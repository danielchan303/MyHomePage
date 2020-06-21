const express = require('express');
const router = express.Router();

const passport = require('passport');

const recaptcha = require('../../middlewares/recaptcha');

router.get('/login', (req, res) => {
    // if already login, redirect
    if (req.user) {
        return res.redirect('/blog');
    }
    // store where it comes from
    const referer = req.get('Referer');
    if (referer) {
        const from = new URL(referer);
        if (from.pathname !== '/login' && from.hostname === req.hostname) {
            req.session.from = from;
        }
    }
    // show the login page to user
    res.locals.active = 'login';
    res.render('auth/login', { title: "Login - Daniel's Homepage" });
});

router.post('/login', recaptcha, async (req, res, next) => {
    // if already login, redirect
    if (req.user) {
        return res.redirect('/blog');
    }

    passport.authenticate('local', (err, user, info) => {
        if (err) {
            // database error
            return next(err);
        }
        if (!user) {
            // wrong email or password
            req.flash('error', 'Wrong email or password');
            return res.redirect('/login');
        }
        req.logIn(user, (err) => {
            // login the user if alright
            if (err) { return next(err); }
            return res.redirect(req.session.from || '/blog');
        });
    })(req, res, next);
});

router.get('/logout', (req, res) => {
    // logout
    req.logout();
    res.redirect('back');
});

module.exports = router;