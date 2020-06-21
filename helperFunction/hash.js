const crypto = require('crypto');

module.exports = (token) => {
    const hash = crypto.createHash('sha3-256');
    hash.update(token);
    return hash.digest('hex');
}