// Checks booking page navigation without creating real bookings.
const assert = require('node:assert/strict');
const test = require('node:test');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

const bookingScript = fs.readFileSync(path.join(__dirname, '../public/js/book.js'), 'utf8');

// Creates the minimal browser state needed to submit a booking.
function createBookingPage(response) {
    const fields = {
        'booking-form': { addEventListener: function () {} },
        'booking-error': {},
        'booking-success': {},
        'booking-name': { value: 'Test User' },
        'booking-phone': { value: '9876543210' },
        'booking-email': { value: 'test@example.test' },
        'booking-address': { value: 'Test Road' },
        'booking-city': { value: 'Test City' },
        'booking-pincode': { value: '123456' },
        'booking-date': { value: '2099-12-01' },
        'booking-notes': { value: '' }
    };
    const submitButton = { disabled: false };
    const removedItems = [];
    const browser = {
        location: { href: '/book.html' },
        localStorage: { getItem: function () { return null; } },
        sessionStorage: {
            removeItem: function (key) {
                removedItems.push(key);
            }
        }
    };
    const context = vm.createContext({
        window: browser,
        document: {
            getElementById: function (id) { return fields[id]; },
            querySelector: function () { return submitButton; }
        },
        fetch: async function () { return response; },
        Intl: Intl,
        Date: Date,
        JSON: JSON
    });
    vm.runInContext(bookingScript, context);
    vm.runInContext("selectedEstimate = { inputs: {}, breakdown: { total: 50799 } };", context);
    browser.location.href = '/book.html';

    return { context: context, browser: browser, fields: fields, submitButton: submitButton, removedItems: removedItems };
}

test('successful booking redirects to My Bookings and clears the pending estimate', async function () {
    const page = createBookingPage({
        ok: true,
        json: async function () { return {}; }
    });

    await page.context.submitBooking({ preventDefault: function () {} });

    assert.equal(page.browser.location.href, '/my-bookings.html');
    assert.deepEqual(page.removedItems, ['savedEstimateToBook', 'currentEstimateToBook']);
});

test('failed booking stays on the form and can be retried', async function () {
    const page = createBookingPage({
        ok: false,
        json: async function () { return { message: 'Check the booking.' }; }
    });

    await page.context.submitBooking({ preventDefault: function () {} });

    assert.equal(page.browser.location.href, '/book.html');
    assert.equal(page.fields['booking-error'].textContent, 'Check the booking.');
    assert.equal(page.submitButton.disabled, false);
    assert.deepEqual(page.removedItems, []);
});