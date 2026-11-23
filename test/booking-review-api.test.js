// Checks server-side ownership, completion, validation, and one-time review rules.
const assert = require('node:assert/strict');
const test = require('node:test');
const express = require('express');
const jwt = require('jsonwebtoken');
const Booking = require('../models/Booking');
const bookingRoutes = require('../routes/bookings');

const customerId = '507f1f77bcf86cd799439011';
const bookingId = '507f1f77bcf86cd799439012';
const previousSecret = process.env.JWT_SECRET;
const originalFindOneAndUpdate = Booking.findOneAndUpdate;
const originalFindOne = Booking.findOne;
let server;
let baseUrl;
let updateResult;
let lookupResult;
let updateFilter;
let updateDocument;
let updateCalls;

const app = express();
app.use(express.json());
app.use('/api/bookings', bookingRoutes);

test.before(async function () {
    process.env.JWT_SECRET = 'review-test-secret';
    Booking.findOneAndUpdate = async function (filter, update) {
        updateCalls += 1;
        updateFilter = filter;
        updateDocument = update;
        return updateResult;
    };
    Booking.findOne = async function () { return lookupResult; };

    await new Promise(function (resolve) {
        server = app.listen(0, function () {
            baseUrl = 'http://127.0.0.1:' + server.address().port;
            resolve();
        });
    });
});

test.after(async function () {
    Booking.findOneAndUpdate = originalFindOneAndUpdate;
    Booking.findOne = originalFindOne;

    if (previousSecret === undefined) {
        delete process.env.JWT_SECRET;
    } else {
        process.env.JWT_SECRET = previousSecret;
    }

    await new Promise(function (resolve) { server.close(resolve); });
});

async function submitReview(body) {
    const token = jwt.sign({ id: customerId, role: 'customer' }, process.env.JWT_SECRET);
    return fetch(baseUrl + '/api/bookings/' + bookingId + '/review', {
        method: 'POST',
        headers: {
            Authorization: 'Bearer ' + token,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });
}

test('a valid review is atomically saved to the customer-owned completed booking', async function () {
    const review = {
        rating: 4,
        experience: 'The finish looks great.',
        submittedAt: new Date('2026-11-23T12:00:00.000Z')
    };
    updateResult = { toObject: function () { return { _id: bookingId, status: 'completed', review: review }; } };
    lookupResult = null;
    updateCalls = 0;

    const response = await submitReview({ rating: 4, experience: 'The finish looks great.' });
    const result = await response.json();

    assert.equal(response.status, 201);
    assert.equal(result.booking.review.rating, 4);
    assert.equal(updateFilter.user, customerId);
    assert.equal(updateFilter.status, 'completed');
    assert.deepEqual(updateFilter.review, { $exists: false });
    assert.equal(updateDocument.$set.review.experience, 'The finish looks great.');
    assert.ok(updateDocument.$set.review.submittedAt instanceof Date);
});

test('invalid ratings are rejected before database updates', async function () {
    updateCalls = 0;

    const response = await submitReview({ rating: 6, experience: 'Too many stars.' });

    assert.equal(response.status, 400);
    assert.equal(updateCalls, 0);
});

test('uncompleted bookings and previously reviewed bookings are rejected', async function () {
    updateResult = null;
    lookupResult = { status: 'confirmed', review: undefined };
    let response = await submitReview({ rating: 5, experience: '' });
    assert.equal(response.status, 400);

    lookupResult = { status: 'completed', review: { rating: 5 } };
    response = await submitReview({ rating: 5, experience: '' });
    assert.equal(response.status, 409);
});

test('customers cannot review bookings they do not own', async function () {
    updateResult = null;
    lookupResult = null;

    const response = await submitReview({ rating: 5, experience: '' });

    assert.equal(response.status, 404);
    assert.equal(updateFilter.user, customerId);
});