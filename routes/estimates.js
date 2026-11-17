// Saves and manages estimates owned by the signed-in customer.
const express = require('express');
const mongoose = require('mongoose');
const Estimate = require('../models/Estimate');
const verifyEstimate = require('../config/estimate-validation');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth.requireAuth, auth.requireCustomer);

// Saves a validated estimate after recalculating it on the server.
router.post('/', async function (request, response) {
    const body = request.body || {};

    if (!body.inputs || !body.breakdown) {
        return response.status(400).json({ message: 'Estimate details are incomplete.' });
    }

    if (mongoose.connection.readyState !== 1) {
        return response.status(503).json({ message: 'Saving is temporarily unavailable.' });
    }

    try {
        const calculated = await verifyEstimate(body.inputs, body.breakdown);

        const estimate = await Estimate.create({
            user: request.account.id,
            inputs: body.inputs,
            breakdown: calculated
        });

        return response.status(201).json({ estimate: estimate.toObject() });
    } catch (error) {
        if (error.statusCode === 400) {
            return response.status(400).json({ message: error.message });
        }

        console.error('Could not save estimate:', error.message);
        return response.status(500).json({ message: 'Could not save this estimate.' });
    }
});

// Lists only the signed-in customer's estimates.
router.get('/mine', async function (request, response) {
    try {
        const estimates = await Estimate.find({ user: request.account.id }).sort({ createdAt: -1 }).lean();
        return response.status(200).json({ estimates: estimates });
    } catch (error) {
        console.error('Could not load estimates:', error.message);
        return response.status(500).json({ message: 'Could not load your estimates.' });
    }
});

// Deletes one estimate only when it belongs to the signed-in customer.
router.delete('/:id', async function (request, response) {
    if (!mongoose.Types.ObjectId.isValid(request.params.id)) {
        return response.status(404).json({ message: 'Estimate not found.' });
    }

    try {
        const estimate = await Estimate.findOneAndDelete({
            _id: request.params.id,
            user: request.account.id
        });

        if (!estimate) {
            return response.status(404).json({ message: 'Estimate not found.' });
        }

        return response.status(200).json({ message: 'Estimate deleted.' });
    } catch (error) {
        console.error('Could not delete estimate:', error.message);
        return response.status(500).json({ message: 'Could not delete this estimate.' });
    }
});

module.exports = router;