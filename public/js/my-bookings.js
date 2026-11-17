// Loads customer bookings and offers cancellation for pending requests.
const bookingList = document.getElementById('booking-list');
const bookingsMessage = document.getElementById('bookings-message');
const bookingCurrency = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0
});

// Shows a status message above the booking list.
function showBookingsMessage(message) {
    bookingsMessage.textContent = message;
    bookingsMessage.hidden = false;
}

// Sends a customer request with the stored sign-in token.
async function sendBookingRequest(path, method) {
    const response = await fetch(path, {
        method: method,
        headers: {
            Authorization: 'Bearer ' + window.localStorage.getItem('token')
        }
    });
    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.message || 'Could not load your bookings.');
    }

    return result;
}

// Builds a booking row with its status and allowed actions.
function createBookingItem(booking) {
    const item = document.createElement('article');
    item.className = 'saved-estimate';

    const heading = document.createElement('div');
    heading.className = 'saved-estimate-heading';
    const title = document.createElement('h2');
    title.textContent = 'Painting service · ' + new Date(booking.preferredStartDate).toLocaleDateString('en-IN');
    const total = document.createElement('strong');
    total.textContent = '₹' + bookingCurrency.format(booking.estimateSnapshot.breakdown.total);
    heading.appendChild(title);
    heading.appendChild(total);

    const details = document.createElement('p');
    details.textContent = booking.address.line + ', ' + booking.address.city + ' ' + booking.address.pincode;

    const status = document.createElement('p');
    status.className = 'booking-status';
    status.textContent = 'Status: ' + booking.status;

    item.appendChild(heading);
    item.appendChild(details);
    item.appendChild(status);

    if (booking.status === 'pending') {
        const cancelButton = document.createElement('button');
        cancelButton.className = 'button button-secondary';
        cancelButton.type = 'button';
        cancelButton.textContent = 'Cancel booking';
        cancelButton.addEventListener('click', async function () {
            cancelButton.disabled = true;

            try {
                const result = await sendBookingRequest('/api/bookings/' + encodeURIComponent(booking._id) + '/cancel', 'PATCH');
                status.textContent = 'Status: ' + result.booking.status;
                cancelButton.remove();
            } catch (error) {
                cancelButton.disabled = false;
                showBookingsMessage(error.message);
            }
        });

        item.appendChild(cancelButton);
    }

    return item;
}

// Loads only the signed-in customer's bookings.
async function loadCustomerBookings() {
    if (!window.localStorage.getItem('token')) {
        window.location.href = '/login.html';
        return;
    }

    try {
        const result = await sendBookingRequest('/api/bookings/mine', 'GET');

        if (result.bookings.length === 0) {
            showBookingsMessage('You have no bookings yet.');
            return;
        }

        bookingsMessage.hidden = true;

        for (let index = 0; index < result.bookings.length; index += 1) {
            bookingList.appendChild(createBookingItem(result.bookings[index]));
        }
    } catch (error) {
        showBookingsMessage(error.message || 'Could not load bookings. Check your connection and try again.');
    }
}

// Clears the login token and returns to the home page.
function signOutCustomer() {
    window.localStorage.removeItem('token');
    window.localStorage.removeItem('user');
    window.location.href = '/';
}

document.getElementById('bookings-logout').addEventListener('click', signOutCustomer);
loadCustomerBookings();