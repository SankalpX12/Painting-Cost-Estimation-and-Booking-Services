// Loads administrator data and sends booking and rate changes to the API.
const adminMessage = document.getElementById('admin-message');
const adminContent = document.getElementById('admin-content');
const adminBookingList = document.getElementById('admin-booking-list');
const adminRateMessage = document.getElementById('admin-rate-message');

// Sends an authorized request and returns its JSON response.
async function sendAdminRequest(path, method, values) {
    const headers = {
        Authorization: 'Bearer ' + window.localStorage.getItem('token')
    };
    const options = {
        method: method,
        headers: headers
    };

    if (values) {
        headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(values);
    }

    const response = await fetch(path, options);
    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.message || 'Administrator request failed.');
    }

    return result;
}

// Shows a message when an administrator request fails.
function showAdminMessage(message) {
    adminMessage.textContent = message;
    adminMessage.hidden = false;
}

// Creates one booking row with an administrator status selector.
function createAdminBooking(booking) {
    const item = document.createElement('article');
    item.className = 'saved-estimate';
    const heading = document.createElement('div');
    heading.className = 'saved-estimate-heading';
    const title = document.createElement('h3');
    title.textContent = booking.contact.name + ' · ' + booking.address.city;
    const total = document.createElement('strong');
    total.textContent = '₹' + new Intl.NumberFormat('en-IN').format(booking.estimateSnapshot.breakdown.total);
    heading.appendChild(title);
    heading.appendChild(total);

    const detail = document.createElement('p');
    detail.textContent = booking.contact.email + ' · ' + booking.contact.phone + ' · ' + new Date(booking.preferredStartDate).toLocaleDateString('en-IN');

    const controls = document.createElement('div');
    controls.className = 'admin-booking-controls';
    const statusSelect = document.createElement('select');
    statusSelect.setAttribute('aria-label', 'Booking status');
    const statuses = ['pending', 'confirmed', 'completed', 'cancelled'];

    for (let index = 0; index < statuses.length; index += 1) {
        const option = document.createElement('option');
        option.value = statuses[index];
        option.textContent = statuses[index];
        statusSelect.appendChild(option);
    }

    statusSelect.value = booking.status;
    const updateButton = document.createElement('button');
    updateButton.className = 'button button-secondary';
    updateButton.type = 'button';
    updateButton.textContent = 'Update status';
    updateButton.addEventListener('click', async function () {
        updateButton.disabled = true;

        try {
            await sendAdminRequest('/api/admin/bookings/' + encodeURIComponent(booking._id) + '/status', 'PATCH', {
                status: statusSelect.value
            });
            booking.status = statusSelect.value;
            adminRateMessage.textContent = 'Booking status updated.';
            adminRateMessage.hidden = false;
        } catch (error) {
            showAdminMessage(error.message);
        } finally {
            updateButton.disabled = false;
        }
    });

    controls.appendChild(statusSelect);
    controls.appendChild(updateButton);
    item.appendChild(heading);
    item.appendChild(detail);
    item.appendChild(controls);
    return item;
}

// Loads all current rates into the administrator form.
async function loadAdminRates() {
    const response = await fetch('/api/settings');

    if (!response.ok) {
        throw new Error('Could not load the current rates.');
    }

    const settings = await response.json();
    const keys = ['economy', 'premium', 'luxury'];

    for (let index = 0; index < keys.length; index += 1) {
        const key = keys[index];
        document.getElementById(key + '-paint').value = settings.qualities[key].paint;
        document.getElementById(key + '-labour').value = settings.qualities[key].labour;
        document.getElementById(key + '-stars').value = settings.qualities[key].stars;
    }

    document.getElementById('putty-rate').value = settings.puttyRate;
    document.getElementById('primer-rate').value = settings.primerRate;
    document.getElementById('design-rate').value = settings.customDesignRatePerSqFt;
    document.getElementById('colour-fee').value = settings.extraColourFee;
}

// Saves edited rates without changing fixed home-area and opening defaults.
async function saveAdminRates(event) {
    event.preventDefault();
    adminRateMessage.hidden = true;
    const values = {
        qualities: {},
        puttyRate: document.getElementById('putty-rate').value,
        primerRate: document.getElementById('primer-rate').value,
        customDesignRatePerSqFt: document.getElementById('design-rate').value,
        extraColourFee: document.getElementById('colour-fee').value
    };
    const keys = ['economy', 'premium', 'luxury'];

    for (let index = 0; index < keys.length; index += 1) {
        const key = keys[index];
        values.qualities[key] = {
            paint: document.getElementById(key + '-paint').value,
            labour: document.getElementById(key + '-labour').value,
            stars: document.getElementById(key + '-stars').value
        };
    }

    try {
        await sendAdminRequest('/api/admin/settings', 'PUT', values);
        adminRateMessage.textContent = 'Rates saved.';
        adminRateMessage.hidden = false;
    } catch (error) {
        adminRateMessage.textContent = error.message;
        adminRateMessage.hidden = false;
    }
}

// Confirms administrator access before loading sensitive dashboard data.
async function startAdminDashboard() {
    const token = window.localStorage.getItem('token');

    if (!token) {
        window.location.href = '/login.html';
        return;
    }

    try {
        const account = await sendAdminRequest('/api/auth/me', 'GET');

        if (account.user.role !== 'admin') {
            showAdminMessage('This page is for administrator accounts.');
            return;
        }

        const result = await sendAdminRequest('/api/admin/bookings', 'GET');
        adminMessage.hidden = true;
        adminContent.hidden = false;

        if (result.bookings.length === 0) {
            adminBookingList.textContent = 'No bookings yet.';
        } else {
            for (let index = 0; index < result.bookings.length; index += 1) {
                adminBookingList.appendChild(createAdminBooking(result.bookings[index]));
            }
        }

        await loadAdminRates();
    } catch (error) {
        showAdminMessage(error.message || 'Could not load administrator data.');
    }
}

// Clears the administrator token and returns to the home page.
function signOutAdmin() {
    window.localStorage.removeItem('token');
    window.localStorage.removeItem('user');
    window.location.href = '/';
}

document.getElementById('admin-rates-form').addEventListener('submit', saveAdminRates);
document.getElementById('admin-logout').addEventListener('click', signOutAdmin);
startAdminDashboard();