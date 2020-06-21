module.exports = (req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.moment = require('moment');
    return next();
}