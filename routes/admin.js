// Provides administrator-only booking management and rate editing.
const express = require('express');
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const loadSettings = require('../config/settings');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth.requireAuth, auth.requireAdmin);

// Confirms a rate is a finite, non-negative number.
function isValidRate(value) {
    return value !== '' && Number.isFinite(Number(value)) && Number(value) >= 0;
}

// Lists all bookings for the administrator dashboard.
router.get('/bookings', async function (request, response) {
    try {
        const bookings = await Booking.find({}).sort({ createdAt: -1 }).lean();
        return response.status(200).json({ bookings: bookings });
    } catch (error) {
        console.error('Could not load admin bookings:', error.message);
        return response.status(500).json({ message: 'Could not load bookings.' });
    }
});

// Updates a booking to one of the allowed administrator statuses.
router.patch('/bookings/:id/status', async function (request, response) {
    if (!mongoose.Types.ObjectId.isValid(request.params.id)) {
        return response.status(404).json({ message: 'Booking not found.' });
    }

    const status = request.body && request.body.status;
    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];

    if (!validStatuses.includes(status)) {
        return response.status(400).json({ message: 'Choose a valid booking status.' });
    }

    try {
        const booking = await Booking.findById(request.params.id);

        if (!booking) {
            return response.status(404).json({ message: 'Booking not found.' });
        }

        booking.status = status;
        await booking.save();
        return response.status(200).json({ booking: booking.toObject() });
    } catch (error) {
        console.error('Could not update booking status:', error.message);
        return response.status(500).json({ message: 'Could not update booking status.' });
    }
});

// Updates only the administrator-editable rate fields.
router.put('/settings', async function (request, response) {
    const body = request.body || {};
    const qualities = body.qualities;
    const qualityKeys = ['economy', 'premium', 'luxury'];

    if (!qualities || typeof qualities !== 'object') {
        return response.status(400).json({ message: 'Enter the quality rates.' });
    }

    for (let index = 0; index < qualityKeys.length; index += 1) {
        const quality = qualities[qualityKeys[index]];

        if (!quality || !isValidRate(quality.paint) || !isValidRate(quality.labour)) {
            return response.status(400).json({ message: 'Paint and labour rates must be zero or greater.' });
        }

        if (!Number.isInteger(Number(quality.stars)) || Number(quality.stars) < 1 || Number(quality.stars) > 5) {
            return response.status(400).json({ message: 'Stars must be a whole number from 1 to 5.' });
        }
    }

    const editableRates = [
        'puttyRate',
        'primerRate',
        'customDesignRatePerSqFt',
        'extraColourFee'
    ];

    for (let index = 0; index < editableRates.length; index += 1) {
        if (!isValidRate(body[editableRates[index]])) {
            return response.status(400).json({ message: 'Undercoat and add-on rates must be zero or greater.' });
        }
    }

    try {
        const settings = await loadSettings();
        const updatedQualities = settings.qualities;

        for (let index = 0; index < qualityKeys.length; index += 1) {
            const key = qualityKeys[index];
            updatedQualities[key].paint = Number(qualities[key].paint);
            updatedQualities[key].labour = Number(qualities[key].labour);
            updatedQualities[key].stars = Number(qualities[key].stars);
        }

        settings.qualities = updatedQualities;
        settings.puttyRate = Number(body.puttyRate);
        settings.primerRate = Number(body.primerRate);
        settings.customDesignRatePerSqFt = Number(body.customDesignRatePerSqFt);
        settings.extraColourFee = Number(body.extraColourFee);
        settings.markModified('qualities');
        await settings.save();
        return response.status(200).json({ settings: settings.toObject() });
    } catch (error) {
        console.error('Could not update estimator rates:', error.message);
        return response.status(500).json({ message: 'Could not save the new rates.' });
    }
});

module.exports = router;