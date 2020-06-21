const argon2 = require('argon2');

const verifyPassword = async (hash, password) => {
    console.log(hash, password);
    try {
        if (await argon2.verify(hash, password)) {
            return true;
        } else {
            console.log('auth failed');
            return false;
        }
    } catch (err) {
        throw new Error('Internal Error');
    }
}

module.exports = verifyPassword;