module.exports = (req, res, next) => {
    if (!req.user.isAdmin) {
        req.flash('info', "Only admin can do this");
        return res.redirect('back');
    } else {
        return next();
    }    
}