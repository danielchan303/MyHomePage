const crypto = require('crypto');

const createToken = () => {
    // create random bytes for token
    const token = crypto.randomBytes(8).toString('hex');
    // hash the token for storage
    const hash = crypto.createHash('sha3-256');
    hash.update(token);
    const hashedToken = hash.digest('hex');
    return {token: token, hash: hashedToken};
}

module.exports = createToken;