const axios = require('axios');
const querystring = require('querystring');

module.exports = async (req, res, next) => {
    // check the recaptcha
    const url = 'https://www.google.com/recaptcha/api/siteverify';
    const response = await axios.post(url, querystring.stringify({ secret: process.env.RECAPTCHA_API_KEY, response: req.body['g-recaptcha-response'], remoteip: req.ip }))
    if (!response.data.success) {
        req.flash('error', 'recaptcha failed');
        req.flash('formData', req.body);
        return res.redirect('back');
    }
    next();
}