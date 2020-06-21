const argon2 = require('argon2');

const createPasswordHash = async (password) => {
    return await argon2.hash(password, {
        type: argon2.argon2id
    });
};

module.exports = createPasswordHash;