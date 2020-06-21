module.exports = (req, res, next) => {
    if (req.user && req.user.emailVerificationToken) {
        req.flash('info', "You need to verify your email before this operation");
        return res.redirect('back');
    } else {
        return next();
    }    
}