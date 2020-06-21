module.exports = (req, res, next) => {
    if (!req.user) {
        req.flash('info', "You need to login to do this operation");
        return res.redirect('/login');
    } else {
        return next();
    }    
}