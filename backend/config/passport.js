const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
require('dotenv').config();
passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.BACKEND_URL}/api/auth/google/callback`,
    scope: ['profile', 'email']
}, async (accessToken, refreshToken, profile, done) => {
    try {
        // Check if user already exists with this Google ID
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
            return done(null, user);
        }

        // Check if user exists with same email
        user = await User.findOne({ email: profile.emails[0].value });
        if (user) {
            // Link Google account to existing user
            user.googleId = profile.id;
            user.avatar = profile.photos[0]?.value;
            if (user.authProvider === 'local') {
                user.authProvider = 'google';
            }
            await user.save();
            return done(null, user);
        }

        // Create new user
        let baseUsername = profile.displayName;
        let username = baseUsername;
        let counter = 1;

        while (await User.findOne({ username })) {
            username = `${baseUsername} ${counter}`;
            counter++;
        }

        user = await User.create({
            googleId: profile.id,
            username,
            email: profile.emails[0].value,
            avatar: profile.photos[0]?.value,
            authProvider: 'google'
        });

        done(null, user);
    } catch (err) {
        done(err, null);
    }
}));

module.exports = passport;
