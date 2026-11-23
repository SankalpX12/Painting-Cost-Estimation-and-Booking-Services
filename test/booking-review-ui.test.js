// Checks that completed bookings expose a working, one-time customer review flow.
const assert = require('node:assert/strict');
const test = require('node:test');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

const bookingScript = fs.readFileSync(path.join(__dirname, '../public/js/my-bookings.js'), 'utf8');

class FakeElement {
    constructor(tagName) {
        this.tagName = tagName;
        this.children = [];
        this.listeners = {};
        this.dataset = {};
        this.attributes = {};
        this.hidden = false;
    }

    appendChild(child) {
        child.parent = this;
        this.children.push(child);
        return child;
    }

    removeChild(child) {
        this.children = this.children.filter(function (item) { return item !== child; });
        child.parent = null;
        return child;
    }

    addEventListener(name, callback) {
        this.listeners[name] = callback;
    }

    setAttribute(name, value) {
        this.attributes[name] = value;
    }
}

function findElements(root, predicate) {
    return [root].concat(...root.children.map(function (child) {
        return findElements(child, predicate);
    })).filter(predicate);
}

function getText(root) {
    return root.textContent + root.children.map(getText).join(' ');
}

function createBookingsPage(bookings, reviewResponse) {
    const bookingList = new FakeElement('div');
    const message = new FakeElement('p');
    const logout = new FakeElement('button');
    const fields = {
        'booking-list': bookingList,
        'bookings-message': message,
        'bookings-logout': logout
    };
    const requests = [];
    const context = vm.createContext({
        window: {
            localStorage: { getItem: function () { return 'test-token'; } },
            location: { href: '' }
        },
        document: {
            getElementById: function (id) { return fields[id]; },
            createElement: function (tagName) { return new FakeElement(tagName); }
        },
        fetch: async function (url, options) {
            requests.push({ url: url, options: options });

            if (options.method === 'GET') {
                return { ok: true, json: async function () { return { bookings: bookings }; } };
            }

            return { ok: true, json: async function () { return reviewResponse; } };
        },
        Intl: Intl,
        Date: Date,
        JSON: JSON
    });

    vm.runInContext(bookingScript, context);
    return { bookingList: bookingList, context: context, requests: requests };
}

async function waitForBookings() {
    await new Promise(function (resolve) { setImmediate(resolve); });
}

test('completed bookings accept a rating and then show the saved experience', async function () {
    const review = { rating: 5, experience: 'Careful work and a tidy finish.' };
    const page = createBookingsPage([{
        _id: 'booking-123',
        status: 'completed',
        preferredStartDate: '2026-11-20T00:00:00.000Z',
        estimateSnapshot: { breakdown: { total: 50799 } },
        address: { line: 'Test Road', city: 'Test City', pincode: '123456' }
    }], { booking: { review: review } });
    await waitForBookings();

    const form = findElements(page.bookingList, function (element) { return element.tagName === 'form'; })[0];
    const ratingInputs = findElements(form, function (element) { return element.type === 'radio'; });
    ratingInputs[4].checked = true;
    const textarea = findElements(form, function (element) { return element.tagName === 'textarea'; })[0];
    textarea.value = review.experience;

    await form.listeners.submit({ preventDefault: function () {} });

    assert.equal(page.requests[1].url, '/api/bookings/booking-123/review');
    assert.equal(page.requests[1].options.method, 'POST');
    assert.deepEqual(JSON.parse(page.requests[1].options.body), review);
    assert.equal(findElements(page.bookingList, function (element) { return element.tagName === 'form'; }).length, 0);
    assert.match(getText(page.bookingList), /5 \/ 5 stars/);
    assert.match(getText(page.bookingList), /Careful work and a tidy finish\./);
});

test('bookings that are not completed do not show the review form', async function () {
    const page = createBookingsPage([{
        _id: 'booking-456',
        status: 'confirmed',
        preferredStartDate: '2026-11-20T00:00:00.000Z',
        estimateSnapshot: { breakdown: { total: 50799 } },
        address: { line: 'Test Road', city: 'Test City', pincode: '123456' }
    }]);
    await waitForBookings();

    assert.equal(findElements(page.bookingList, function (element) { return element.tagName === 'form'; }).length, 0);
    assert.doesNotMatch(getText(page.bookingList), /How was the painting service\?/);
});