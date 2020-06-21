const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const verifyPassword = require('./helperFunction/verifyPassword');
const User = require('./models/User');

passport.use(new LocalStrategy({usernameField: 'email'},
    async (email, password, done) => {
        try {
            const user = await User.findOne({ email: email }, {password: 1}).lean();

            if (user && await verifyPassword(user.password, password)) {
                return done(null, user);
            } else {
                return done(null, false, { message: 'Incorrect username or password.' });
            }
            
        } catch (err) {
            return done(err);
        }
    }
));

passport.serializeUser((user, done) => {
    done(null, user._id);
});

passport.deserializeUser((id, done) => {
    User.findById(id, (err, user) => {
        done(err, user);
    });
});

module.exports = passport;