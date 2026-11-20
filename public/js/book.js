// Sends a current or saved estimate with the customer's booking details.
let selectedEstimate = null;

// Formats an amount using Indian digit grouping.
function formatBookingRupees(amount) {
    return '₹' + new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(amount);
}

// Loads the selected estimate and the signed-in customer's contact details.
async function prepareBookingPage() {
    if (!window.localStorage.getItem('token')) {
        window.location.href = '/login.html';
        return;
    }

    const savedEstimate = window.sessionStorage.getItem('savedEstimateToBook');
    const currentEstimate = window.sessionStorage.getItem('currentEstimateToBook');

    if (savedEstimate) {
        selectedEstimate = JSON.parse(savedEstimate);
    } else if (currentEstimate) {
        selectedEstimate = JSON.parse(currentEstimate);
    }

    if (!selectedEstimate) {
        document.getElementById('booking-estimate-summary').textContent = 'Select an estimate from the estimator or My Estimates first.';
        return;
    }

    const breakdown = selectedEstimate.breakdown;
    document.getElementById('booking-estimate-summary').textContent = 'Total estimate: ' + formatBookingRupees(breakdown.total);
    document.getElementById('booking-form').hidden = false;
    const dateInput = document.getElementById('booking-date');
    dateInput.min = new Date().toISOString().slice(0, 10);

    try {
        const response = await fetch('/api/auth/me', {
            headers: {
                Authorization: 'Bearer ' + window.localStorage.getItem('token')
            }
        });
        const result = await response.json();

        if (response.ok) {
            document.getElementById('booking-name').value = result.user.name;
            document.getElementById('booking-phone').value = result.user.phone;
            document.getElementById('booking-email').value = result.user.email;
        }
    } catch (error) {
        return;
    }
}

// Submits the selected estimate and booking details to the server.
async function submitBooking(event) {
    event.preventDefault();
    const errorMessage = document.getElementById('booking-error');
    const successMessage = document.getElementById('booking-success');
    const submitButton = document.querySelector('#booking-form button[type="submit"]');

    if (submitButton.disabled) {
        return;
    }

    submitButton.disabled = true;
    errorMessage.hidden = true;
    successMessage.hidden = true;

    const payload = {
        contact: {
            name: document.getElementById('booking-name').value,
            phone: document.getElementById('booking-phone').value,
            email: document.getElementById('booking-email').value
        },
        address: {
            line: document.getElementById('booking-address').value,
            city: document.getElementById('booking-city').value,
            pincode: document.getElementById('booking-pincode').value
        },
        preferredStartDate: document.getElementById('booking-date').value,
        notes: document.getElementById('booking-notes').value
    };

    if (selectedEstimate._id) {
        payload.estimateId = selectedEstimate._id;
    } else {
        payload.inputs = selectedEstimate.inputs;
        payload.breakdown = selectedEstimate.breakdown;
    }

    try {
        const response = await fetch('/api/bookings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: 'Bearer ' + window.localStorage.getItem('token')
            },
            body: JSON.stringify(payload)
        });
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Could not submit the booking.');
        }

        window.sessionStorage.removeItem('savedEstimateToBook');
        window.sessionStorage.removeItem('currentEstimateToBook');
        window.location.href = '/my-bookings.html';
    } catch (error) {
        errorMessage.textContent = error.message || 'Could not connect to submit the booking.';
        errorMessage.hidden = false;
        submitButton.disabled = false;
    }
}

document.getElementById('booking-form').addEventListener('submit', submitBooking);
prepareBookingPage();