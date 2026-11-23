// Checks that signed-in users are sent to the correct page for their role.
const assert = require('node:assert/strict');
const test = require('node:test');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

const authScript = fs.readFileSync(path.join(__dirname, '../public/js/auth.js'), 'utf8');
const homeScript = fs.readFileSync(path.join(__dirname, '../public/js/home.js'), 'utf8');

// Loads the auth script with the smallest browser state needed for navigation.
function makeAuthContext() {
    const storedValues = {};
    const browser = {
        localStorage: {
            setItem: function (key, value) {
                storedValues[key] = value;
            }
        },
        location: { href: '' }
    };
    const context = vm.createContext({
        window: browser,
        document: { getElementById: function () { return null; } }
    });
    vm.runInContext(authScript, context);
    return { context: context, browser: browser, storedValues: storedValues };
}

test('administrator sign-in opens the admin dashboard', function () {
    const auth = makeAuthContext();
    auth.context.finishSignIn({ token: 'test-token', user: { role: 'admin' } });

    assert.equal(auth.browser.location.href, '/admin.html');
    assert.equal(auth.storedValues.token, 'test-token');
});

test('customer sign-in opens the estimator', function () {
    const auth = makeAuthContext();
    auth.context.finishSignIn({ token: 'test-token', user: { role: 'customer' } });

    assert.equal(auth.browser.location.href, '/estimator.html');
});

// Shows the admin shortcut only when both token and admin role are stored.
function makeHomeContext(token, account) {
    const adminLink = { hidden: true };
    const storage = {
        token: token,
        user: account ? JSON.stringify(account) : null
    };
    const context = vm.createContext({
        window: {
            localStorage: {
                getItem: function (key) {
                    return storage[key];
                },
                removeItem: function (key) {
                    delete storage[key];
                }
            }
        },
        document: {
            getElementById: function () {
                return adminLink;
            }
        }
    });

    vm.runInContext(homeScript, context);
    return adminLink;
}

test('admin home shortcut requires an active token and admin role', function () {
    assert.equal(makeHomeContext('test-token', { role: 'admin' }).hidden, false);
    assert.equal(makeHomeContext(null, { role: 'admin' }).hidden, true);
    assert.equal(makeHomeContext('test-token', { role: 'customer' }).hidden, true);
});