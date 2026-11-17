// Provides the estimator's current rates to the public frontend.
const express = require('express');
const mongoose = require('mongoose');
const loadSettings = require('../config/settings');

const router = express.Router();

// Returns the configured rates or an error the estimator can fall back from.
router.get('/', async function (request, response) {
    if (mongoose.connection.readyState !== 1) {
        return response.status(503).json({ message: 'Rates are temporarily unavailable.' });
    }

    try {
        const settings = await loadSettings();
        return response.status(200).json(settings.toObject());
    } catch (error) {
        console.error('Could not load estimator settings:', error.message);
        return response.status(500).json({ message: 'Could not load current rates.' });
    }
});

module.exports = router;