// Creates and manages bookings owned by signed-in customers.
const express = require('express');
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Estimate = require('../models/Estimate');
const auth = require('../middleware/auth');
const verifyEstimate = require('../config/estimate-validation');

const router = express.Router();
router.use(auth.requireAuth, auth.requireCustomer);

// Creates a booking from a saved estimate or a current browser estimate.
router.post('/', async function (request, response) {
    const body = request.body || {};
    const contact = body.contact || {};
    const address = body.address || {};
    let name = '';
    let phone = '';
    let email = '';
    let addressLine = '';
    let city = '';
    let pincode = '';
    let preferredDate = '';

    if (typeof contact.name === 'string') {
        name = contact.name.trim();
    }

    if (typeof contact.phone === 'string') {
        phone = contact.phone.trim();
    }

    if (typeof contact.email === 'string') {
        email = contact.email.trim().toLowerCase();
    }

    if (typeof address.line === 'string') {
        addressLine = address.line.trim();
    }

    if (typeof address.city === 'string') {
        city = address.city.trim();
    }

    if (typeof address.pincode === 'string') {
        pincode = address.pincode.trim();
    }

    if (typeof body.preferredStartDate === 'string') {
        preferredDate = body.preferredStartDate;
    }

    if (!name || !/^\d{10}$/.test(phone) || !/^\S+@\S+\.\S+$/.test(email)) {
        return response.status(400).json({ message: 'Enter a name, valid email, and 10-digit phone number.' });
    }

    if (!addressLine || !city || !/^\d{6}$/.test(pincode)) {
        return response.status(400).json({ message: 'Enter your address, city, and 6-digit pincode.' });
    }

    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    const startDate = new Date(preferredDate + 'T00:00:00.000Z');
    const today = new Date().toISOString().slice(0, 10);

    if (!datePattern.test(preferredDate) || Number.isNaN(startDate.getTime()) || startDate.toISOString().slice(0, 10) !== preferredDate || preferredDate < today) {
        return response.status(400).json({ message: 'Choose a start date that is today or later.' });
    }

    if (typeof body.notes === 'string' && body.notes.length > 500) {
        return response.status(400).json({ message: 'Notes must be 500 characters or fewer.' });
    }

    try {
        let estimateSnapshot = null;

        if (body.estimateId) {
            if (!mongoose.Types.ObjectId.isValid(body.estimateId)) {
                return response.status(404).json({ message: 'Saved estimate not found.' });
            }

            const estimate = await Estimate.findOne({
                _id: body.estimateId,
                user: request.account.id
            });

            if (!estimate) {
                return response.status(404).json({ message: 'Saved estimate not found.' });
            }

            estimateSnapshot = {
                inputs: estimate.inputs,
                breakdown: estimate.breakdown
            };
        } else if (body.inputs && body.breakdown) {
            const calculated = await verifyEstimate(body.inputs, body.breakdown);
            estimateSnapshot = {
                inputs: body.inputs,
                breakdown: calculated
            };
        } else {
            return response.status(400).json({ message: 'Choose or calculate an estimate before booking.' });
        }

        let notes = '';

        if (typeof body.notes === 'string') {
            notes = body.notes.trim();
        }

        const booking = await Booking.create({
            user: request.account.id,
            estimateSnapshot: estimateSnapshot,
            contact: {
                name: name,
                phone: phone,
                email: email
            },
            address: {
                line: addressLine,
                city: city,
                pincode: pincode
            },
            preferredStartDate: startDate,
            notes: notes
        });

        return response.status(201).json({ booking: booking.toObject() });
    } catch (error) {
        if (error.statusCode === 400) {
            return response.status(400).json({ message: error.message });
        }

        console.error('Could not create booking:', error.message);
        return response.status(500).json({ message: 'Could not create your booking.' });
    }
});

// Lists only the signed-in customer's bookings.
router.get('/mine', async function (request, response) {
    try {
        const bookings = await Booking.find({ user: request.account.id }).sort({ createdAt: -1 }).lean();
        return response.status(200).json({ bookings: bookings });
    } catch (error) {
        console.error('Could not load bookings:', error.message);
        return response.status(500).json({ message: 'Could not load your bookings.' });
    }
});

// Lets customers cancel only their own pending bookings.
router.patch('/:id/cancel', async function (request, response) {
    if (!mongoose.Types.ObjectId.isValid(request.params.id)) {
        return response.status(404).json({ message: 'Booking not found.' });
    }

    try {
        const booking = await Booking.findOne({
            _id: request.params.id,
            user: request.account.id
        });

        if (!booking) {
            return response.status(404).json({ message: 'Booking not found.' });
        }

        if (booking.status !== 'pending') {
            return response.status(400).json({ message: 'Only pending bookings can be cancelled.' });
        }

        booking.status = 'cancelled';
        await booking.save();
        return response.status(200).json({ booking: booking.toObject() });
    } catch (error) {
        console.error('Could not cancel booking:', error.message);
        return response.status(500).json({ message: 'Could not cancel this booking.' });
    }
});

module.exports = router;