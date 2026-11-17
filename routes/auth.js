// Handles customer registration, login, and current-account requests.
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const requireAuth = require('../middleware/auth').requireAuth;

const router = express.Router();

// Creates a response-safe account object without the password hash.
function getPublicUser(user) {
    return {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
    };
}

// Signs a short-lived access token for a registered account.
function createToken(user) {
    return jwt.sign({
        id: user._id.toString(),
        role: user.role
    }, process.env.JWT_SECRET, {
        expiresIn: '7d'
    });
}

// Confirms that account requests have a database and signing secret available.
function checkAccountServices(response) {
    if (mongoose.connection.readyState !== 1) {
        response.status(503).json({ message: 'The account service is temporarily unavailable.' });
        return false;
    }

    if (!process.env.JWT_SECRET) {
        response.status(503).json({ message: 'Sign-in is not configured yet.' });
        return false;
    }

    return true;
}

// Registers a new customer with a hashed password.
router.post('/register', async function (request, response) {
    if (!checkAccountServices(response)) {
        return;
    }

    const body = request.body || {};
    let name = '';
    let email = '';
    let phone = '';
    let password = '';

    if (typeof body.name === 'string') {
        name = body.name.trim();
    }

    if (typeof body.email === 'string') {
        email = body.email.trim().toLowerCase();
    }

    if (typeof body.phone === 'string') {
        phone = body.phone.trim();
    }

    if (typeof body.password === 'string') {
        password = body.password;
    }

    if (!name || !email || !phone || !password) {
        return response.status(400).json({ message: 'Enter your name, email, phone, and password.' });
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
        return response.status(400).json({ message: 'Enter a valid email address.' });
    }

    if (!/^\d{10}$/.test(phone)) {
        return response.status(400).json({ message: 'Enter a 10-digit phone number.' });
    }

    if (password.length < 8) {
        return response.status(400).json({ message: 'Password must be at least 8 characters.' });
    }

    try {
        const existingUser = await User.findOne({ email: email });

        if (existingUser) {
            return response.status(409).json({ message: 'An account with this email already exists.' });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const user = await User.create({
            name: name,
            email: email,
            phone: phone,
            passwordHash: passwordHash,
            role: 'customer'
        });

        return response.status(201).json({
            token: createToken(user),
            user: getPublicUser(user)
        });
    } catch (error) {
        if (error.code === 11000) {
            return response.status(409).json({ message: 'An account with this email already exists.' });
        }

        console.error('Registration failed:', error.message);
        return response.status(500).json({ message: 'Could not create your account. Please try again.' });
    }
});

// Checks credentials and returns a signed token for the account.
router.post('/login', async function (request, response) {
    if (!checkAccountServices(response)) {
        return;
    }

    const body = request.body || {};
    let email = '';
    let password = '';

    if (typeof body.email === 'string') {
        email = body.email.trim().toLowerCase();
    }

    if (typeof body.password === 'string') {
        password = body.password;
    }

    if (!email || !password) {
        return response.status(400).json({ message: 'Enter your email and password.' });
    }

    try {
        const user = await User.findOne({ email: email });

        if (!user || !await bcrypt.compare(password, user.passwordHash)) {
            return response.status(401).json({ message: 'Email or password is incorrect.' });
        }

        return response.status(200).json({
            token: createToken(user),
            user: getPublicUser(user)
        });
    } catch (error) {
        console.error('Login failed:', error.message);
        return response.status(500).json({ message: 'Could not sign you in. Please try again.' });
    }
});

// Returns the signed-in account details without password data.
router.get('/me', requireAuth, async function (request, response) {
    try {
        const user = await User.findById(request.account.id);

        if (!user) {
            return response.status(404).json({ message: 'This account could not be found.' });
        }

        return response.status(200).json({ user: getPublicUser(user) });
    } catch (error) {
        console.error('Current account lookup failed:', error.message);
        return response.status(500).json({ message: 'Could not load your account.' });
    }
});

module.exports = router;