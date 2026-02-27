const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const { registerUser, loginUser, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Local auth
router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);

// Google OAuth
router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
    prompt: 'select_account'
}));

router.get('/google/callback', passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=oauth_failed`
}), (req, res) => {
    // Generate JWT token for the authenticated user
    const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });

    // Redirect to frontend with token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/oauth/callback?token=${token}&userId=${req.user._id}&username=${encodeURIComponent(req.user.username)}&email=${encodeURIComponent(req.user.email)}`);
});

module.exports = router;
